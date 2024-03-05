# handler.py
import os
import re
import ast
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
from BCEmbedding import RerankerModel

# init reranker model
model = RerankerModel(model_name_or_path="maidalun1020/bce-reranker-base_v1")

# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
# OPENAI_API_KEY = "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"
OPENAI_API_KEY = ""
# openai.api_key = OPENAI_API_KEY
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
user_id = ""
previous_notebook = '[{"cell_type":"code","source":"","output_type":null}]'
last_practicing_skill = None
learned_functions = []
step_index = 0
CUR_SEQ = []  # The current sequence of moves
with open("test.json", "r") as file:
    # Parse the file and convert JSON data into a Python dictionary
    eda_video = json.load(file)
with open("code.json", "r") as file:
    # Parse the file and convert JSON data into a Python dictionary
    all_code = json.load(file)


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
        global user_id, OPENAI_API_KEY
        data = self.get_json_body()
        video_id = data["videoId"]
        user_id = data["userId"]
        OPENAI_API_KEY = data["apiKey"]
        openai.api_key = OPENAI_API_KEY
        segments = get_segments(video_id)
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global llm, prompt, memory, conversation, VIDEO_ID, eda_video, CUR_SEQ, all_code, step_index

        # Existing video_id logic
        data = self.get_json_body()
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        category = data["category"]
        segment_index = data["segmentIndex"]
        kernelType = data["kernelType"]
        selected_choice = data["selectedChoice"]
        print("selected choice: ", selected_choice)
        segment = get_segments(video_id)[segment_index]
        dataset = get_csv_from_youtube_video(video_id)

        if kernelType == "ir":
            kernelType = "R"
        elif kernelType == "python3":
            kernelType = "Python"

        conn = sqlite3.connect("cache.db")
        c = conn.cursor()
        if llm is None or prompt is None or memory is None or conversation is None:
            VIDEO_ID = video_id
            init_bkt_params()
            initialize_chat_server(kernelType)

        if notebook:
            input_data = {}
            # Default to None to handle cases where it might not get set
            move_detail = None
            if CUR_SEQ != [] and question == "":
                # If the student does not ask a question, get the pedagogy, parameters, etc
                move_detail = CUR_SEQ[0]
                # move_detail = eda_video[category][current_move]
                current_step_index = step_index

                # Get whatever parameters when current segment needs
                parameters = move_detail.get(
                    "parameters", {}
                )  # Safely get parameters with a default

                if "transcript" in parameters:
                    input_data["transcript"] = get_segment_transcript(
                        video_id, segment["start"], segment["end"], category
                    )["transcript"]

                if "data" in parameters:
                    input_data["data"] = dataset

                if "knowledge" in parameters:
                    input_data["knowledge"] = move_detail["knowledge"]

                if "code-block" in parameters:
                    input_data["tutor's code"] = all_code[str(segment_index)]
                if "func-attri-to-learn" in parameters:
                    _, functions_to_learn, attributes_to_learn = get_function_attribute(
                        video_id, segment_index, all_code
                    )
                    input_data["functions_to_learn"] = str(functions_to_learn)
                    input_data["attributes_to_learn"] = str(attributes_to_learn)
                    if "step-index" in parameters:
                        input_data["functions_to_learn"] = str(
                            functions_to_learn[current_step_index]
                        )
                        input_data["attributes_to_learn"] = str(
                            attributes_to_learn[current_step_index]
                        )
                if "key-points" in parameters:
                    key_points, _, _ = get_function_attribute(
                        video_id, segment_index, all_code
                    )
                    input_data["key_points"] = str(key_points)
                    if "step-index" in parameters:
                        input_data["key_points"] = str(key_points[current_step_index])
                pedagogy = move_detail["prompt"]
                input_data["pedagogy"] = (
                    "Use the following structure to respond: " + pedagogy
                )
                CUR_SEQ.pop(0)  # After using this move, remove it from the sequence
                need_response = move_detail.get("need-response", True)
                interaction = move_detail["interaction"]
                if selected_choice != "":
                    # If the student selects a choice, the response is the choice
                    input_data["student's choice"] = selected_choice
                if "step-index" in parameters:
                    input_data["step_index"] = current_step_index
                    # After using step index in this move, update it
                    step_index += 1
                # Handle interaction logic
                if interaction == "auto-reply":
                    results = pedagogy
                elif interaction == "show-code":
                    results = pedagogy + "\n" + all_code[str(segment_index)]
                elif interaction == "drop-down":
                    results = pedagogy
                elif interaction == "multiple-choice":
                    input_data["pedagogy"] = (
                        input_data["pedagogy"]
                        + ' Please respond with the following json structure without the ```json``` title: {"question": "question", "choices": ["choice", "choice", "choice"]}'
                    )
                    results = conversation({"input": str(input_data)})["text"]
                elif interaction == "fill-in-blanks":
                    results = conversation({"input": str(input_data)})["text"]
                    _, code_line_with_blanks = get_code_with_blank_by_step(
                        video_id, segment_index, all_code, current_step_index
                    )
                    results = (
                        results
                        + " Please fill in the blanks in the code below"
                        + "\n"
                        + "```R"
                        + code_line_with_blanks
                        + "```"
                    )
                else:
                    results = conversation({"input": str(input_data)})["text"]

                if "code-with-blanks" in move_detail["parameters"]:
                    code_with_blanks = get_code_with_blank(
                        video_id, segment_index, all_code
                    )
                    results = (
                        results
                        + " Let's learn how to create that visualization. Here is the structure of the code:"
                        + "\n"
                        + code_with_blanks
                    )
                # if "code-line" in move_detail["parameters"]:
                #     code_line, _ = get_code_with_blank_by_step(
                #         video_id, segment_index, all_code, current_step_index
                #     )
                #     results = results + "\n" + "```R" + code_line + "```"
                # if "code-line-with-blanks" in move_detail["parameters"]:
                #     _, code_line_with_blanks = get_code_with_blank_by_step(
                #         video_id, segment_index, all_code, current_step_index
                #     )
                #     results = (
                #         results
                #         + " Please fill in the blanks in the code below"
                #         + "\n"
                #         + "```R"
                #         + code_line_with_blanks
                #         + "```"
                #     )
            elif question != "":
                # Logic for when there's a question
                input_data = {
                    "student's question": question,
                    "pedagogy": "Use less than three sentences briefly answer student's query or give feedbacks.",
                }
                if CUR_SEQ == []:
                    need_response = True
                else:
                    need_response = False
                interaction = "plain text"
                results = conversation({"input": str(input_data)})["text"]
            else:
                # Default case when there's no question or CUR_SEQ
                interaction = "auto-reply"
                pedagogy = "You have finished this part. Feel free to go ahead to the next video clip!"
                need_response = True
                results = pedagogy

            response_data = {
                "message": results,
                "need_response": need_response,
                "interaction": interaction,
            }
            self.finish(json.dumps(response_data))
        else:
            self.set_status(400)
            self.finish(json.dumps({"error": "No notebook file active"}))


class GoOnHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Evaluate if the user is ready to go on to the next segment."""
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
            result = "yes"  # if there is false, don't go on
        else:
            # set_prev_notebook(data["notebook"])
            result = "yes"  # if there is no false, go on
        self.finish(json.dumps(result))


class UpdateSeqHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Update the sequence of moves and step index depending on the mastery of the skill and category."""
        global CUR_SEQ, bkt_params, learned_functions, step_index, eda_video
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        category = data["category"]
        segment = get_segments(video_id)[segment_index]
        start_time = segment["start"]
        learning_obj = category + " - " + str(start_time)
        sections = eda_video[learning_obj]
        # CUR_SEQ = [action for section in sections for action in section["actions"]]
        init_bkt_params()
        segment_skill = get_skill_by_segment(video_id, segment_index)
        skills_with_false = []
        for skills in segment_skill.values():
            for skill, value in skills.items():
                if not value:
                    skills_with_false.append(skill)
        if skills_with_false != []:
            skill_to_practice = skills_with_false[0]
            skills = list(segment_skill.values())[0]
            category_params = {
                skill: bkt_params[skill]["probMastery"] for skill in skills.keys()
            }
            # Update the sequence of moves depending on the mastery of the skill
            if category_params[skill_to_practice] < 0.5:
                # CUR_SEQ = eda_video[category]["Sequence"]["lower"].copy()
                CUR_SEQ = [
                    dict(knowledge=section["knowledge"], **action)
                    for section in sections
                    for action in section["actions"]
                ]
                # print("lower:" + str(CUR_SEQ))
            else:
                # CUR_SEQ = eda_video[category]["Sequence"]["upper"].copy()
                CUR_SEQ = [
                    dict(knowledge=section["knowledge"], **action)
                    for section in sections
                    for action in section["actions"]
                ]
                # print("upper:" + str(CUR_SEQ))
            # if category == "Visualizing the data":
            # # Find out the proper pedagogy for Visualizing the data segment
            # _, functions_to_learn, _ = get_function_attribute(
            #     video_id, segment_index, all_code
            # )
            # # filter out functions that are not learned before
            # filtered_functions_to_learn = [
            #     [
            #         function
            #         for function in sublist
            #         if function not in learned_functions
            #     ]
            #     for sublist in functions_to_learn
            # ]
            # CUR_SEQ = ["Modeling"]
            # for function_to_learn in filtered_functions_to_learn:
            #     if function_to_learn == []:
            #         CUR_SEQ.append("Scaffolding")
            #     else:
            #         CUR_SEQ.append("Coaching")
            # CUR_SEQ.append("Reflection")
            # initialze_database()
            # conn = sqlite3.connect("cache.db")
            # c = conn.cursor()
            # c.execute(
            #     "SELECT * FROM learning_progress_cache WHERE user_id = ? AND video_id = ? AND segment_index = ?",
            #     (user_id, video_id, segment_index),
            # )
            # row = c.fetchone()
            # if not row:
            #     c.execute(
            #         "INSERT INTO learning_progress_cache VALUES (?, ?, ?, ?)",
            #         (
            #             user_id,
            #             video_id,
            #             segment_index,
            #             0,
            #         ),
            #     )
            # conn.commit()
            # conn.close()
            step_index = 0  # update step_index for every segment
            print("CUR_SEQ updated successfully: " + str(CUR_SEQ))


class FillInBlanksHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Get all choices for the fill-in-blanks action."""
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        _, functions_to_learn, attributes_to_learn = get_function_attribute(
            video_id=video_id, segment_index=segment_index, code_json=all_code
        )
        # Flattening the list of lists and extracting unique items
        unique_functions = list(
            set(item for sublist in functions_to_learn for item in sublist)
        )
        unique_attributes = list(
            set(item for sublist in attributes_to_learn for item in sublist)
        )
        choices = unique_functions + unique_attributes
        print(choices)
        self.finish(json.dumps(choices))


class UpdateBKTHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global bkt_params
        data = self.get_json_body()
        video_id = data["videoId"]
        cell_content = data["cell"]
        cell_output = data["output"]
        # print(cell_content)
        if cell_output:  # the student executed the cell and the cell has output
            output_type = cell_output[0].get("name", "")
            # print(output_type)
            # Check if "error" exists in any "output_type" field
            if output_type == "error":
                contains_error = True
            else:
                contains_error = False
        else:  # the cell does not have output or the student sends a message
            contains_error = False
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
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS function_attribute_cache (
        video_id TEXT,
        segment_index NUMBER NOT NULL,
        key_points TEXT NOT NULL,
        functions_to_learn TEXT NOT NULL,
        attributes_to_learn TEXT NOT NULL,
        code_with_blanks TEXT,
        PRIMARY KEY (video_id, segment_index)
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS learning_progress_cache (
        user_id TEXT,
        video_id TEXT NOT NULL,
        segment_index NUMBER NOT NULL,
        step_index NUMBER NOT NULL,
        PRIMARY KEY (user_id, video_id, segment_index)
    );"""
    )
    skills_by_category = {
        "Load packages/data": [
            "Load package and data successfully",
        ],
        "Understand the dataset": [
            "Observe and understand the dataset",
        ],
        "Visualize the data": [
            "Use plot to visualize the data",
        ],
        "Interpret the chart": [
            "Propose reason behind the pattern",
        ],
        "Preprocess the data": ["Reorder, group or summarize data"],
    }
    all_skills = []
    for skills in skills_by_category.values():
        for skill in skills:
            if skill not in all_skills:
                all_skills.append(skill)

    video_id = "nx5yhXAQLxw"
    segments_set = [
        {"category": "Introduction", "start": 1, "end": 113},  # 0
        {"category": "Load packages/data", "start": 113, "end": 212},  # 1
        {"category": "Understand the dataset", "start": 212, "end": 418},  # 2
        {"category": "Visualize the data", "start": 418, "end": 463},  # 3
        {"category": "Interpret the chart", "start": 463, "end": 509},  # 4
        {"category": "Visualize the data", "start": 509, "end": 602},  # 5
        {"category": "Interpret the chart", "start": 602, "end": 638},  # 6
        {"category": "Visualize the data", "start": 638, "end": 720},  # 7
        {"category": "Interpret the chart", "start": 720, "end": 848},  # 8
        {"category": "Visualize the data", "start": 848, "end": 971},  # 9
        {"category": "Interpret the chart", "start": 971, "end": 1101},  # 10
        {"category": "Preprocess the data", "start": 1101, "end": 1145},  # 11
        {"category": "Interpret the chart", "start": 1145, "end": 1177},  # 12
        {"category": "Visualize the data", "start": 1177, "end": 1371},  # 13
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )

    video_id = "Kd9BNI6QMmQ"
    segments_set = [
        {"category": "Introduction", "start": 1, "end": 102},
        {"category": "Load packages/data", "start": 102, "end": 137},
        {"category": "Understand the dataset", "start": 137, "end": 220},
        {"category": "Preprocess the data", "start": 220, "end": 568},
        {"category": "Visualize the data", "start": 568, "end": 580},
        {"category": "Interpret the chart", "start": 580, "end": 596},
        {"category": "Visualize the data", "start": 596, "end": 655},
        {"category": "Interpret the chart", "start": 655, "end": 680},
        {"category": "Preprocess the data", "start": 680, "end": 715},
        {"category": "Interpret the chart", "start": 715, "end": 740},
        {"category": "Visualize the data", "start": 740, "end": 900},
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


def initialize_chat_server(kernelType):
    """Initialize the chat server."""
    global llm, prompt, memory, conversation
    # LLM initialization
    llm = ChatOpenAI(model="gpt-4-1106-preview", openai_api_key=OPENAI_API_KEY)
    if kernelType == "ir":
        kernelType = "R"
    elif kernelType == "python3":
        kernelType = "Python"

    video_type = "Exploratory Data Analysis (EDA)"
    # Prompt
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                """
                You are an expert in Data Science, specializing in {video_type}.
                Your task is to use the Cognitive Apprenticeship approach to assist a student in learning {video_type} through David Robinson's Tidy Tuesday tutorial series.

                You will be provided with one or more of the following inputs:
                - transcript: the transcript of the current video segment.
                - tutor's code: the code the tutor wrote in the current video segment.
                - pedagogy: the specific cognitive apprenticeship move that you need to follow to guide students.
                - student's code or question or choice: the student's current performance, encompassing either the code in the student's notebook or the student's query sent to you or student's choice in the multiple-choice question.
                - dataset information: the dataset to explore in the video.

                Notes for Response:
                - Use natural language to communicate in the first person as a teaching assistant.
                - You must strictly follow the pedagogy to provide guidance.
                - Tailor your advice to the programming language the student uses: {kernelType}.
                - Don't tell the student that your response is based on the transcript or code.
                """
            ).format(
                video_type=video_type,
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
                                Understand the data: Look for sections where the speaker gives first impressions, immediate observations, or general descriptions of the initial dataset without going into deeper analysis.
                                Visualize the data: Identify sections where the instructor discusses or showcases the creation of plots, graphs, charts, or any other visual representations of data. This may include setting up visualizations or the mere mention of them.
                                Interpret the chart: Pinpoint passages where the instructor delves into the interpretation of previously shown visualizations, explaining trends, patterns, anomalies, or drawing conclusions from them.
                                Preprocess the data: Find instances where the instructor outlines procedures to cleanse, transform, reshape, or otherwise manipulate the raw data. This could be filtering, aggregation, reshaping, etc.

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
                        "Visualizing the data": ["Use box plot to visualise the data", "Use histograms to visualise the data", "Use dot plot to visualise the data", "Customize plot appearance"],
                        "Interpret the chart": ["Interpret visualizations", "Generate hypotheses for the next visualization", "Identify outliers in the data"],
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


def set_prev_notebook(notebook):
    """Change the previous notebook."""
    global previous_notebook
    previous_notebook = notebook


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
    skills_with_false = []
    for skills in segment_skill.values():
        for skill, value in skills.items():
            if not value:
                skills_with_false.append(skill)
    if not skills_with_false:
        return bkt_params, []
    category = list(segment_skill.keys())[0]
    skills = list(list(segment_skill.values())[0].keys())
    if kernelType == "ir":
        kernelType = "R"
    elif kernelType == "python3":
        kernelType = "Python"

    # Check if the student types anything in the chat
    performance = cell_content if question == "" else question

    completion = openai.ChatCompletion.create(
        model="gpt-4-1106-preview",
        messages=[
            {
                "role": "system",
                "content": f"""You are an expert in Exploratory Data Analysis (EDA) and good at assisting students to learn EDA.
                            Your role is to evaluate whether the student has practiced the skill '{skills_with_false}'.
                            Response with true when the student's performance has practiced this skill.
                            Response with false when there is an error in the code or the answer is incorrect.
                            The student is using {kernelType} language in the computational notebook.
                            Only output in this format:
                            [
                                {{"{skills_with_false[0]}": true or false}}
                            ]
                        """,
            },
            {
                "role": "user",
                "content": f"""
                            performance: {performance}
                        """,
            },
        ],
        temperature=0.3,
    )
    print(completion.choices[0].message["content"])
    try:
        models = json.loads(completion.choices[0].message["content"])
        for model in models:
            for key, value in model.items():
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

    # Change to this format: {'Load data directly with a URL': False, ...}
    skills = skills_by_category[segment["category"]]
    result = {item: False for item in skills}
    category_skill = {segment["category"]: result}
    category_skill_json = json.dumps(category_skill)
    # Insert new data if video_id doesn't exist
    c.execute(
        "INSERT INTO skills_cache (video_id, segment_index, skills) VALUES (?, ?, ?)",
        (video_id, segment_index, category_skill_json),
    )
    conn.commit()
    conn.close()
    return category_skill


def get_skill_action_by_segment(video_id, segment_index):
    """Get the skills and actions corresponding to the given segment."""
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
                        Given the transcript of an EDA tutorial video segment, summarize the !!EDA!! skills used by the video author in the segment with a detailed and accurate description of the action taken by the video author for each skill.
                        Only choose the skills corresponding to the category. For example, there should not be "Interpret visualization" or "Make assumptions" in a "Visualizing the data" segment.
                        Use the same expression in the skill set to answer. Response in this format: {"skill_1": "action_1", "skill_2": "action_2", ...}
                        Note: the skills' order in the result should follow the order in which skills appear in the video.
                        """,
            },
            {
                "role": "user",
                "content": f"transcript: {segment_transcript['transcript']}, category: {segment['category']}, skill set: {skills_by_category[segment['category']]}",
            },
        ],
    )
    skill_action = response.choices[0].message["content"]
    try:
        skill_action = json.loads(skill_action.replace("'", ""))
        # Update the skills_by_category in the database
        # skills = [item["skill"] for item in skill_action]
        skills = list(skill_action.keys())
        for skill in skills:
            if skill not in skills_by_category[segment["category"]]:
                skills_by_category[segment["category"]].append(skill)
            if skill not in bkt_params:
                bkt_params[skill] = {
                    "probMastery": 0.1,
                    "probTransit": 0.1,
                    "probSlip": 0.1,
                    "probGuess": 0.1,
                }
        skills_by_category_str = json.dumps(skills_by_category)
        c.execute(
            "UPDATE bkt_params_cache SET skills_by_category = ? WHERE user_id = ?",
            (skills_by_category_str, user_id),
        )

        # Change to this format: {'Load data directly with a URL': False, ...}
        result = {item: False for item in skills}
        category_skill = {segment_transcript["category"]: result}
        category_skill_json = json.dumps(category_skill)
        skill_action_json = json.dumps(skill_action)
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO skills_cache (video_id, segment_index, skills, actions) VALUES (?, ?, ?, ?)",
            (video_id, segment_index, category_skill_json, skill_action_json),
        )
        conn.commit()
        conn.close()
        return category_skill
    except json.JSONDecodeError as e:
        print("Error decoding JSON:", e)
        print("Original result string:", skill_action)


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


def parse_function_in_code(code_block):
    """Parse and extract all the functions in a R code block."""
    # Updated regex pattern to include function names with periods
    pattern = re.compile(r"\b([a-z_][\w.]*)\s*(?=\()", re.IGNORECASE)

    # Find all matches in the code block
    functions = pattern.findall(code_block)

    # Removing duplicates and sorting the list
    unique_functions = sorted(set(functions))
    return unique_functions


def get_function_attribute(video_id, segment_index, code_json):
    """Get the functions and attributes to learn in a video segment."""
    if str(segment_index) in code_json.keys():
        code_block = code_json[str(segment_index)]
    else:
        return [], [], []
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT key_points, functions_to_learn, attributes_to_learn FROM function_attribute_cache WHERE video_id = ? AND segment_index = ?",
        (video_id, segment_index),
    )
    row = c.fetchone()
    if row:
        # Convert each string in the tuple to a Python object using ast.literal_eval
        key_points = ast.literal_eval(row[0])
        functions_to_learn = ast.literal_eval(row[1])
        attributes_to_learn = ast.literal_eval(row[2])
        return key_points, functions_to_learn, attributes_to_learn
    all_segment = get_segments(video_id)
    start_time = all_segment[segment_index]["start"]
    # end_time = all_segment[segment_index]["end"]
    category = all_segment[segment_index]["category"]
    learning_obj = category + " - " + str(start_time)
    sections = eda_video[learning_obj]
    key_points = [section["knowledge"] for section in sections[1:-1]]
    # segment_transcript = get_segment_transcript(video_id, start_time, end_time, "")[
    #     "transcript"
    # ]
    # if end_time - start_time > 100:
    #     num = "four"
    # elif end_time - start_time < 50:
    #     num = "two"
    # else:
    #     num = "three"
    # # get the key points list
    # response = openai.ChatCompletion.create(
    #     model="gpt-4-1106-preview",
    #     messages=[
    #         {
    #             "role": "system",
    #             "content": f"""You are an expert teaching assistant who can summarize key points to learn in a tutorial video. A student is watching a tutorial video segment to learn exploratory data analysis.
    #                         He needs to learn the procedural knowledge which represents the ability to organize rules and apply algorithms in such a way that specific goals can be achieved.
    #                         Your task is to follow the rules below to summarize no more than {num} key procedural knowledge to learn in the video. The video transcript and the code block corresponds to the video are given.
    #                         Rules you must follow:
    #                         - Don't include anything that is demonstrated to be not useful in the video transcript.
    #                         - Don't include anything as key points if it is just mentioned in the transcript in only one sentence rather than describe in detail.
    #                         - Don't include anything that are not in the code block as key points. Don't include customizing the plot as key points.
    #                         - The student is learning exploratory data analysis rather than the R language syntax, so you must focus on the procedural knowledge.
    #                         - Each key point should be as brief and clear as possible and should follow this format: 'Use ${{function}} on ${{data attribute}} to achieve ${{effect}} because ${{reason}}'
    #                         Respond in the following format: ['key point 1', 'key point 2', ...]
    #                         """,
    #         },
    #         {
    #             "role": "user",
    #             "content": f"transcript: {segment_transcript}, code block: {code_block}",
    #         },
    #     ],
    #     temperature=0.2,
    # )
    # key_points = ast.literal_eval(response.choices[0].message.content)
    # get all functions in the current code block
    all_functions = parse_function_in_code(code_block)
    # get all attributes in the dataset
    df = pd.read_csv("recent-grads.csv")
    all_attributes = df.columns.tolist()
    # map the key points to functions and attributes to learn
    functions_to_learn = []
    attributes_to_learn = []
    # avoid duplicate funcitons
    seen_functions = set()
    # seen_attributes = set()
    thres_func = 0.51
    thres_attri = 0.50
    for key_point in key_points:
        rerank_results_functions = model.rerank(key_point, all_functions)
        rerank_results_attributes = model.rerank(key_point, all_attributes)
        # print(rerank_results_functions, rerank_results_attributes)
        functions_over_05 = [
            passage
            for passage, score in zip(
                rerank_results_functions["rerank_passages"],
                rerank_results_functions["rerank_scores"],
            )
            if score > thres_func and passage not in seen_functions
        ]
        attributes_over_05 = [
            passage
            for passage, score in zip(
                rerank_results_attributes["rerank_passages"],
                rerank_results_attributes["rerank_scores"],
            )
            if score > thres_attri
        ]
        functions_to_learn.append(functions_over_05)
        attributes_to_learn.append(attributes_over_05)
        # Update the sets of seen functions and attributes
        seen_functions.update(functions_over_05)
        # seen_attributes.update(attributes_over_05)
    c.execute(
        "INSERT INTO function_attribute_cache VALUES (?, ?, ?, ?, ?, ?)",
        (
            video_id,
            segment_index,
            str(key_points),
            str(functions_to_learn),
            str(attributes_to_learn),
            None,
        ),
    )
    conn.commit()
    conn.close()
    return key_points, functions_to_learn, attributes_to_learn


def get_code_with_blank(video_id, segment_index, code_json):
    """Get the code block with blanks for the given video segment."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT code_with_blanks FROM function_attribute_cache WHERE video_id = ? AND segment_index = ?",
        (video_id, segment_index),
    )
    row = c.fetchone()
    if row:
        return row[0]
    # get the code block
    _, functions_to_learn, attributes_to_learn = get_function_attribute(
        video_id, segment_index, code_json
    )
    code_block = code_json[str(segment_index)]
    # get the code with blank
    response = openai.ChatCompletion.create(
        model="gpt-4-1106-preview",
        messages=[
            {
                "role": "system",
                "content": """Use the given code block and functions/attributes to learn, make all the functions and attributes to learn in the code as blanks.
                                You should not make more than five blanks in one code line. You should not respond with any comments or explanations. Each blank should be exactly an underscore consisting of three short underscores '___'.
                                Respond in the following format: ```{{r code with blanks}}```
                            """,
            },
            {
                "role": "user",
                "content": f"functions to learn: {str(functions_to_learn)}, attributes to learn: {str(attributes_to_learn)}, code block: {str(code_block)}",
            },
        ],
        temperature=0.2,
    )
    code_with_blanks = response.choices[0].message.content
    c.execute(
        "UPDATE function_attribute_cache SET code_with_blanks = ? WHERE video_id = ? AND segment_index = ?",
        (code_with_blanks, video_id, segment_index),
    )
    conn.commit()
    conn.close()
    return code_with_blanks


def get_step_index(video_id, segment_index):
    """Get the step index for a video segment."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT step_index FROM learning_progress_cache WHERE user_id = ? AND video_id = ? AND segment_index = ?",
        (user_id, video_id, segment_index),
    )
    row = c.fetchone()
    return row[0]


