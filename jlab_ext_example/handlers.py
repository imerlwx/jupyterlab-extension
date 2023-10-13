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

# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
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
# previous_notebook = '[{"cell_type":"code","source":"","output_type":null}]'
notebook_at_begin_of_segment = '[{"cell_type":"code","source":"","output_type":null}]'
bkt_params = {}
user_id = "1"


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
        # print(video_id)
        segments = get_segments(video_id)
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global llm, prompt, memory, conversation, VIDEO_ID, bkt_params

        # Existing video_id logic
        data = self.get_json_body()
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        category = data["category"]
        segment_index = data["segmentIndex"]
        kernelType = data["kernelType"]
        skills_data = get_skill_by_segment(video_id, segment_index)
        action_outcome = get_action_outcome(video_id, segment_index)
        action = action_outcome["action"]
        outcome = action_outcome["outcome"]
        if llm is None or prompt is None or memory is None or conversation is None:
            VIDEO_ID = video_id
            data = get_csv_from_youtube_video(video_id)
            init_bkt_params()
            initialize_chat_server(data, kernelType)

        if notebook:
            bkt_params, _ = update_bkt_params(
                video_id, segment_index, "", question, kernelType
            )
            if category == "Self-exploration":
                # Extract all the probMastery values
                category_params = {
                    skill: params["probMastery"] for skill, params in bkt_params.items()
                }
            else:
                skills = list(skills_data.values())[0]
                category_params = {
                    {skill: bkt_params[skill]["probMastery"] for skill in skills.keys()}
                }
                # Loop through all categories in category_skill
                # for category, skills in skills_data.items():
                #     category_params = {
                #         skill: bkt_params[skill]["probMastery"]
                #         for skill in skills
                #         if skill in bkt_params
                #     }
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
        global notebook_at_begin_of_segment
        data = self.get_json_body()
        video_id = data["videoId"]
        if video_id != "":
            segment_index = data["segmentIndex"]
            action_outcome = get_action_outcome(video_id, segment_index)
            outcome = action_outcome["outcome"]
            notebook_update = get_diff_between_notebooks(
                notebook_at_begin_of_segment, data["notebook"]
            )
            input_data = {
                "outcome": outcome,
                "notebook": notebook_update,
                "question": data["question"],
            }
            # print(outcome)
            response = openai.ChatCompletion.create(
                model="gpt-4-32k",
                messages=[
                    {
                        "role": "system",
                        "content": """
                                    You are an expert in Exploratory Data Analysis (EDA) and good at assisting student learn EDA.
                                    A student is learning EDA by watching an EDA tutorial video segment in David Robinson's Tidy Tuesday series.
                                    The input consists of the student's performance, including the notebook content, current answer in the chat, and the outcome that students should learn from the current video segment.
                                    Your task is to determine if the student's current performance has meet the outcome of the current video segment.
                                    Only output yes (for good enough) or no (for not ready).
                                    """,
                    },
                    {"role": "user", "content": str(input_data)},
                ],
            )
            result = response.choices[0].message["content"]
            # If the student's performance is good enough, update the notebook_at_begin_of_segment
            if result.lower() == "yes":
                notebook_at_begin_of_segment = data["notebook"]
        else:
            result = "Something wrong with the video id."
        self.finish(json.dumps(result))


class UpdateBKTHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global bkt_params
        data = self.get_json_body()
        video_id = data["videoId"]
        cell_content = data["cell"]
        cell_output = data["output"]
        print(cell_content)
        print(cell_output[0]["name"])
        # print(type(cell_output))
        if video_id != "":
            _, models = update_bkt_params(
                video_id,
                data["segmentIndex"],
                cell_content,
                data["question"],
                data["kernelType"],
            )
            # previous_notebook = data["notebook"]
            # Parse the JSON string
            # notebook_cells = json.loads(data["notebook"])
            # Check if "error" exists in any "output_type" field
            if cell_output[0]["name"] == "error":
                contains_error = True
            # contains_error = any(
            #     cell.get("output_type") == "error" for cell in notebook_cells
            # )
            # Check if student does something wrong
            found = any("false" in model.values() for model in models)
            # If student does anything wrong or the code has any errors, return True
            contains_error_or_false = contains_error or found
            self.finish(json.dumps(contains_error_or_false))
        else:
            print("Something wrong in UpdateBKTHandler.")


