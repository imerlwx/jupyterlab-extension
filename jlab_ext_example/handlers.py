# handler.py
import os
import re
import json
import isodate
import datetime
import requests
import openai
import sqlite3
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationSummaryMemory

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
DATA_URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"
CODE_URL = "https://api.github.com/repos/dgrtwo/data-screencasts/contents/"

# Global state variables
VIDEO_ID = ""
llm = None
prompt = None
memory = None
conversation = None


class DataHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        video_id = data["videoId"]
        if not video_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "Missing video_id"}))
            return
        csv_data = get_csv_from_youtube_video(video_id)
        self.finish(json.dumps(csv_data))


class CodeHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        video_id = data["videoId"]
        if not video_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "Missing video_id"}))
            return
        code_file = get_code_file(video_id)
        # Download the file if not exists.
        if not os.path.exists(code_file["name"]):
            # Download the file
            response = requests.get(code_file["download_url"])

            if response.status_code == 200:
                # Save the file
                with open(code_file["name"], "wb") as f:
                    f.write(response.content)
        self.finish(json.dumps(code_file))


class SegmentHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(
            json.dumps({"data": "This is /jlab_ext_example/segments endpoint!"})
        )

    @tornado.web.authenticated
    def post(self):
        initialze_database()
        conn = sqlite3.connect("cache.db")
        c = conn.cursor()
        data = self.get_json_body()
        video_id = data["videoId"]
        if not video_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "Missing video_id"}))
            return
        c.execute("SELECT segments FROM segments_cache WHERE video_id = ?", (video_id,))
        row = c.fetchone()
        if row:
            segments = json.loads(row[0])
        else:
            llm_response = get_video_segment(video_id)
            segments = [
                {"start": item["start"], "end": item["end"], "name": item["category"]}
                for item in llm_response
            ]
            c.execute(
                "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
                (video_id, json.dumps(segments)),
            )
            conn.commit()
        conn.close()
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global llm, prompt, memory, conversation, VIDEO_ID

        # Existing video_id logic
        data = self.get_json_body()
        state = data["state"]
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        segments = data["segments"]
        results = {
            "state": state,
            "notebook": notebook,
            "question": question,
            "video_id": video_id,
            "segments": segments,
        }
        # self.finish(json.dumps(results))
        if (
            llm is None
            or prompt is None
            or memory is None
            or conversation is None
            or VIDEO_ID != video_id
        ):
            VIDEO_ID = video_id
            transcript = get_transcript(video_id)
            initialize_chat_server(transcript, segments)

        if state and notebook:
            input_data = {"state": state, "notebook": notebook, "question": question}
            results = conversation({"input": str(input_data)})["text"]
            self.finish(json.dumps(results))
        else:
            self.set_status(400)
            self.finish(
                json.dumps({"error": "No state input or no notebook file uploaded"})
            )