def update_step_index(video_id, segment_index, step_index):
    """Update the step index for a video segment."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT step_index FROM learning_progress_cache WHERE user_id = ? AND video_id = ? AND segment_index = ?",
        (user_id, video_id, segment_index),
    )
    row = c.fetchone()
    if row:
        c.execute(
            "UPDATE learning_progress_cache SET step_index = ? WHERE user_id = ? AND video_id = ? AND segment_index = ?",
            (step_index, user_id, video_id, segment_index),
        )
    else:
        c.execute(
            "INSERT INTO learning_progress_cache VALUES (?, ?, ?)",
            (user_id, video_id, segment_index, step_index),
        )
    conn.commit()
    conn.close()


def get_code_with_blank_by_step(video_id, segment_index, code_json, step_index):
    """Get the code with blank by step index for a video segment."""
    key_points, _, _ = get_function_attribute(video_id, segment_index, code_json)
    code_with_blanks = get_code_with_blank(video_id, segment_index, code_json)
    code_block = code_json[str(segment_index)]
    # Split the code block into a list by newline character
    code_lines = code_block.split("\\n")[1:-1]
    code_lines_with_blanks = code_with_blanks.split("\n")[1:-1]
    # get the code with blank
    response = openai.ChatCompletion.create(
        model="gpt-4-1106-preview",
        messages=[
            {
                "role": "system",
                "content": """You are an expert programmer who can understand R code. A student is learning EDA by filling in blanks in codes.
                                Now your task is to find out the corresponding code lines index (start from 0) in the code block that corresponds to the key point for the student to fill in.
                                The corresponding code lines can have one or two lines. Respond in the following format: [index_1, ...]
                            """,
            },
            {
                "role": "user",
                "content": f"key point: {str(key_points[step_index])}, code block: {code_lines}",
            },
        ],
        temperature=0.2,
    )
    line_index = response.choices[0].message.content
    line_index = ast.literal_eval(line_index)
    # Extract the lines corresponding to the given indices
    selected_lines = [code_lines[i] for i in line_index]
    selected_lines_with_blank = [code_lines_with_blanks[i] for i in line_index]
    # Combine the selected lines into a new string, separated by new lines
    combined_code = "\n".join(selected_lines)
    combined_code_with_blank = "\n".join(selected_lines_with_blank)
    return combined_code, combined_code_with_blank


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    # Add route for getting csv data
    data_pattern = url_path_join(base_url, "jlab_ext_example", "data")
    handlers = [(data_pattern, DataHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for getting csv data
    update_seq_pattern = url_path_join(base_url, "jlab_ext_example", "update_seq")
    handlers = [(update_seq_pattern, UpdateSeqHandler)]
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

    # Add route for getting go on or not response
    fill_blank_pattern = url_path_join(base_url, "jlab_ext_example", "fill_blank")
    handlers = [(fill_blank_pattern, FillInBlanksHandler)]
    web_app.add_handlers(host_pattern, handlers)
