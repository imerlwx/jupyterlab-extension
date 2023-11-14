# handler.py
import os
import re
import json
import math
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
bkt_params = {}
user_id = "1"
# previous_notebook = '[{"cell_type":"code","source":"","output_type":null}]'


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
        skills_with_false = []
        for skills in skills_data.values():
            for skill, value in skills.items():
                if not value:
                    skills_with_false.append(skill)

        action_outcome = get_action_outcome(video_id, segment_index)
        action = action_outcome["action"]
        # outcome = action_outcome["outcome"]
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
                    skill: bkt_params[skill]["probMastery"] for skill in skills.keys()
                }
            instruction = """
                Please choose the proper one move from the cognitive apprenticeship based on the student's mastery of skills.
            """
            input_data = {
                "notebook": notebook,
                "question": question,
                "current_category": category,
                "category_params": category_params,
                "skills_to_practice": str(skills_with_false),
                "tutor's action": action,
                "additional instruction": instruction,
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
        segment_index = data["segmentIndex"]
        segment_skill = get_skill_by_segment(video_id, segment_index)
        # Check if there is any False in the practicing skills
        contains_false = any(
            not value
            for inner_dict in segment_skill.values()
            for value in inner_dict.values()
        )
        if contains_false:
            result = "no"  # if there is false, don't go on
        else:
            result = "yes"  # if there is no false, go on
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
        output_type = cell_output[0].get("name", "")
        print(output_type)
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
            if output_type == "error":
                contains_error = True
            else:
                contains_error = False
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
        video_id TEXT,
        segment_index NUMBER NOT NULL,
        skills TEXT NOT NULL,
        PRIMARY KEY (video_id, segment_index)
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS bkt_params_cache (
        user_id TEXT PRIMARY KEY,
        skills_probMastery TEXT NOT NULL,
        skills_by_category TEXT NOT NULL
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
    # all_skills = [
    #     "Load data directly with a URL",
    #     "Load necessary packages for EDA",
    #     "Making assumptions based on data",
    #     "Use box plot to visualize the data",
    #     "Use histograms to visualize the data",
    #     "Use dot plot to visualize the data",
    #     "Customize plot appearance",
    #     "Interpret visualizations",
    #     "Generate intent for the next visualization",
    #     "Identify outliers in the data",
    #     "Reorder data",
    #     "Group and summarize data",
    # ]
    skills_by_category = {
        "Load data/packages": [
            "Load data directly with a URL",
            "Load necessary packages for EDA",
        ],
        "Initial observation on raw data": [
            "View the first few rows of the data set",
            "Make assumptions based on data",
            "Generate intent for the next visualization",
        ],
        "Data visualization": [
            "Use box plot to visualize the data",
            "Use histograms to visualize the data",
            "Use dot plot to visualize the data",
            "Customize plot appearance",
            "Reorder data",
        ],
        "Chart interpretation/insights": [
            "Interpret visualizations",
            "Generate intent for the next visualization",
            "Identify outliers in the data",
        ],
        "Data processing": ["Reorder data", "Group and summarize data"],
    }
    all_skills = []
    for skills in skills_by_category.values():
        for skill in skills:
            if skill not in all_skills:
                all_skills.append(skill)

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
        skills_by_category = json.dumps(skills_by_category)
        c.execute(
            "INSERT INTO bkt_params_cache (user_id, skills_probMastery, skills_by_category) VALUES (?, ?, ?)",
            (user_id, prob_mastery_json, skills_by_category),
        )
    conn.commit()
    conn.close()


def initialize_chat_server(data, kernelType):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-1106-preview", openai_api_key=OPENAI_API_KEY)
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
                You have access to the dataset information ({data}) used in the video. The current video segment category (current_category) and its author David's action (tutor's action) and the skills that the student needs to practice (skills_to_practice) in the current segment will also be given.
                The student's performance (notebook and question) and mastery probability of each skill will be given. The mastery probability is a number between 0 and 1, indicating the probability that the student has mastered the skill.

                The Cognitive Apprenticeship has the following six moves: modeling, coaching, scaffolding, articulation, reflection, and exploration. During different video segments, the moves you choose will differ.
                You need to adapt your mentorship style based on Bayesian Knowledge Tracing. Here are some guidelines for your interaction with the student in different scenarios:
                1. current_category: "Load data/packages"
                - (Scaffolding) When the probability of mastery is low (close to 0): Provide a step-by-step guide or share a template script that includes basic code for loading various types of data and the most commonly used packages in EDA.
                - (Coaching) When the probability of mastery is high (close to 1): Guide students through the process of loading different types of data and answer specific questions about error messages or issues encountered.
                2. current_category: "Initial observation on raw data"
                - (Scaffolding) When the probability of mastery is low (close to 0): Provide a list of initial checks or observations to make when first looking at raw data, such as checking for missing values or understanding data types. Then ask if he finds any interesting relationships and has any visualization intent.
                - (Coaching) When the probability of mastery is high (close to 1): Assist the student in interpreting the raw data, pointing out nuances like anomalies or patterns that might not be immediately obvious. Provide hints or tips on how to quickly get a sense of what the data is about and its quality.
                - (Articulation) Have the student articulate their initial observations and hypotheses about the data. Encourage them to discuss any surprising or confusing aspects of the data they noticed.
                - Only let the student do data observation. You can encourage him to note down the ideas and explore them later. Don't let the student to do visualization in this step.
                3. current_category: "Data processing"
                - (Scaffolding) When the probability of mastery is low (close to 0): Create a workflow diagram or flowchart illustrating common data processing steps such as cleaning, transforming, and normalizing data. Offer a template or example script showing standard data processing techniques.
                - (Coaching) When the probability of mastery is high (close to 1): Provide feedback on their data processing approach, suggesting improvements or alternatives. Or guide students through more complex data processing tasks, like handling missing data, outlier detection, and feature engineering.
                - (Articulation) Encourage them to predict the impact of these steps on their subsequent analysis. Ask the student to explain the rationale behind each data processing step they perform.
                4. current_category: "Data visualization"
                - (Scaffolding) When the probability of mastery is low (close to 0): Provide templates or code snippets for creating common plots and charts.
                - (Coaching) When the probability of mastery is high (close to 1): Offer guidance on selecting the most appropriate type of visualization for different data sets or analysis goals. Help troubleshoot issues with visualization tools or libraries.
                - (Articulation) Ask the student questions about the choices made by David in the video to encourage critical thinking, such as why he makes a box plot.
                5. current_category: "Chart interpretation/insights"
                - (Scaffolding) When the probability of mastery is low (close to 0): Give examples of insightful chart interpretations in various contexts. Provide a guide for systematically analyzing and drawing insights from visualizations.
                - (Coaching) When the probability of mastery is high (close to 1): Assist in interpreting complex charts and extracting meaningful insights. Challenge students to delve deeper into their analysis, asking probing questions.
                - (Articulation) Prompt the student to articulate the insights they have gained from their visualizations. Encourage them to explain how these insights could inform decision-making or further analysis.

                Notes:
                - You should interact in the first person as a mentor heuristically and briefly.
                - You give advice based on the programming language the student is currently using. He is now using {kernelType}.
                - Limit your teaching and assisting content to the actions of the current category. And focus on the student's skills that need to be practiced.
                - If you are gonna provide some code to the student, please include the code in a code block.
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


def get_transcript(video_id, start=0, end=900):
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
        transcript = [
            i for i in data if i["start"] >= start and i["start"] + i["duration"] < end
        ]
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


def get_video_segment(video_id, length=600):
    """Segment the given tutorial video into six pre-defined categories."""
    periods = math.ceil(length / 600)
    segments = []
    # Segment the given video every 10-minute periods
    for i in range(periods):
        if i == periods - 1:
            end_time = length
        else:
            end_time = (i + 1) * 600

        transcript = get_transcript(video_id, start=i * 600, end=end_time)
        completion = openai.ChatCompletion.create(
            model="gpt-4-1106-preview",
            messages=[
                {
                    "role": "system",
                    "content": """
                                I need you to segment the given transcript from an Exploratory Data Analysis (EDA) tutorial video into specific categories based on the context and content of each text snippet. Analyze the provided text closely and sort it according to the following categories:

                                Introduction: Passages where the speaker provides an introductory overview, greets the audience or sets the stage for what's to come.
                                Load data/packages: Segments where there's explicit mention or inference of loading datasets, files, or importing necessary libraries/packages. Look for indications of data initialization or software setup.
                                Initial observation on raw data: Look for sections where the speaker gives first impressions, immediate observations, or general descriptions of the initial dataset without going into deeper analysis.
                                Data visualization: Identify sections where the instructor discusses or showcases the creation of plots, graphs, charts, or any other visual representations of data. This may include setting up visualizations or the mere mention of them.
                                Chart interpretation/insights: Pinpoint passages where the instructor delves into the interpretation of previously shown visualizations, explaining trends, patterns, anomalies, or drawing conclusions from them.
                                Data processing: Find instances where the instructor outlines procedures to cleanse, transform, reshape, or otherwise manipulate the raw data. This could be filtering, aggregation, reshaping, etc.

                                Note:
                                - One category can have multiple time periods. And some categories could have no corresponding segments.
                                - Keep the categories in chronological order based on the "start" time. If there's overlap or ambiguity, prioritize the context and continuity of the topic being discussed.
                                - If the start time of the current transcript is above 600, there is no segment with the category 'Introduction', 'Load data/packages', or 'Initial observation on raw data' anymore.
                                - You can get each segment's duration time by comparing the start time of the adjacent two items. Any segment's duration time should not be too short.

                                Your output should be in this format:
                                [
                                    {"category": CategoryName, "start": StartTime},
                                    ...
                                ]
                                Please begin segmenting the provided transcript.
                                """,
                },
                {"role": "user", "content": str(transcript)},
            ],
            temperature=0.1,
        )
        llm_response = completion.choices[0].message["content"]
        segment = json.loads(llm_response.replace("'", '"'))
        sorted_segment = sorted(segment, key=lambda x: x["start"])

        # Loop through the data except the last item
        for j in range(len(sorted_segment) - 1):
            sorted_segment[j]["start"] = round(sorted_segment[j]["start"])
            sorted_segment[j]["end"] = round(sorted_segment[j + 1]["start"])
        # Set the 'end' time of the last item
        sorted_segment[-1]["start"] = round(sorted_segment[-1]["start"])
        sorted_segment[-1]["end"] = end_time

        segments.extend(sorted_segment)

    combined_segments = []
    # Iterate through each segment in the data
    for segment in segments:
        # Check if the current segment can be merged with the last segment in the combined list
        if (
            combined_segments
            and combined_segments[-1]["category"] == segment["category"]
            and combined_segments[-1]["end"] == segment["start"]
        ):
            # If so, extend the end of the last segment in the combined list
            combined_segments[-1]["end"] = segment["end"]
        else:
            # Otherwise, add the current segment as a new entry in the combined list
            combined_segments.append(segment)
    return combined_segments


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
            model="gpt-4-1106-preview",
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
                        "Load data/packages": ["Load data directly with a URL", "Load necessary packages for EDA"], 
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
            model="gpt-4-1106-preview",
            messages=[
                {
                    "role": "system",
                    "content": """
                    You are an expert in Exploratory Data Analysis (EDA) and good at assisting students learn EDA.
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
        model="gpt-4-1106-preview",
        messages=[
            {
                "role": "system",
                "content": """"You are an expert in Exploratory Data Analysis (EDA) and good at assisting students to learn EDA.
                Your role is to find out the skills in the given skill set {} that the student is practicing by coding or conversation and whether the student practices the skills correctly.
                Response with true when the student's code or message demonstrated this skill. Response with false when the code output has errors or the answer is incorrect. 
                Note if the skill is not being practiced, don't include it with 'false'. If no skill is being practiced, return an empty list. 
                The student is using {} language in the computational notebook. Output in this format:
                [
                    {{skill_name_1: true or false}},
                    {{skill_name_2: true or false}},
                    ...
                ]
            """.format(
                    kernelType, skills
                ),
            },
            {
                "role": "user",
                "content": """
            cell_content: url <- "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-16/recent-grads.csv"
                          data <- read_csv(url),
            message: ''
            """,
            },
            {
                "role": "assistant",
                "content": """
                [
                    {"Load data directly with a URL": true}
                ]
            """,
            },
            {
                "role": "user",
                "content": """
            cell_content: {},
            message: {}
            """.format(
                    cell_content, question
                ),
            },
        ],
    )
    print(completion.choices[0].message["content"])
    try:
        models = json.loads(completion.choices[0].message["content"])
        for model in models:
            for key, value in model.items():
                # print(key, value)
                segment_skill[category][key] = value
                if key in bkt_params.keys():
                    update_bkt_param(bkt_params[key], value)
                else:
                    bkt_params[key] = {
                        "probMastery": 0.1,
                        "probTransit": 0.1,
                        "probSlip": 0.1,
                        "probGuess": 0.1,
                    }
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
        print(row[0])
        return json.loads(row[0])

    c.execute(
        "SELECT skills_by_category FROM bkt_params_cache WHERE user_id = ?", (user_id,)
    )
    skills_by_category = json.loads(c.fetchone()[0])
    all_skills = []
    for skills in skills_by_category.values():
        for skill in skills:
            if skill not in all_skills:
                all_skills.append(skill)
    if segment_index >= len(all_segment):
        return {"Self-exploration": all_skills}

    response = openai.ChatCompletion.create(
        model="gpt-4-1106-preview",
        messages=[
            {
                "role": "system",
                "content": """
                        You are an expert in Exploratory Data Analysis (EDA).
                        Given the transcript of an EDA tutorial video segment, summarize all the !!EDA!! skills used in the segment.
                        If the skill is in the skill set, use the same expression. If the skill is not in the skill set, create a new skill.
                        Only choose the skills corresponding to the category. For example, there should not be "Interpret visualization" or "Make assumptions" in a "Data visualization" segment.
                        Response in this format: ["skill_1", "skill_2", ...]
                        """,
            },
            {
                "role": "user",
                "content": f"transcript: {segment_transcript['transcript']}, category: {segment['category']}, skill set: {skills_by_category[segment['category']]}",
            },
        ],
    )
    result = response.choices[0].message["content"]
    try:
        result = json.loads(result.replace("'", '"'))
        # Update the skills_by_category in the database
        for skill in result:
            if skill not in skills_by_category["Data visualization"]:
                skills_by_category["Data visualization"].append(skill)
        skills_by_category_str = json.dumps(skills_by_category)
        c.execute(
            "UPDATE bkt_params_cache SET skills_by_category = ? WHERE user_id = ?",
            (skills_by_category_str, user_id),
        )

        # Change to this format: {'Load data directly with a URL': False, ...}
        result = {item: False for item in result}
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
    except json.JSONDecodeError as e:
        print("Error decoding JSON:", e)
        print("Original result string:", result)


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
