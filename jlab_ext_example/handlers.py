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
        segments = get_segments(video_id)
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global llm, prompt, memory, conversation, VIDEO_ID, bkt_params, previous_notebook

        # Existing video_id logic
        data = self.get_json_body()
        state = data["state"]
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        segments = data["segments"]
        category = data["category"]
        skills_data = get_skills(video_id)
        # results = {
        #     "state": state,
        #     "notebook": notebook,
        #     "question": question,
        #     "video_id": video_id,
        #     "segments": segments,
        # }
        # self.finish(json.dumps(results))
        if (
            llm is None
            or prompt is None
            or memory is None
            or conversation is None
            or VIDEO_ID != video_id
            or bkt_params == {}
        ):
            VIDEO_ID = video_id
            transcript = get_transcript(video_id)
            data = get_csv_from_youtube_video(video_id)
            init_bkt_params(video_id)
            initialize_chat_server(transcript, segments, data)

        if state and notebook:
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
                "state": state,
                "notebook": notebook,
                "question": question,
                "current_category": category,
                "category_params": category_params,
            }
            results = conversation({"input": str(input_data)})["text"]
            self.finish(json.dumps(results))
        else:
            self.set_status(400)
            self.finish(
                json.dumps({"error": "No state input or no notebook file uploaded"})
            )


class GoOnHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        if VIDEO_ID != "":
            segments = data["segments"]
            transcript = get_transcript(VIDEO_ID)
            input_data = {
                "state": data["state"],
                "notebook": data["notebook"],
                "question": data["question"],
                "current_category": data["category"],
            }
            response = openai.ChatCompletion.create(
                model="gpt-4-32k",
                messages=[
                    {
                        "role": "system",
                        "content": f"""
                                    Give the transcript of a tutorial video of EDA: {str(transcript)} and the video segments' category: {str(segments)}, 
                                    determine if the student's current performance (including the current video play time and category, notebook content, 
                                    and the current answer in the chat) is good enough to advance the next stage. Output yes or no.
                                    """,
                    },
                    {"role": "user", "content": str(input_data)},
                ],
            )
            result = response.choices[0].message["content"]
        else:
            result = "no"
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
    conn.commit()
    conn.close()


def initialize_chat_server(transcript, segments, data):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-32k", openai_api_key=OPENAI_API_KEY)

    # Prompt
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                """
                Role: You're an expert data science mentor focused on real-time guidance in Exploratory Data Analysis (EDA) on Jupyter notebooks during David Robinson's Tidy Tuesday tutorials.
                Pedagogy: Use Cognitive Apprenticeship to offer feedback, corrections, and suggestions. Encourage students to verbalize their thought processes, self-reflect, and engage in independent exploration. 
                          Adapt your mentorship style based on Bayesian Knowledge Tracing: act more like a driver and scaffold if the student has a low probability of mastery on the skill; as a navigater and coach if the understanding is high.
                Resources: You have the complete transcript ({transcript}), segmented video clips ({segments}), and dataset information ({data}) from the video.

                Here are some guidelines for your interaction with the student in different scenarios:
                1. If the student just starts watching the video (current_category: "Introduction" or "Load data/packages"):
                - Ask the student if they have any questions and offer assistance with loading data and packages.
                2. If the student is following the video (current_category: "Initial observation on raw data" or "Data processing"):
                - Share your own observations and ask the student if they find any data attributes interesting.
                - Encourage the student to note down interesting tasks and try to solve them after watching the video.
                3. If the student is watching the video (current_category: "Data visualization" or "Chart interpretation/insights"):
                - Ask the student questions about the choices made in the video to encourage critical thinking.
                - Provide feedback on their answers and validate their understanding.
                4. If the student is writing code on the Jupyter notebook (notebook content changes, could happen in any current_category):
                - Offer guidance and suggestions if you notice any mistakes or areas for improvement in their code.
                - Provide hints and remind the student to pay attention to specific function parameters.
                5. If the student has finished watching the tutorial video (current_category: "Self-exploration"):
                - Encourage the student to think of additional tasks beyond what was covered in the video.
                - Break down the problem into steps and guide the student on how to approach it.
                - Share relevant resources or documentation to help the student with specific tasks.
                6. If the video is over and the student has no idea what to do next (current_category: "Self-exploration"):
                - Based on the student's skills BKT parameters, Suggest tasks that can help improve his lowest-mastery-probability skills.
                7. If the student just plots a new figure in the Jupyter notebook (notebook's cell output_type is "display_data"):
                - Ask the student to analyze the figure and look for patterns or trends.
                - Encourage the student to modify their code or data to further explore their hypothesis.
                8. If the student just finishes a task (current_category: "Chart interpretation/insights" or "Self-explanation"):
                - If the student asks for a standard way to solve the task, provide an example Python code using pandas, numpy, and matplotlib.
                - Encourage the student to ask questions or provide feedback on the suggested approach.

                Notes:
                - Interact in the first person as a mentor.
                - Be heuristic, brief, and prioritize the video until the "Self-Exploration" phase.
                """
            ).format(transcript=transcript, segments=segments, data=data),
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
        transcript = get_transcript(video_id)
        segments = get_segments(video_id)
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert in Exploratory Data Analysis. Give the following transcript of a tutorial video of EDA and the video segments' category, 
                                summarize !!all!! the EDA skills used in each category in the following format but no duplication.
                                [
                                    {"category": "Load data/packages", "skill": "load packages in R"},
                                    {"category": "Initial observation on raw data", "skill": "observe trends and patterns in the data"},
                                    {"category": "Data visualization, "skill": "uses histograms to visualise the data"},
                                    {"category": "Data visualization, "skill": "uses dot plot to visualise the data"},
                                    ...
                                ]
                                note: Don't be too specfic on the skills. If two skills are the same operation but on different tasks, they should be the same skill.
                                """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {str(transcript)}, segments: {str(segments)}",
                },
            ],
        )
        skills_data = completion.choices[0].message["content"]
        c.execute("INSERT INTO skills_cache VALUES (?, ?)", (video_id, skills_data))
        conn.commit()
        conn.close()
    return json.loads(skills_data)


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
    if is_correct or is_correct == "true":
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
                Now your role is to find out the skills the student practiced in the last training period and whether the student's performance is correct (true) or incorrect (false).
                The last training period is the period between the last notebook content {} and the current notebook content {}, and the student's message {} in the chat.
                You only need to find out the skills in the given skill set {}. If a skill is not practiced in the last period, don't include it in the answer.
                Please give the answer in the following format:
                [
                    {{"customize plot appearance": "true"}},
                    {{"use dot plot to visualise the data": "false"}},
                    ...
                ]
                """.format(
                    previous_notebook, current_notebook, question, skills_data
                ),
            },
            {"role": "user", "content": ""},
        ],
    )
    models = json.loads(completion.choices[0].message["content"])
    for model in models:
        update_bkt_param(bkt_params[model.key], model.value)
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