def initialze_database():
    """Initialize the database that has the transcript and segments for videos."""
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS transcript_cache (
        video_id TEXT PRIMARY KEY,
        transcript TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS segments_cache (
        video_id TEXT PRIMARY KEY,
        segments TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS code_cache (
        video_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        download_url TEXT NOT NULL
    );"""
    )
    conn.commit()
    conn.close()


def initialize_chat_server(transcript, segments):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-32k", openai_api_key=OPENAI_API_KEY)

    # Prompt
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                """
                You are an expert data scientist mentor specializing in assisting students with exploratory data analysis on a Jupyter notebook while watching a tutorial video in David Robinson's Tidy Tuesday series.
                You are also an expert who knows how to teach students in a cognitive apprenticeship way which has the following basic framework:

                PRINCIPLES FOR COGNITIVE APPRENTICESHIP
                ----------------------------------------------------------------
                METHOD — ways to promote the development of expertise
                ----------------------------------------------------------------
                Modeling: You perform a task so students can observe. In this process, the video will take over this role so you don't need to do anything.
                Coaching: As the student embarks on the task, you will observe the student's actions and offer real-time feedback, corrections, and encouragement. You will give prompts when the student deviates from the recommended path or provide positive reinforcement when the student is on the right track.
                Scaffolding: You will provide support to help the student perform a task. Students could also seek structured assistance from you. You can break the task into manageable pieces or provide hints to guide them through challenging portions of analysis.
                Articulation: You can encourage students to verbalize their knowledge and thinking. Students are encouraged to express their thoughts, hypotheses, and conclusions about the data. 
                Reflection: You enable students to compare their performance with others. After completing a task, you can provide optimal approaches and solutions for students to compare with their own approach and solution.
                Exploration: You can invite students to pose and solve their own problems. If they are of ideas, you can also provide scenarios, problems, or datasets and encourages students to carry out exploratory analysis without step-by-step guidance, fostering independence.
                ----------------------------------------------------------------
                SEQUENCING — keys to ordering learning activities
                ----------------------------------------------------------------
                Global before local skills: focus on conceptualizing the whole task before executing the parts
                Increasing complexity: meaningful tasks gradually increase in difficulty
                Increasing diversity: practice in a variety of situations to emphasize broad application
                Community of practice: communication about different ways to accomplish meaningful tasks
                Intrinsic motivation: students set personal goals to seek skills and solutions

                There are some example scenarios:
                1. Student just logs in to the interface (state: 0 seconds)
                You: Welcome to today's Tidy Tuesday project: analyzing college major & income data in R! I will lead you through a tutorial video by David Robinson. 
                    The video is segmented into several video clips, including Introduction, Load Data/Packages, Initial Observation of Raw Data, and a few tasks. 
                    Each task has three parts: Data Processing, Data Visualization, and Chart interpretation/Insights. While you can navigate through the parts you like, 
                    I recommend following the video progress to learn and imitate his Exploratory Data Analysis process and skills to do the task on your own.
                    While watching the video, keep asking yourself these three questions: what is he doing, why is he doing it, and how will success in what he is doing help him find a solution to the problem?

                2. Student follows the video to the initial observation of the raw data stage
                You: David Robinson feels interested in the major category and median salary. Do you find any data attributes that are interesting?
                Student: I find the unemployment rate and gender rate interesting. I may need to find out the relationship between these two.
                You: Cool! What are you going to do, data processing, or making some plots?

                3. Student is watching the video (state change constantly)
                You: Why does he make a boxplot rather than a line chart?
                Student: Because the bar chart could display 25th, 75th, and medium more intuitively.
                You: Correct!

                4. Student is writing some code on the Jupyter notebook (notebook content changes)
                You: The plot part does not look right. Try to plot a box plot rather than a line plot.
                (Student continues on writing codes)
                You: You are about to get the right answer! But you need to pay attention to the parameters in the "boxplot" function.

                5. Student has finished watching the tutorial video (state: 900 seconds)
                You: Can you think of more tasks that are not in the video to do?
                Student: I want to figure out the unemployment rate across different major categories.
                You: Great! Let's break this problem down. First, you need to think about how to segment the data by major categories.
                Student: By using the "groupby" function? But how to use that in Python?
                You: Correct! You can read the specs here [pandas.DataFrame.groupby](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html#pandas-dataframe-groupby)

                6. The video is over and students have no idea what to do next. (state: 900 seconds)
                You: How about trying to solve this: 'Analysis of unemployment rate across different major categories'?
                Student: Can you solve this task for me?
                You: I won't tell you directly the code to solve this. It is better that we dig into this task together, let us think about it step by step.

                7. Student just plots a new figure in the Jupyter notebook (notebook's cell output_type is "display_data")
                You: Do you see any pattern in this figure?
                Student: No...I guess I need to sort the medium salary from highest to lowest.
                You: Nice hypothesis! Now do it and try to find some patterns.
                (After student writes some codes and generate a new figure)
                Student: Engineering has the highest medium salary. While some liberal arts have lower pay.
                You: Excellent! Do you have another task in mind?

                8. Student just finishes a task (has done the data visulization and chart interpretation)
                Student: Can you show me a standard way to solve this task?
                You: To explore the correlation between the unemployment rate and the major category, you can use the Python libraries pandas, numpy, and matplotlib for data analysis and visualization.
                     Below is an example of Python code that calculates the average unemployment rate for each major category and then plots the results using a bar chart.
                     (Some python code)
                     Do you have any questions, comments, or concerns about my way? Please be as critical as possible.

                9. Student just finished some tasks (typically 1 ~ 3 tasks otherwise student want to continue training)
                You: Could you conclude what you have learned today?
                Student: I know how to use the boxplot.
                You: Yes, today we watched a video about analyzing college major & income data, in which David works on a task to find out the distribution of medium salary with major categories. You thought of a new task about the unemployment rate across different major categories and learned how to use the "groupby" function.

                You are given the complete transcript of the video: {transcript} and the segmented video clips: {segments}. 
                The video segments represent the basic learning process of exploratory data analysis: Understanding Data, Data Processing, Data Visualization, Chart Interpretation, Hypothesis Formulation
                The input to you will include three parts:
                - state: the current video state in seconds
                - notebook: the content of the student's Jupyter notebook in real-time
                - question: the student's question for you or the answer to your question

                You need to decide what to do next based on the state, the transcript, the current video segment, the real-time notebook, student's question, and your understanding of the whole system.
                Note:
                - You should treat me like a student and talk to me in the first person as a mentor and no need to describe the current state to me.
                - Act dynamically, creatively, heuristically, and briefly. Don't limit to the provided example scenarios and don't give standard answers directly.
                """
            ).format(transcript=transcript, segments=segments),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("input: {input}"),
        ]
    )

    memory = ConversationSummaryMemory(
        llm=llm, memory_key="chat_history", return_messages=True
    )

    global conversation
    conversation = LLMChain(llm=llm, prompt=prompt, verbose=True, memory=memory)


def iso8601_duration_as_seconds(duration):
    """Parse the duration of an ISO 8601 duration into seconds."""
    duration_obj = isodate.parse_duration(duration)
    return duration_obj.total_seconds()


def get_youtube_info(video_id):
    """Returns the published date of the given youtube video."""
    url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={YOUTUBE_API_KEY}"
    response = requests.get(url)
    data = response.json()
    title = data["items"][0]["snippet"]["title"]
    title = title.split(": ")[1]
    publish_date = data["items"][0]["snippet"]["publishedAt"]
    publish_date = publish_date.split("T")[0]
    return title, publish_date


def is_valid_date(date_string):
    """Judge if the input date is valid."""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_string):
        return True
    return False


def get_data(url):
    """Fetch data from given api."""
    response_API = requests.get(url)
    data = response_API.text
    data = json.loads(data)
    return data


def get_closest_date_folder(video_publish_date):
    """Get the cloeset date folder given all the folders in the github repo."""
    target_date = datetime.datetime.strptime(video_publish_date, "%Y-%m-%d")
    year_date = target_date.year
    url = DATA_URL + str(year_date)
    data = get_data(url)
    closest_folder = min(
        (
            folder
            for folder in data
            if is_valid_date(folder["name"])
            and datetime.datetime.strptime(folder["name"], "%Y-%m-%d") >= target_date
        ),  # Only when the video_publish_date is later than the data date will be searched
        key=lambda folder: abs(
            datetime.datetime.strptime(folder["name"], "%Y-%m-%d") - target_date
        ),
    )
    return closest_folder["url"]


def get_csv_file(folder):
    """Get all the csv files in the api folder to a list of dict."""
    data = get_data(folder)
    # Filter out items where 'name' ends with '.csv'
    csv_files = list(filter(lambda item: item["name"].endswith(".csv"), data))

    # Make a dictionary list that each item has this structure:
    # {'name': string, 'download_url': string}
    csv_list = []
    for csv_file in csv_files:
        csv_list.append(
            {"name": csv_file["name"], "download_url": csv_file["download_url"]}
        )

    return csv_list


def get_csv_from_youtube_video(video_id):
    """Get all the csv files corresponding to a video to a list of dict."""
    _, video_publish_date = get_youtube_info(video_id)
    closest_folder = get_closest_date_folder(video_publish_date)
    csv_list = get_csv_file(closest_folder)
    return csv_list


def get_transcript(video_id):
    """Get the transcript file corresponding to a video from the database."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT transcript FROM transcript_cache WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        return json.loads(row[0])
    else:
        data = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = [i for i in data if i["start"] < 900]
        for item in transcript:
            del item["duration"]
        c.execute(
            "INSERT INTO transcript_cache (video_id, transcript) VALUES (?, ?)",
            (video_id, json.dumps(transcript)),
        )
        conn.commit()
        conn.close()
        return transcript


def get_code_file(video_id):
    """Store the code file wrote by David in the video into database."""
    # Step 1: Check database first
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT * FROM code_cache WHERE video_id=?", (video_id,))
    row = c.fetchone()
    if row:  # Data exists in cache
        return {"name": row[1], "download_url": row[2]}

    code_files = get_data(CODE_URL)
    youtube_title, publish_date = get_youtube_info(YOUTUBE_API_KEY, video_id)
    # If the title contains a date
    publish_date = publish_date.replace("-", "_")

    for item in code_files:
        if item["name"].startswith(publish_date):
            code_file = {
                "name": item["name"],
                "download_url": item["download_url"],
            }
            return code_file

    # Prepare titles for vectorization
    titles = [
        item["name"] for item in code_files if not item["name"].startswith(publish_date)
    ]
    titles.append(youtube_title)

    # Vectorize the titles
    vectorizer = TfidfVectorizer().fit_transform(titles)

    # Compute cosine similarity
    vectors = vectorizer[:-1]
    yt_vector = vectorizer[-1]
    cosine_similarities = cosine_similarity(yt_vector, vectors).flatten()

    # Find the index of the highest similarity
    index = cosine_similarities.argmax()
    code_file = {
        "name": code_files[index]["name"],
        "download_url": code_files[index]["download_url"],
    }

    file_name = code_file["name"]
    download_url = code_file["download_url"]

    # Step 2: Save to database
    c.execute(
        "INSERT INTO code_cache VALUES (?, ?, ?)", (video_id, file_name, download_url)
    )
    conn.commit()
    conn.close()

    return code_file


def get_notebook_content():
    """Records the contents of the student's Jupyter notebook."""
    all_contents = {}
    for filename in os.listdir("."):
        if filename.endswith(".ipynb"):
            with open(filename, "r") as f:
                notebook = json.load(f)
            content = []
            for cell in notebook["cells"]:
                if cell["cell_type"] == "code":
                    content.append("Cell Content:")
                    content.append(cell["source"])
                    for output in cell.get("outputs", []):
                        if "text" in output:
                            content.append("Cell Output:")
                            content.append(output["text"])
            all_contents[filename] = content

    return all_contents


def get_video_segment(video_id):
    """Segment the given tutorial video into six pre-defined categories."""
    transcript_1 = get_transcript("Kd9BNI6QMmQ")
    transcript_2 = get_transcript("nx5yhXAQLxw")
    transcript_3 = get_transcript(video_id)

    completion = openai.ChatCompletion.create(
        model="gpt-4-32k",
        messages=[
            {
                "role": "system",
                "content": """
                            You are an expert transcript segment assistant specializing in segmenting video transcripts on the topic of exploratory data analysis. 

                            Your task is to segment a given video transcript of David Robinson's data exploratory analysis tutorial video into six categories: 
                            1. Introduction: David Robinson introduces himself, the Tidy Tuesday project, and the weekly dataset
                            2. Load data/packages: David Robinson loads the data of this week's Tidy Tuesday project, and imports some useful R package
                            3. Initial observation of raw data: David Robinson reads the data attributes and their definition, then proposes some hypotheses 
                            4. Data processing: David Robinson may do some data processing on some data attributes to produce a new data attribute that is better for data visualization
                            5. Data visualization: David Robinson proposes some data visualization intent, and uses R to make some plots using some exploratory data analysis skills
                            6. Chart interpretation/insights: David Robinson interprets the plots and produces some insights for the next data visualization

                            Your goal is to accurately identify and categorize segments of the transcript that correspond to each category. 

                            Please note that:
                            - You should not assume the example provided is the answer to the input transcript.
                            - You should not make any assumptions without the input transcript.
                            - You must not omit any video transcript segment.
                            - The output should include all time periods in integer seconds.
                            - Each category can have multiple time periods.
                            - You should not segment time that does not appear in the video.

                            Your response should provide the start and end times in seconds for each segment within each category, ensuring that the segments correspond accurately to the content of the video transcript.
                            """,
            },
            {"role": "user", "content": str(transcript_1)},
            {
                "role": "assistant",
                "content": """[
                                {'category': 'Introduction', 'start': 1, 'end': 102}, 
                                {'category': 'Load data / packages', 'start': 103, 'end': 137}, 
                                {'category': 'Initial observation on raw data', 'start': 138, 'end': 220}, 
                                {'category': 'Data processing', 'start': 221, 'end': 568}, 
                                {'category': 'Data visualization', 'start': 569, 'end': 580}, 
                                {'category': 'Chart interpretation / insights', 'start': 581, 'end': 596},
                                {'category': 'Data visualization', 'start': 597, 'end': 655}, 
                                {'category': 'Chart interpretation / insights', 'start': 656, 'end': 680},
                                {'category': 'Data processing', 'start': 681, 'end': 715}, 
                                {'category': 'Chart interpretation / insights', 'start': 716, 'end': 740},
                                {'category': 'Data visualization', 'start': 741, 'end': 884}, 
                                {'category': 'Chart interpretation / insights', 'start': 885, 'end': 900}
                            ]""",
            },
            {"role": "user", "content": str(transcript_2)},
            {
                "role": "assistant",
                "content": """[
                                {'category': 'Introduction', 'start': 1, 'end': 120}, 
                                {'category': 'Load data / packages', 'start': 121, 'end': 220}, 
                                {'category': 'Initial observation on raw data', 'start': 221, 'end': 435}, 
                                {'category': 'Data visualization', 'start': 436, 'end': 463}, 
                                {'category': 'Chart interpretation / insights', 'start': 464, 'end': 512},
                                {'category': 'Data visualization', 'start': 513, 'end': 600}, 
                                {'category': 'Chart interpretation / insights', 'start': 601, 'end': 640},
                                {'category': 'Data visualization', 'start': 641, 'end': 695}, 
                                {'category': 'Chart interpretation / insights', 'start': 696, 'end': 720},
                                {'category': 'Data processing', 'start': 721, 'end': 780}, 
                                {'category': 'Data visualization', 'start': 781, 'end': 900} 
                            ]""",
            },
            {"role": "user", "content": str(transcript_3)},
        ],
        temperature=0.5,
    )
    llm_response = completion.choices[0].message["content"]
    return json.loads(llm_response.replace("'", '"'))


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    # Add route for getting csv data
    data_pattern = url_path_join(base_url, "jlab_ext_example", "data")
    handlers = [(data_pattern, DataHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for getting video segments
    segment_pattern = url_path_join(base_url, "jlab_ext_example", "segments")
    handlers = [(segment_pattern, SegmentHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for getting code file
    code_pattern = url_path_join(base_url, "jlab_ext_example", "code")
    handlers = [(code_pattern, CodeHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for getting chat response
    chat_pattern = url_path_join(base_url, "jlab_ext_example", "chat")
    handlers = [(chat_pattern, ChatHandler)]
    web_app.add_handlers(host_pattern, handlers)