def initialze_database():
    """Initialize the database that has the transcript and segments for videos."""
    global user_id
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
        video_id TEXT,
        name TEXT NOT NULL,
        download_url TEXT NOT NULL,
        attributes_info TEXT NOT NULL,
        PRIMARY KEY (video_id, name)
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS skills_cache (
        video_id TEXT PRIMARY KEY,
        segment_index NUMBER NOT NULL,
        skills TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS bkt_params_cache (
        user_id TEXT PRIMARY KEY,
        skills_probMastery TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS action_outcome_cache (
        video_id TEXT,
        segment_index NUMBER NOT NULL,
        action_outcome TEXT NOT NULL,
        PRIMARY KEY (video_id, segment_index)
    );"""
    )
    video_id = "nx5yhXAQLxw"
    all_skills = [
        "Load data directly with a URL",
        "Load necessary packages for EDA",
        "Understanding column definitions",
        "Making assumptions based on data",
        "Use box plot to visualize the data",
        "Use histograms to visualize the data",
        "Use dot plot to visualize the data",
        "Customize plot appearance",
        "Interpret visualizations",
        "Generate intent for the next visualization",
        "Identify outliers in the data",
        "Reorder data",
        "Group and summarize data",
    ]
    segments_set = [
        {"category": "Introduction", "start": 1, "end": 113},
        {"category": "Load data/packages", "start": 113, "end": 212},
        {"category": "Initial observation on raw data", "start": 212, "end": 418},
        {"category": "Data visualization", "start": 418, "end": 463},
        {"category": "Chart interpretation/insights", "start": 463, "end": 507},
        {"category": "Data visualization", "start": 507, "end": 601},
        {"category": "Chart interpretation/insights", "start": 601, "end": 640},
        {"category": "Data visualization", "start": 640, "end": 692},
        {"category": "Chart interpretation/insights", "start": 692, "end": 740},
        {"category": "Data processing", "start": 740, "end": 839},
        {"category": "Data visualization", "start": 839, "end": 900},
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )
    c.execute("SELECT * FROM bkt_params_cache WHERE user_id = ?", (user_id,))
    if c.fetchone() is None:
        prob_mastery = {skill: 0.1 for skill in all_skills}
        prob_mastery_json = json.dumps(prob_mastery)
        c.execute(
            "INSERT INTO bkt_params_cache (user_id, skills_probMastery) VALUES (?, ?)",
            (user_id, prob_mastery_json),
        )
    conn.commit()
    conn.close()


def initialize_chat_server(data, kernelType):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-32k", openai_api_key=OPENAI_API_KEY)
    if kernelType == "ir":
        kernelType = "R"
    elif kernelType == "python3":
        kernelType = "Python"

    # Prompt
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                """
                As an expert data science mentor focused on real-time guidance in Exploratory Data Analysis (EDA) on Jupyter notebooks during David Robinson's Tidy Tuesday tutorials,
                your role is to use Cognitive Apprenticeship to offer feedback, corrections, and suggestions based on the student's learning progress.
                You have access to the dataset information ({data}) used in the video. The current video segment category and its author David's action and what the student should learn (outcome) from the current segment will also be given.
                The student's performance (notebook and question) and mastery probability of each skill will be given. The mastery probability is a number between 0 and 1, indicating the probability that the student has mastered the skill.

                The Cognitive Apprenticeship has the following six moves: modeling, coaching, scaffolding, articulation, reflection, and exploration. During different video segments, the moves you choose will differ.
                You need to adapt your mentorship style based on Bayesian Knowledge Tracing. Here are some guidelines for your interaction with the student in different scenarios:
                1. current_category: "Load data/packages"
                - (Scaffolding) When the probability of mastery is low (close to 0): Directly give the student the code to load necessary packages and data and explain the code to the student.
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
                - Limit your teaching and assisting content to the actions and outcomes of the current category provided to you.
                - If you are gonna provide some code to the student, please include the code in a code block.
                - Do not describe the student's probability of mastery level for any skills and learning status to the student.
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
        conn.commit()
        conn.close()
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


def get_transcript(video_id, end=900):
    """Get the transcript file corresponding to a video from the database."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT transcript FROM transcript_cache WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        conn.commit()
        conn.close()
        return json.loads(row[0])
    else:
        data = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = [i for i in data if i["start"] + i["duration"] < end]
        for item in transcript:
            del item["duration"]
        c.execute(
            "INSERT INTO transcript_cache (video_id, transcript) VALUES (?, ?)",
            (video_id, json.dumps(transcript)),
        )
        conn.commit()
        conn.close()
        return transcript


def get_segment_transcript(video_id, start, end, category):
    """Get the transcript file based on the video start and end time."""
    data = YouTubeTranscriptApi.get_transcript(video_id)
    transcript = [
        i for i in data if i["start"] >= start and i["start"] + i["duration"] < end
    ]
    for item in transcript:
        del item["duration"]
    # Use list comprehension to extract the 'text' values
    texts = [item["text"] for item in transcript]

    # Join the list of strings with spaces
    paragraph = " ".join(texts)
    return {"category": category, "transcript": paragraph}


def get_segments(video_id):
    """Get the segments file corresponding to a video from the database."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT segments FROM segments_cache WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        conn.commit()
        conn.close()
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
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute("SELECT * FROM code_cache WHERE video_id=?", (video_id,))
    row = c.fetchone()
    if row:
        conn.commit()
        conn.close()
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
                            - Avoid stopping the clip in the middle of a sentence.

                            Your response should provide the start and end times in seconds for each segment within each category, ensuring that the segments correspond accurately to the content of the video transcript.
                            """,
            },
            {"role": "user", "content": str(transcript_1)},
            {
                "role": "assistant",
                "content": """[
                                {'category': 'Introduction', 'start': 1, 'end': 102},
                                {'category': 'Load data/packages', 'start': 102, 'end': 140},
                                {'category': 'Initial observation on raw data', 'start': 140, 'end': 218},
                                {'category': 'Data processing', 'start': 218, 'end': 571},
                                {'category': 'Data visualization', 'start': 571, 'end': 583},
                                {'category': 'Chart interpretation/insights', 'start': 583, 'end': 592},
                                {'category': 'Data processing', 'start': 593, 'end': 612},
                                {'category': 'Data visualization', 'start': 612, 'end': 653},
                                {'category': 'Chart interpretation/insights', 'start': 653, 'end': 679},
                                {'category': 'Data processing', 'start': 679, 'end': 715},
                                {'category': 'Chart interpretation/insights', 'start': 716, 'end': 743},
                                {'category': 'Data visualization', 'start': 743, 'end': 884},
                                {'category': 'Chart interpretation/insights', 'start': 884, 'end': 900}
                            ]""",
            },
            {"role": "user", "content": str(transcript_2)},
            {
                "role": "assistant",
                "content": """[
                                {'category': 'Introduction', 'start': 1, 'end': 113},
                                {'category': 'Load data/packages', 'start': 113, 'end': 212},
                                {'category': 'Initial observation on raw data', 'start': 212, 'end': 418},
                                {'category': 'Data visualization', 'start': 418, 'end': 463},
                                {'category': 'Chart interpretation/insights', 'start': 463, 'end': 507},
                                {'category': 'Data visualization', 'start': 507, 'end': 602},
                                {'category': 'Chart interpretation/insights', 'start': 602, 'end': 640},
                                {'category': 'Data visualization', 'start': 640, 'end': 693},
                                {'category': 'Chart interpretation/insights', 'start': 693, 'end': 740},
                                {'category': 'Data processing', 'start': 740, 'end': 839},
                                {'category': 'Data visualization', 'start': 839, 'end': 900}
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
        transcript_2 = get_transcript(video_id)
        completion = openai.ChatCompletion.create(
            model="gpt-4-32k",
            messages=[
                {
                    "role": "system",
                    "content": f"""
                    You are an expert in Exploratory Data Analysis. Given the transcript of an EDA tutorial video, summarize all the EDA skills used with no duplication for each category.
                    Note: If two skills have similar operation or one skill contains another, they should be the same skill. And use the same expression for the same skill as much as possible.
                    """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {transcript_1}",
                },
                {
                    "role": "assistant",
                    "content": """
                    {
                        "Load data/packages": ["Load data directly with an URL", "Load necessary packages for EDA"], 
                        "Initial observation on raw data": ["Understanding column definitions", "Making assumptions based on data"],
                        "Data visualization": ["Use box plot to visualise the data", "Use histograms to visualise the data", "Use dot plot to visualise the data", "Customize plot appearance"],
                        "Chart interpretation/insights": ["Interpret visualizations", "Generate hypotheses for the next visualization", "Identify outliers in the data"],
                        "Data processing": ["Reorder data", "Group and summarize data"]
                    }
                    """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {transcript_2}",
                },
            ],
            temperature=0.5,
        )
        skills_data = completion.choices[0].message["content"]
        c.execute("INSERT INTO skills_cache VALUES (?, ?)", (video_id, skills_data))
        conn.commit()
        conn.close()
    return json.loads(skills_data)


def get_action_outcome(video_id, segment_index):
    """Get action and outcome for the current segment in the given tutorial video."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT action_outcome FROM action_outcome_cache WHERE video_id = ? AND segment_index = ?",
        (video_id, segment_index),
    )
    row = c.fetchone()
    if row:
        conn.commit()
        conn.close()
        return json.loads(row[0])
    else:
        segment = get_segments(video_id)[segment_index]
        transcript = get_segment_transcript(
            video_id,
            start=segment["start"],
            end=segment["end"],
            category=segment["category"],
        )
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """
                    You are an expert in Exploratory Data Analysis (EDA) and good at assisting student learn EDA.
                    The student is watching a tutorial video segment of David Robinson's Tidy Tuesday series.
                    Provide a concise and accurate description of the action taken by David and what the student should learn by watching the video segment (outcome).
                    Response in the following format: {"action": "David Robinson does...", "outcome": "The student should learn..."}
                    """,
                },
                {
                    "role": "user",
                    "content": f"{transcript}",
                },
            ],
            temperature=0.5,
        )
        action_outcome = completion.choices[0].message["content"]
        c.execute(
            "INSERT INTO action_outcome_cache VALUES (?, ?, ?)",
            (video_id, segment_index, action_outcome),
        )
        conn.commit()
        conn.close()
    return json.loads(action_outcome)


def init_bkt_params():
    """Initialize the bkt parameters for the given video."""
    global bkt_params, user_id
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT skills_probMastery FROM bkt_params_cache WHERE user_id = ?", (user_id,)
    )
    prob_mastery_dict = json.loads(c.fetchone()[0])
    # Iterating through the original data to populate the new data structure
    bkt_params = {
        skill: {
            "probMastery": prob_mastery_dict.get(skill, 0.1),
            "probTransit": 0.1,
            "probSlip": 0.1,
            "probGuess": 0.1,
        }
        for skill in prob_mastery_dict.keys()
    }
    conn.commit()
    conn.close()


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


def get_diff_between_notebooks(previous_notebook, current_notebook):
    """Returns the difference between the previous and current notebooks."""
    if previous_notebook == current_notebook:
        return []
    previous_content = json.loads(previous_notebook)
    current_content = json.loads(current_notebook)

    # Extract the source content from the code cells
    previous_source = set(
        cell["source"] for cell in previous_content if cell["cell_type"] == "code"
    )
    current_source = set(
        cell["source"] for cell in current_content if cell["cell_type"] == "code"
    )

    # Find the difference between the two sets
    diff = current_source - previous_source
    return list(diff)


def update_bkt_params(video_id, segment_index, cell_content, question, kernelType):
    """Update the bkt parameters for the practiced skills."""
    global bkt_params
    # diff = get_diff_between_notebooks(previous_notebook, current_notebook)
    # Get skills for the current segment
    # segment_skill is in this format: {"Load data/packages":
    # {'Load data directly with a URL': False, 'Load necessary packages for EDA': False}}
    segment_skill = get_skill_by_segment(video_id, segment_index)
    category = list(segment_skill.keys())[0]
    skills = list(list(segment_skill.values())[0].keys())
    if kernelType == "ir":
        kernelType = "R"
    elif kernelType == "python3":
        kernelType = "Python"
    # print(kernelType)

    completion = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": """"You are an expert in Exploratory Data Analysis (EDA) and good at assisting student learn EDA.
                Now your role is to find out the skills the student practiced during the last training period and whether the student is practicing the skills correctly or not.
                The computational notebook and the student's message in the chat during the last training period are input.
                You only need to find out the skills in the given skill set {}. Response with true for correctly practiced, false for incorrectly practiced.
                Correctly practiced means the student's code or answer demonstrated this skill. Incorrectly practiced means the code does not meet expectations or has errors or the answer is incorrect.
                Note: 
                Only include the skills that are being practiced by the student. If the skill is not being practiced, don't include it. If no skill is being practiced in the last period, then return a empty list.
                The student is using {} in the computational notebook.
                Output in this format:
                [
                    {{skill_name_1: True or False}},
                    {{skill_name_2: True or False}},
                    ...
                ]
                """.format(
                    kernelType, skills
                ),
            },
            {
                "role": "user",
                "content": """
                cell_content: {},
                question: {}
                """.format(
                    cell_content, question
                ),
            },
        ],
    )
    try:
        models = json.loads(completion.choices[0].message["content"])
        for model in models:
            for key, value in model.items():
                print(key, value)
                if key in segment_skill[category]:
                    segment_skill[category][key] = value
                if key in bkt_params.keys():
                    update_bkt_param(bkt_params[key], value)
        conn = sqlite3.connect("cache.db")
        c = conn.cursor()
        category_skill_json = json.dumps(segment_skill)
        c.execute(
            "UPDATE skills_cache SET skills = ? WHERE video_id = ? AND segment_index = ?",
            (category_skill_json, video_id, segment_index),
        )
        conn.commit()
        conn.close()
    except json.JSONDecodeError:
        print("Failed to decode JSON string.")
        models = []
    return bkt_params, models


def get_skill_by_segment(video_id, segment_index):
    """Get the skills corresponding to the given segment."""
    all_segment = get_segments(video_id)
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT skills_probMastery FROM bkt_params_cache WHERE user_id = ?", (user_id,)
    )
    prob_mastery_dict = json.loads(c.fetchone()[0])
    all_skill = list(prob_mastery_dict.keys())
    if segment_index >= len(all_segment):
        conn.commit()
        conn.close()
        return {"Self-exploration": all_skill}
    segment = all_segment[segment_index]
    segment_transcript = get_segment_transcript(
        video_id,
        start=segment["start"],
        end=segment["end"],
        category=segment["category"],
    )
    c.execute(
        "SELECT skills FROM skills_cache WHERE video_id = ? AND segment_index = ?",
        (
            video_id,
            segment_index,
        ),
    )
    row = c.fetchone()
    if row:
        conn.commit()
        conn.close()
        return json.loads(row[0])
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": """
                            You are an expert in Exploratory Data Analysis. Given the transcript of an EDA tutorial video segment, summarize all the EDA skills used.
                            Only choose the most relevant and main skills corresponding to the category. If a skill cannot be determined, do not include it.
                            If the skill is in the skill set, use the same expression. If the skill is not in the skill set, create a new skill.
                            Response in this format: [skill_1, skill_2, ...]
                            """,
            },
            {
                "role": "user",
                "content": f"transcript: {segment_transcript['transcript']}, skill set: {all_skill}",
            },
        ],
    )
    result = response.choices[0].message["content"]
    # Change to this format: {'Load data directly with a URL': False, ...}
    result = {item: False for item in json.loads(result.replace("'", '"'))}
    category_skill = {segment_transcript["category"]: result}
    category_skill_json = json.dumps(category_skill)
    # Insert new data if video_id doesn't exist
    c.execute(
        "INSERT INTO skills_cache (video_id, segment_index, skills) VALUES (?, ?, ?)",
        (video_id, segment_index, category_skill_json),
    )
    conn.commit()
    conn.close()
    return category_skill


def get_prob_mastery_by_category(category, skill_category_list, skill_params_dict):
    """Get the probMastery of skills for the given category."""
    skills = skill_category_list.get(category, [])
    return {
        skill: skill_params_dict[skill]["probMastery"]
        for skill in skills
        if skill in skill_params_dict
    }


def bkt_params_to_database():
    """Store the updated bkt parameters into database."""
    global bkt_params, user_id
    updated_prob_mastery = {
        key: value["probMastery"] for key, value in bkt_params.items()
    }
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT skills_probMastery FROM bkt_params_cache WHERE user_id = ?", (user_id,)
    )
    row = c.fetchone()
    existing_prob_mastery = json.loads(row[0])
    existing_prob_mastery.update(updated_prob_mastery)
    c.execute(
        "UPDATE bkt_params_cache SET skills_probMastery = ? WHERE user_id = ?",
        (json.dumps(existing_prob_mastery), user_id),
    )
    conn.commit()
    conn.close()


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

    # Add route for getting go on or not response
    update_bkt_pattern = url_path_join(base_url, "jlab_ext_example", "update_bkt")
    handlers = [(update_bkt_pattern, UpdateBKTHandler)]
    web_app.add_handlers(host_pattern, handlers)
