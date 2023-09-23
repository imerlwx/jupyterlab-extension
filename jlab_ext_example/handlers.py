# handler.py
import os
import re
import json
import isodate
import datetime
import requests
import openai
import sqlite3
import pandas as pd
from io import StringIO
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
previous_notebook = '[{"cell_type":"code","source":"","output_type":null}]'
bkt_params = {}


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
        data = self.get_json_body()
        video_id = data["videoId"]
        print(video_id)
        segments = get_segments(video_id)
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global llm, prompt, memory, conversation, VIDEO_ID, bkt_params, previous_notebook

        # Existing video_id logic
        data = self.get_json_body()
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        category = data["category"]
        segmentIndex = data["segmentIndex"]
        kernelType = data["kernelType"]
        skills_data = get_skills(video_id)
        action_outcome = get_action_outcome(video_id)
        action = action_outcome[segmentIndex]["action"]
        outcome = action_outcome[segmentIndex]["outcome"]
        if llm is None or prompt is None or memory is None or conversation is None:
            VIDEO_ID = video_id
            data = get_csv_from_youtube_video(video_id)
            init_bkt_params(video_id)
            initialize_chat_server(data, kernelType)

        if notebook:
            bkt_params = update_bkt_params(
                previous_notebook, notebook, skills_data, question
            )
            previous_notebook = notebook
            if category == "Self-exploration":
                category_params = bkt_params
            else:
                category_params = get_prob_mastery_by_category(
                    category, skills_data, bkt_params
                )
            input_data = {
                "notebook": notebook,
                "question": question,
                "current_category": category,
                "category_params": category_params,
                "action": action,
                "outcome": outcome,
            }
            results = conversation({"input": str(input_data)})["text"]
            self.finish(json.dumps(results))
        else:
            self.set_status(400)
            self.finish(json.dumps({"error": "No notebook file active"}))


class GoOnHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        video_id = data["videoId"]
        if video_id != "":
            segment_index = data["segmentIndex"]
            action_outcome = get_action_outcome(video_id)
            # action = action_outcome[segment_index]["action"]
            outcome = action_outcome[segment_index]["outcome"]
            input_data = {
                "outcome": outcome,
                "notebook": data["notebook"],
                "question": data["question"],
            }
            print(outcome)
            response = openai.ChatCompletion.create(
                model="gpt-4-32k",
                messages=[
                    {
                        "role": "system",
                        "content": """
                                    You are an experienced mentor in Exploratory Data Analysis (EDA). A student is learning EDA by watching an EDA tutorial video in David Robinson's Tidy Tuesday series.
                                    The video is divided into many segments. The input consists of the outcome that students should learn from this clip.
                                    Your task is to determine if the student's current performance, including the notebook content and output (important!), and the current answer in the chat, has meet the outcome of this clip.
                                    When the student completed the tasks required by outcome, although it may not be exactly the same, he can advance to the next video clip.
                                    Only output yes (for good enough) or no (for not ready).
                                    """,
                    },
                    {"role": "user", "content": str(input_data)},
                ],
            )
            result = response.choices[0].message["content"]
        else:
            result = "Something wrong with the video id."
        self.finish(json.dumps(result))


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
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS data_cache (
        video_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        download_url TEXT NOT NULL,
        attributes_info TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS skills_cache (
        video_id TEXT PRIMARY KEY,
        skills TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS action_outcome_cache (
        video_id TEXT PRIMARY KEY,
        action_outcome TEXT NOT NULL
    );"""
    )
    video_id = "nx5yhXAQLxw"
    skills_set = [
        {"category": "Load data/packages", "skill": "load data directly with an URL"},
        {"category": "Load data/packages", "skill": "load necessary packages for EDA"},
        {
            "category": "Initial observation on raw data",
            "skill": "inspect raw data in a new dataset",
        },
        {
            "category": "Initial observation on raw data",
            "skill": "explanatory analysis of different columns and their meanings",
        },
        {
            "category": "Data visualization",
            "skill": "use box plot to visualise the data",
        },
        {
            "category": "Chart interpretation/insights",
            "skill": "interpret box plots and histograms to draw insights",
        },
        {
            "category": "Data visualization",
            "skill": "use histograms to visualise the data",
        },
        {
            "category": "Chart interpretation/insights",
            "skill": "draw insights from visualizations and generate hypothesis",
        },
        {
            "category": "Data visualization",
            "skill": "use dot plot to visualise the data",
        },
        {
            "category": "Chart interpretation/insights",
            "skill": "identify outliers in the data",
        },
        {"category": "Data processing", "skill": "reorder, group and summarize data"},
        {"category": "Data visualization", "skill": "customize plot appearance"},
    ]
    skills_json = json.dumps(skills_set)
    segments_set = [
        {"category": "Introduction", "start": 1, "end": 120},
        {"category": "Load data/packages", "start": 121, "end": 220},
        {"category": "Initial observation on raw data", "start": 221, "end": 435},
        {"category": "Data visualization", "start": 436, "end": 463},
        {"category": "Chart interpretation/insights", "start": 464, "end": 512},
        {"category": "Data visualization", "start": 513, "end": 600},
        {"category": "Chart interpretation/insights", "start": 601, "end": 640},
        {"category": "Data visualization", "start": 641, "end": 695},
        {"category": "Chart interpretation/insights", "start": 696, "end": 720},
        {"category": "Data processing", "start": 721, "end": 780},
        {"category": "Data visualization", "start": 781, "end": 900},
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM skills_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO skills_cache (video_id, skills) VALUES (?, ?)",
            (video_id, skills_json),
        )
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )
    conn.commit()
    conn.close()


def initialize_chat_server(data, kernelType):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-32k", openai_api_key=OPENAI_API_KEY)

    # Prompt
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                """
                As an expert data science mentor focused on real-time guidance in Exploratory Data Analysis (EDA) on Jupyter notebooks during David Robinson's Tidy Tuesday tutorials,
                your role is to use Cognitive Apprenticeship to offer feedback, corrections, and suggestions based on the student's learning progress.
                The Cognitive Apprenticeship has the following six moves: modeling, coaching, scaffolding, articulation, reflection, and exploration.
                You have access to the dataset information ({data}) used in the video. The current video segment and its author David's action and outcome of the current segment will also be given.

                During different video segments, the moves you choose will differ. You need to adapt your mentorship style based on Bayesian Knowledge Tracing. Here are some guidelines for your interaction with the student in different scenarios:
                1. current_category: "Load data/packages"
                - (Scaffolding) When the probability of mastery is low (close to 0): Directly give the student the code to load necessary packages and explain the code to the student.
                - (Coaching) When the probability of mastery is high (close to 1): Tell the student to load packages and data and check whether the student's performance is correct.
                2. current_category: "Initial observation on raw data"
                - (Scaffolding) When the probability of mastery is low (close to 0): Share your own observations and tell the student the possible meaning of each data attribute.
                - (Coaching) When the probability of mastery is high (close to 1): Ask the student if he finds any data attributes attractive and encourage him to note down potential tasks.
                3. current_category: "Data processing"
                - (Scaffolding) When the probability of mastery is low (close to 0): Show how to do data processing on the data that are potentially useful for data visualization.
                - (Coaching) When the probability of mastery is high (close to 1): Ask the student if there is any data that needs to be processed before visualization and monitor his performance.
                - (Articulation) Ask the student questions about the choices made by David in the video to encourage critical thinking, such as why he processes those data attributes, not the others.
                4. current_category: "Data visualization"
                - (Scaffolding) When the probability of mastery is low (close to 0): Show how to make certain plots, including those made by David and those worthy of being drawn.
                - (Coaching) When the probability of mastery is high (close to 1): Ask the student if any data is necessary to be visualized, and provide feedback and support on their answers.
                - (Articulation) Ask the student questions about the choices made by David in the video to encourage critical thinking, such as why he makes a box plot.
                5. current_category: "Chart interpretation/insights"
                - (Scaffolding) When the probability of mastery is low (close to 0): Tell patterns and findings about the visualizations. And raise a new hypothesis from the plot that could lead to another visualization.
                - (Articulation) When the probability of mastery is high (close to 1): Encourage the student to look for patterns in the visualizations. Remind and provide hints for the student to draw another hypothesis.
                6. current_category: "Self-exploration"
                - (Exploration): Let the student think of additional tasks beyond what has been covered in the video and encourage the student to further explore his hypotheses.
                - (Scaffolding) When the probability of mastery is low (close to 0): Suggest tasks that can help improve the student's lowest-mastery-probability skills and break down the problem into steps and guide on how to approach it.
                - (Coaching) When the probability of mastery is high (close to 1): Ask the student to analyze the figure he made and look for patterns and share relevant resources or documentation to help the student with his tasks.
                - (Articulation) Encourage the student to draw findings, patterns, and hypotheses on the visualizations. And conclude what he has learned today.
                - (Reflection) If the student has done some visualizations, you can provide optimal approaches and solutions for him to compare with his own approach and solution.

                Notes:
                - You should interact in the first person as a mentor heuristically and briefly.
                - You give advice based on the programming language the student is currently using. He is now using {kernelType}.
                - Try to limit your teaching and assisting content to the actions and outcomes of the current category provided to you.
                - Do not describe the student's probability of mastery level for any skills to the student.
                """
            ).format(
                data=data,
                kernelType=kernelType,
            ),
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


def get_data_info_by_url(download_url):
    """Fetch the content of the data file URL."""
    response = requests.get(download_url)
    response.raise_for_status()  # Raise an error for failed requests

    # Convert the fetched content to a Pandas DataFrame
    csv_content = StringIO(response.content.decode("utf-8"))
    df = pd.read_csv(csv_content)

    # Gather the necessary information from this DataFrame
    attributes_info = {col: df[col].dtype for col in df.columns}

    return str(attributes_info)


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
        attributes_info = get_data_info_by_url(csv_file["download_url"])
        csv_list.append(
            {
                "name": csv_file["name"],
                "download_url": csv_file["download_url"],
                "attributes_info": attributes_info,
            }
        )

    return csv_list


def get_csv_from_youtube_video(video_id):
    """Get all the csv files corresponding to a video to a list of dict."""
    # Step 1: Check database first
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT * FROM data_cache WHERE video_id=?", (video_id,))
    rows = c.fetchall()
    csv_list = []
    if rows:  # Data exists in cache
        for row in rows:
            csv_list.append(
                {"name": row[1], "download_url": row[2], "attributes_info": row[3]}
            )
        return csv_list

    _, video_publish_date = get_youtube_info(video_id)
    closest_folder = get_closest_date_folder(video_publish_date)
    csv_list = get_csv_file(closest_folder)
    # Step 2: Save to database
    for csv_file in csv_list:
        c.execute(
            "INSERT INTO data_cache VALUES (?, ?, ?, ?)",
            (
                video_id,
                csv_file["name"],
                csv_file["download_url"],
                csv_file["attributes_info"],
            ),
        )
    conn.commit()
    conn.close()
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


def get_segments(video_id):
    """Get the segments file corresponding to a video from the database."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT segments FROM segments_cache WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        return json.loads(row[0])
    else:
        llm_response = get_video_segment(video_id)
        segments = [
            {"start": item["start"], "end": item["end"], "category": item["category"]}
            for item in llm_response
        ]
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, json.dumps(segments)),
        )
        conn.commit()
        conn.close()
        return segments


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
    youtube_title, publish_date = get_youtube_info(video_id)
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
                                {'category': 'Load data/packages', 'start': 103, 'end': 137}, 
                                {'category': 'Initial observation on raw data', 'start': 138, 'end': 220}, 
                                {'category': 'Data processing', 'start': 221, 'end': 568}, 
                                {'category': 'Data visualization', 'start': 569, 'end': 580}, 
                                {'category': 'Chart interpretation/insights', 'start': 581, 'end': 596},
                                {'category': 'Data visualization', 'start': 597, 'end': 655}, 
                                {'category': 'Chart interpretation/insights', 'start': 656, 'end': 680},
                                {'category': 'Data processing', 'start': 681, 'end': 715}, 
                                {'category': 'Chart interpretation/insights', 'start': 716, 'end': 740},
                                {'category': 'Data visualization', 'start': 741, 'end': 884}, 
                                {'category': 'Chart interpretation/insights', 'start': 885, 'end': 900}
                            ]""",
            },
            {"role": "user", "content": str(transcript_2)},
            {
                "role": "assistant",
                "content": """[
                                {'category': 'Introduction', 'start': 1, 'end': 120}, 
                                {'category': 'Load data/packages', 'start': 121, 'end': 220}, 
                                {'category': 'Initial observation on raw data', 'start': 221, 'end': 435}, 
                                {'category': 'Data visualization', 'start': 436, 'end': 463}, 
                                {'category': 'Chart interpretation/insights', 'start': 464, 'end': 512},
                                {'category': 'Data visualization', 'start': 513, 'end': 600}, 
                                {'category': 'Chart interpretation/insights', 'start': 601, 'end': 640},
                                {'category': 'Data visualization', 'start': 641, 'end': 695}, 
                                {'category': 'Chart interpretation/insights', 'start': 696, 'end': 720},
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


def get_skills(video_id):
    """Summary all the EDA skills in the given tutorial video."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT skills FROM skills_cache WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        return json.loads(row[0])
    else:
        transcript_1 = get_transcript("nx5yhXAQLxw")
        segments_1 = get_segments("nx5yhXAQLxw")
        transcript_2 = get_transcript(video_id)
        segments_2 = get_segments(video_id)
        completion = openai.ChatCompletion.create(
            model="gpt-4-32k",
            messages=[
                {
                    "role": "system",
                    "content": f"""
                    You are an expert in Exploratory Data Analysis. Given the transcript of a tutorial video of EDA and the video segments, 
                    summarize !!all!! the EDA skills used in each category with no duplication. Each category may correspond to more than one skill.
                    note: Don't be too specific on the skills. If two skills are the same operation but on different tasks, they should be the same skill.
                    """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {transcript_1}, segments: {segments_1}",
                },
                {
                    "role": "assistant",
                    "content": """
                    [
                        {"category": "Load data/packages", "skill": "load data directly with an URL"},
                        {"category": "Load data/packages", "skill": "load necessary packages for EDA"},
                        {"category": "Initial observation on raw data", "skill": "inspect raw data in a new dataset": "},
                        {"category": "Initial observation on raw data", "skill": "explanatory analysis of different columns and their meanings"},
                        {"category": "Data visualization", "skill": "use box plot to visualise the data"},
                        {"category": "Chart interpretation/insights", "skill": "interpret box plots and histograms to draw insights"},
                        {"category": "Data visualization", "skill": "use histograms to visualise the data"},
                        {"category": "Chart interpretation/insights", "skill": "draw insights from visualizations and generate hypothesis"},
                        {"category": "Data visualization", "skill": "use dot plot to visualise the data"},
                        {"category": "Chart interpretation/insights", "skill": "identify outliers in the data"},
                        {"category": "Data processing", "skill": "reorder, group and summarize data"},
                        {"category": "Data visualization", "skill": "customize plot appearance"}
                    ]
                    """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {transcript_2}, segments: {segments_2}",
                },
            ],
            temperature=0.5,
        )
        skills_data = completion.choices[0].message["content"]
        c.execute("INSERT INTO skills_cache VALUES (?, ?)", (video_id, skills_data))
        conn.commit()
        conn.close()
    return json.loads(skills_data)


def get_action_outcome(video_id):
    """Get action and outcome for each segment in the given tutorial video."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT action_outcome FROM action_outcome_cache WHERE video_id = ?",
        (video_id,),
    )
    row = c.fetchone()
    if row:
        return json.loads(row[0])
    else:
        transcript = get_transcript(video_id)
        segments = get_segments(video_id)
        completion = openai.ChatCompletion.create(
            model="gpt-4-32k",
            messages=[
                {
                    "role": "system",
                    "content": """
                    Your task is to summarize the actions and outcomes of each segment in a tutorial video on Exploratory Data Analysis (EDA). Given the transcript of the video and the corresponding video segments, you should provide a response in the following format:
                    [
                        {"category": "Introduction", "action": "...", "outcome": "..."},
                        {"category": "Load data/packages", "action": "...", "outcome": "..."},
                        ...
                    ]
                    Please analyze the tutorial video and transcript carefully to identify the main categories of actions and outcomes in the video. For each category, provide a concise description of the action taken by the author and the resulting outcome.
                    Your summary should accurately reflect the content of the video and transcript, providing a clear and informative overview of the EDA process.
                    Please note that your response should be flexible enough to accommodate various video segments and actions, ensuring that you capture the key actions and outcomes in each segment accurately.
                    """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {transcript}, segments: {segments}",
                },
            ],
            temperature=0.5,
        )
        action_outcome = completion.choices[0].message["content"]
        c.execute(
            "INSERT INTO action_outcome_cache VALUES (?, ?)", (video_id, action_outcome)
        )
        conn.commit()
        conn.close()
    return json.loads(action_outcome)


def init_bkt_params(video_id):
    """Initialize the bkt parameters for the given video."""
    global bkt_params
    skills_data = get_skills(video_id)
    # Iterating through the original data to populate the new data structure
    for i, skill_item in enumerate(skills_data):
        bkt_params[skill_item["skill"]] = {
            "probMastery": 0.1,
            "probTransit": 0.1,
            "probSlip": 0.1,
            "probGuess": 0.1,
        }


def update_bkt_param(model, is_correct):
    """Update the bkt parameters for the given skills."""
    if is_correct == "true" or is_correct == "True":
        numerator = model["probMastery"] * (1 - model["probSlip"])
        mastery_and_guess = (1 - model["probMastery"]) * model["probGuess"]
    else:
        numerator = model["probMastery"] * model["probSlip"]
        mastery_and_guess = (1 - model["probMastery"]) * (1 - model["probGuess"])

    prob_mastery_given_observation = numerator / (numerator + mastery_and_guess)
    model["probMastery"] = prob_mastery_given_observation + (
        (1 - prob_mastery_given_observation) * model["probTransit"]
    )


def update_bkt_params(previous_notebook, current_notebook, skills_data, question):
    """Update the bkt parameters for the practiced skills."""
    global bkt_params
    completion = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": """You are an expert in Exploratory Data Analysis. The student is practicing EDA in the Jupyter notebook.
                Now your role is to find out the skills the student practiced during the last training period and whether the student's performance is correct (true) or incorrect (false) on the skills.
                The last training period is the period between the previous notebook and the current notebook, and the student's message in the chat. You only need to find out the skills in the given skill set {}. 
                If a skill is not practiced in the last period or has been practiced in the previous notebook, don't include it in the answer. If no skill is being practiced in the last period, then return a empty list.
                """.format(
                    skills_data
                ),
            },
            {
                "role": "user",
                "content": """
                previous_notebook: '[{"cell_type":"code","source":"library(tidyverse)\n recent_grads <- read_csv("https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018-10-16/recent-grads.csv")","output_type":null}]',
                current_notebook: '[{"cell_type":"code","source":"library(tidyverse)\n recent_grads <- read_csv("https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018-10-16/recent-grads.csv")\n majors_processed <- recent_grads %>%\n arrange(desc(Median)) %>%\n mutate(Major = str_to_title(Major),\n Major = fct_reorder(Major, Median))","output_type":null}]',
                question: '',
                """,
            },
            {
                "role": "assistant",
                "content": """
                [
                    {"reorder, group and summarize data": "true"}
                ]
                """,
            },
            {
                "role": "user",
                "content": """
                previous_notebook: '[{"cell_type":"code","source":"","output_type":null}]',
                current_notebook = '[{"cell_type":"code","source":"load(tidyverse)","output_type":null}]',
                question: '',
                """,
            },
            {
                "role": "assistant",
                "content": """
                [
                    {"load data/packages in R": "false"}
                ]
                """,
            },
            {
                "role": "user",
                "content": """
                previous_notebook: {},
                current_notebook: {},
                question: {}
                """.format(
                    previous_notebook, current_notebook, question
                ),
            },
        ],
    )
    models = json.loads(completion.choices[0].message["content"])
    for model in models:
        for key, value in model.items():
            print(key, value)
            if key in bkt_params.keys():
                update_bkt_param(bkt_params[key], value)
    return bkt_params


def get_prob_mastery_by_category(category, skill_category_list, skill_params_dict):
    """Get the probMastery of skills for the given category."""
    # Initialize an empty dictionary to store the results
    result_dict = {}

    # Loop through the list of dictionaries in 'skill_category_list'
    for skill_dict in skill_category_list:
        # Check if the 'category' field matches the given category
        if skill_dict["category"] == category:
            # Extract the 'skill' field from the dictionary
            skill = skill_dict["skill"]

            # Retrieve the corresponding probMastery from 'skill_params_dict'
            prob_mastery = skill_params_dict.get(skill, {}).get("probMastery", None)

            # If probMastery exists for the skill, add it to the result dictionary
            if prob_mastery is not None:
                result_dict[skill] = prob_mastery

    return result_dict


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

    # Add route for getting go on or not response
    go_on_pattern = url_path_join(base_url, "jlab_ext_example", "go_on")
    handlers = [(go_on_pattern, GoOnHandler)]
    web_app.add_handlers(host_pattern, handlers)
