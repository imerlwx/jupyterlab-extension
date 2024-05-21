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
from langchain.memory import ConversationBufferMemory
from BCEmbedding import RerankerModel
from g4f.client import Client

# init reranker model
model = RerankerModel(model_name_or_path="maidalun1020/bce-reranker-base_v1")

# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
OPENAI_API_KEY = ""
openai.api_key = OPENAI_API_KEY
client = Client()
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
DATA_URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"
CODE_URL = "https://api.github.com/repos/dgrtwo/data-screencasts/contents/"

# Global state variables
bkt_params = {}
user_id = ""
CUR_SEQ = []  # The current sequence of moves
all_code = {}
chat_bot = None
video_type = "Exploratory Data Analysis (EDA)"
code_line_buffer = ""
correct_answer_buffer = ""
knowledge_buffer = ""
prog_action = {
    "Scaffolding": [
        {
            "action": "Demonstrate the current task and provide explanations of the concepts underlying the current step of the task using {interaction}",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to explain the {knowledge} at this step, such as what effect we want to achieve, why we do it, and what function we use to do it]",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Coaching": [
        {
            "action": "Use {interaction} to guide the student through practice exercises, offering targeted hints and feedback",
            "interaction": "fill-in-blanks",
            "prompt": "[Use one sentence to prompt the student to fill in the {code-line-with-blanks} below to practice the {knowledge}][Provide a brief hint to help them through it]",
            "parameters": ["code-line-with-blanks", "knowledge"],
            "need-response": True,
        }
    ],
    "Articulation": [
        {
            "action": "Use {interaction} to allow students articulate their understanding of knowledge",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to ask the student to explain their understanding and reasoning about {knowledge}, such as articulate why make this kinds of visualization rather than others]",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Reflection": [
        {
            "action": "Encourage students to review and debug their code using {interaction}, and to reflect on the learning process by executing the complete code block to verify their understanding",
            "interaction": "show-code",
            "prompt": "[Use one sentence to let the student compare his answer with the standard {code-block}][Use one sentence to encourage the student to execute the complete code block to verify his understanding]",
            "parameters": ["code-block"],
            "need-response": True,
        }
    ],
}


concept_action = {
    "Scaffolding": [
        {
            "action": "Provide structured guidance through {interaction} as the student works on the task to learn the {knowledge}",
            "interaction": "plain-text",
            "prompt": "[Use no more than three sentences to guide the student step by step on how to learn and apply the {knowledge}, the student has made the visualizaiton]",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Articulation": [
        {
            "action": "Encourage students to use {interaction} to verbally explain their thought process and reasoning behind their observations and conclusions",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to ask the student to explain their understanding and reasoning about {knowledge}, such as articulate what patterns does he found in the chart]",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Coaching": [
        {
            "action": "Use {interaction} to observe the student's approach to tasks, offering feedback to guide learning",
            "interaction": "multiple-choice",
            "prompt": "Propose a multiple-choice question for the student to understand the {knowledge}, such as what could be the potential reason behind the pattern",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Reflection": [
        {
            "action": "Encourage students to use {interaction} to self-evaluate their performance, identifying strengths and areas for improvement",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to give feedback on the {student-answer}][Use one sentence to tell the student if any additional steps could confirm his choice][Ask the student to remember the choice and see if it makes sense as he watch the rest of the video]",
            "parameters": ["student-answer"],
            "need-response": True,
        }
    ],
}


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
        # OPENAI_API_KEY = data["apiKey"]
        # openai.api_key = OPENAI_API_KEY
        segments = get_segments(video_id)
        self.finish(json.dumps(segments))


class ChatHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global CUR_SEQ, all_code, chat_bot, code_line_buffer, correct_answer_buffer, knowledge_buffer

        # Existing video_id logic
        data = self.get_json_body()
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        kernelType = data["kernelType"]
        selected_choice = data["selectedChoice"]

        if kernelType == "ir":
            kernelType = "R"
        elif kernelType == "python3":
            kernelType = "Python"

        conn = sqlite3.connect("cache.db")
        c = conn.cursor()
        if chat_bot is None:
            init_bkt_params()
            initialize_chat_server(kernelType)

        if notebook:
            input_data = {}
            # Default to None to handle cases where it might not get set
            move_detail = None
            if CUR_SEQ != [] and question == "":
                # If the student does not ask a question, get the pedagogy, parameters, etc
                move_detail = CUR_SEQ[0]

                # Get whatever parameters when current segment needs
                parameters = move_detail.get(
                    "parameters", {}
                )  # Safely get parameters with a default

                if "knowledge" in parameters:
                    input_data["knowledge"] = move_detail["knowledge"]

                pedagogy = move_detail["prompt"]
                input_data["pedagogy"] = (
                    "Use the following structure to respond: " + pedagogy
                )
                need_response = move_detail.get("need-response", True)
                interaction = move_detail["interaction"]

                if selected_choice != "":
                    # If the student selects a choice, the response is the choice
                    input_data["student's choice"] = selected_choice

                # Handle interaction logic
                if interaction == "show-code":
                    input_data["requirement"] = (
                        "Don't include the 'code-block' in the response"
                    )
                    results = chat_bot.ask({"input": str(input_data)})
                    results = results + "\n" + all_code[str(segment_index)]
                elif interaction == "drop-down":
                    results = pedagogy
                elif interaction == "multiple-choice":
                    input_data["pedagogy"] = (
                        input_data["pedagogy"]
                        + ' Please respond with the following json structure without the ```json``` title: {"question": "question", "choices": ["choice", "choice", "choice"], "correct answer": "choice"}'
                    )
                    # results = conversation({"input": str(input_data)})["text"]
                    results = chat_bot.ask({"input": str(input_data)})
                    correct_answer_buffer = json.loads(results)["correct answer"]
                elif interaction == "fill-in-blanks":
                    # results = conversation({"input": str(input_data)})["text"]
                    code_line, code_line_with_blanks = get_code_with_blank_by_step(
                        video_id, segment_index, all_code, move_detail["knowledge"]
                    )
                    code_line_buffer = code_line
                    input_data["code-line-with-blanks"] = code_line_with_blanks
                    input_data["requirement"] = (
                        "Don't include the 'code-line-with-blanks' in the response"
                    )
                    results = chat_bot.ask({"input": str(input_data)})
                    results = (
                        results
                        # + " Please fill in the blanks in the code below"
                        # + " Try to understand the following lines."
                        + "\n"
                        + "```R"
                        + code_line_with_blanks
                        + "```"
                    )
                else:
                    # results = conversation({"input": str(input_data)})["text"]
                    results = chat_bot.ask({"input": str(input_data)})
                    if "code-line" in move_detail["parameters"]:
                        code_line, _ = get_code_with_blank_by_step(
                            video_id, segment_index, all_code, move_detail["knowledge"]
                        )
                        results = (
                            results
                            + " If you don't have any questions and are ready to continue, click the continue icon on the right"
                            + "\n"
                            + "```R"
                            + code_line
                            + "```"
                        )

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
                if get_skill_by_knowledge(move_detail["knowledge"]) != "":
                    knowledge_buffer = move_detail["knowledge"]
                CUR_SEQ.pop(0)  # After using this move, remove it from the sequence

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
                # results = conversation({"input": str(input_data)})["text"]
                results = chat_bot.ask({"input": str(input_data)})
            else:
                # Default case when there's no question or CUR_SEQ
                interaction = "auto-reply"
                results = "You have finished this part. Feel free to go ahead to the next video clip!"
                need_response = True

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
        global CUR_SEQ
        if CUR_SEQ != []:
            result = "no"
        else:
            # set_prev_notebook(data["notebook"])
            result = "yes"  # if there is no false, go on
        self.finish(json.dumps(result))


class UpdateSeqHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Update the sequence of moves and step index depending on the mastery of the skill and category."""
        global CUR_SEQ, all_code, bkt_params
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        learning_obj = data["category"]
        if all_code == {}:
            if video_id == "nx5yhXAQLxw":
                with open("college_major_code.json", "r") as file:
                    # Parse the file and convert JSON data into a Python dictionary
                    all_code = json.load(file)
            elif video_id == "Kd9BNI6QMmQ":
                with open("video_game_code.json", "r") as file:
                    # Parse the file and convert JSON data into a Python dictionary
                    all_code = json.load(file)
            elif video_id == "8jazNUpO3lQ":
                with open("ml_code.json", "r") as file:
                    # Parse the file and convert JSON data into a Python dictionary
                    all_code = json.load(file)

        if learning_obj == "Load packages/data":
            sections = [
                {
                    "knowledge": "The task is knowing how to load the dataset and packages using R to do EDA-related tasks",
                    "actions": [
                        {
                            "method": "Modeling",
                            "action": "Let the student execute the completed full code block",
                            "prompt": "Generate a similar sentence like this: 'The relevant library and dataset can be imported and loaded using the following code. Try to understand the code like the video does. Then, move on to the next video to learn how to look at the dataset.'",
                            "interaction": "show-code",
                            "parameters": ["code-block"],
                            "need-response": True,
                        }
                    ],
                }
            ]
        elif learning_obj == "Understand the dataset":
            sections = [
                {
                    "knowledge": "Understand the attribute meanings and metrics of the dataset, and generate hypothesis on the data",
                    "actions": [
                        {
                            "method": "Exploration",
                            "action": "Have the student illustrate his findings by explore the dataset",
                            "prompt": "Exploring and understanding the dataset and its attributes is the first step to doing exploratory data analysis. Now please try exploring the data on your own! Select a column below and look at a description and distribution just like Dave! If you have any hypothesis, please share with me.",
                            "interaction": "drop-down",
                            "parameters": [],
                            "need-response": True,
                        }
                    ],
                }
            ]
        else:
            code_block = all_code.get(str(segment_index), "")
            knowledge = get_knowledge(
                video_id, video_type, learning_obj, segment_index, code_block
            )
            mastery_level = get_mastery_level_by_segment(knowledge, bkt_params)
            methods = get_methods(
                video_type, learning_obj, knowledge, mastery_level, code_block
            )
            if code_block == "":
                action_set = concept_action
            else:
                action_set = prog_action
            sections = get_dsl(methods, action_set)
        CUR_SEQ = [
            dict(knowledge=section["knowledge"], **action)
            for section in sections
            for action in section["actions"]
        ]
        print("CUR_SEQ after update:", CUR_SEQ)


class FillInBlanksHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Get all choices for the fill-in-blanks action."""
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        functions_attributes_to_learn = get_function_attribute_by_segment(
            video_id=video_id, segment_index=segment_index, code_json=all_code
        )
        # Flattening the list of lists and extracting unique items
        choices = list(set(functions_attributes_to_learn))
        self.finish(json.dumps(choices))


class UpdateBKTHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        global bkt_params, CUR_SEQ, knowledge_buffer
        data = self.get_json_body()
        video_id = data["videoId"]
        filled_code = data["filledCode"]
        selected_choice = data["selectedChoice"]
        skill = get_skill_by_knowledge(knowledge_buffer)
        if video_id != "" and skill != "":
            update_bkt_params(skill, filled_code, selected_choice)
            self.finish(json.dumps("update bkt successfully"))
        else:
            print("Something wrong in UpdateBKTHandler.")


def initialze_database():
    """Initialize the database that has the transcript and segments for videos."""
    global user_id
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
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
    CREATE TABLE IF NOT EXISTS bkt_params_cache (
        user_id TEXT PRIMARY KEY,
        skills_probMastery TEXT NOT NULL
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS knowledge_cache (
        video_id TEXT,
        segment_index NUMBER NOT NULL,
        knowledge TEXT NOT NULL,
        PRIMARY KEY (video_id, segment_index)
    );"""
    )
    c.execute(
        """
    CREATE TABLE IF NOT EXISTS code_block_cache (
        video_id TEXT,
        segment_index NUMBER NOT NULL,
        code_with_blanks TEXT,
        PRIMARY KEY (video_id, segment_index)
    );"""
    )

    video_id = "nx5yhXAQLxw"
    segments_set = [
        {"category": "Introduction", "start": 1, "end": 86},  # 0
        {"category": "Load packages/data", "start": 86, "end": 212},  # 1
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
        {"category": "Introduction", "start": 1, "end": 102},  # 0
        {"category": "Load packages/data", "start": 102, "end": 137},  # 1
        {"category": "Understand the dataset", "start": 137, "end": 220},  # 2
        {"category": "Preprocess the data", "start": 220, "end": 568},  # 3
        {"category": "Visualize the data", "start": 568, "end": 580},  # 4
        {"category": "Interpret the chart", "start": 580, "end": 596},  # 5
        {"category": "Visualize the data", "start": 596, "end": 655},  # 6
        {"category": "Interpret the chart", "start": 655, "end": 740},  # 7
        {"category": "Visualize the data", "start": 740, "end": 900},  # 8
        {"category": "Interpret the chart", "start": 900, "end": 968},  # 9
        {"category": "Visualize the data", "start": 968, "end": 1027},  # 10
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )

    video_id = "8jazNUpO3lQ"
    segments_set = [
        {"category": "Basic linear regression concepts", "start": 1, "end": 155},  # 0
        {"category": "Load packages/data", "start": 155, "end": 232},  # 1
        {
            "category": "Plot a plot for linear regression",
            "start": 232,
            "end": 325,
        },  # 2
        {
            "category": "Create and understand linear regression object",
            "start": 325,
            "end": 551,
        },  # 3
        {
            "category": "Generate CSV file with list of home price predictions",
            "start": 551,
            "end": 712,
        },
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )
    all_skills = [
        "use 'geom_boxplot' to achieve a meaningful visualization of data distributions",
    ]
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


class CustomChatBotWithMemory:
    def __init__(self, kernel_type):
        self.kernel_type = self._translate_kernel_type(kernel_type)
        self.video_type = "Exploratory Data Analysis (EDA)"
        self.memory = ConversationBufferMemory()

    def _translate_kernel_type(self, kernel_type):
        if kernel_type == "ir":
            return "R"
        elif kernel_type == "python3":
            return "Python"
        return kernel_type

    def _generate_prompt(self):
        template = f"""
        You are an expert in Data Science, specializing in {self.video_type}. Your task is to use the Cognitive Apprenticeship approach to assist a student in learning {self.video_type} through David Robinson's Tidy Tuesday tutorial series.

        You will be provided with one or more of the following inputs:
        - knowledge: the knowledge that will be learned by the student
        - pedagogy: the specific cognitive apprenticeship move that you need to follow to guide students.
        - student's code or question or choice: the student's current performance, encompassing either the code in the student's notebook or the student's query sent to you or student's choice in the multiple-choice question.
        - other parameters or requirements: additional information or requirements that you need to follow to guide the student.

        Notes for Response:
        - Don't answer or say anything irrelevant to the video topic ({self.video_type}) or the programming language ({self.kernel_type}).
        - Use natural language to communicate in the first person as a teaching assistant.
        - You must strictly follow the pedagogy to provide guidance.
        - Tailor your advice to the programming language the student uses: {self.kernel_type}.
        - Don't tell the student that your response is based on the transcript or code.
        - You can find out the full list of conversation history below.
        """
        history = self.memory.load_memory_variables({})["history"]
        return template + "conversation history: " + history

    def ask(self, user_input):
        prompt = self._generate_prompt()
        # response = openai.ChatCompletion.create(
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": str(user_input),
                },
            ],
            temperature=0.3,
        )
        bot_response = response.choices[0].message.content
        # bot_response = response["choices"][0]["message"]["content"]
        # Update memory with the latest exchange
        self.memory.save_context({"input": str(user_input)}, {"output": bot_response})
        return bot_response


def initialize_chat_server(kernelType):
    """Initialize the chat server."""
    global chat_bot
    chat_bot = CustomChatBotWithMemory(kernel_type=kernelType)


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
    data = YouTubeTranscriptApi.get_transcript(video_id)
    transcript = [i for i in data if i["start"] >= start and i["start"] < end]
    for item in transcript:
        del item["duration"]

    # Use list comprehension to extract the 'text' values
    texts = [item["text"] for item in transcript]

    # Join the list of strings with spaces
    paragraph = " ".join(texts)

    return transcript, paragraph


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
        segments = get_video_segment(video_id)
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, json.dumps(segments)),
        )
        conn.commit()
        conn.close()
        return segments


def get_summary_by_LO(transcript, learning_goal):
    """Get the summary of a transcript by learning goal."""
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": f"""Here is a video transcript about {video_type}. Summarize the video content that corresponds to each given learning goal.
                                The transcript is not necessarily arranged in the order in which the learning goals are defined and can contain multiple segments with the same learning goal.
                                The script may contain only some of the learning goals. Please do not include summary of learning goals that do not exist in the transcript.
                                Increase the granularity, for example if the video author create two different visualizations, they should be summarized into two distince points.
                                The result should be in the order of their appearance in the video, instead of the order of the definition of learning goals.
                                Generally, 'Visualize the data' and 'Interpret the chart' are adjacent but not necessarily related.

                                The learning_goal and summary should be strings quoted in single quotes. Response only in a list without any explanations, for example:
                                [
                                    (learning_goal, summary),
                                    (learning_goal, summary),
                                    (learning_goal, summary),
                                    ...
                                ]
                            """,
            },
            {
                "role": "user",
                "content": f"transcript: {transcript}, learning goals: {learning_goal}",
            },
        ],
        temperature=0.1,
    )
    summary = ast.literal_eval(response.choices[0].message.content)
    formatted_list = [{"category": item[0], "summary": item[1]} for item in summary]
    return formatted_list


def get_start_sentence(summary_list, transcript):
    """Returns the start sentence of each summary in the transcript."""
    for i, item in enumerate(summary_list):
        if i != 0:
            long_string = transcript
            short_string = summary_list[i - 1]["start sentence"]

            # Find the index of the short string
            index = long_string.find(short_string)

            # Slice the long string from the end of the short string
            if index != -1:
                result_string = long_string[index + len(short_string) :]
            else:
                result_string = long_string  # or some error handling if the short string is not found
        else:
            result_string = transcript

        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": """Here is a transcript of the video about exploratory data analysis and a summary of one paragraph of the video transcript.
                                Find the starting sentence in the given transcript that corresponds to the summary.
                                Don't add punctuation or capitalization that are not in the original transcript.
                                Response only the first sentence.
                            """,
                },
                {
                    "role": "user",
                    "content": f"transcript: {result_string}, summary: {item['summary']}",
                },
            ],
            temperature=0.1,
        )

        sentence = response.choices[0].message.content
        item["start sentence"] = sentence

    start_sentence_list = []
    for item in summary_list:
        start_sentence_list.append(item["start sentence"])
    return start_sentence_list


def get_timestamp(transcript_with_time, start_sentence_list):
    """Returns the start timestamp of each sentence in the start sentence list."""
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": """Here is a video transcript about exploratory data analysis and a list of sentences.
                            Find out the start timestamp corresponding to each sentence.
                            Response only in a list, for example:
                            [
                                start timestamp 1,
                                start timestamp 2,
                                start timestamp 3,
                                ...
                            ]
                            """,
            },
            {
                "role": "user",
                "content": f"transcript: {transcript_with_time}, sentence list: {start_sentence_list}",
            },
        ],
        temperature=0.1,
    )
    time = ast.literal_eval(response.choices[0].message.content)
    return time


def merge_and_convert_to_integers(items):
    """Merge items with the same category and convert the time to integers.."""
    if not items:
        return []

    # Initialize the result list with the first item
    merged_items = [items[0]]

    # Iterate over the list starting from the second item
    for item in items[1:]:
        # Check if the current item's category matches the last item in the merged list
        if item["category"] == merged_items[-1]["category"]:
            # If they match, continue without adding the item to the merged list
            continue
        else:
            # If they don't match, add the item to the merged list
            merged_items.append(item)

    for segment in merged_items:
        segment["start"] = int(segment["start"])
        segment["end"] = int(segment["end"])

    return merged_items


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


def get_video_segment(video_id, start_time=0, end_time=600):
    """Returns the segments of the video transcript by learning goals."""
    length = end_time - start_time
    periods = math.ceil(length / 600)
    results = []
    # Segment the given video every 10-minute periods
    for i in range(periods):
        if i == 0:
            transcript_with_time, transcript = get_transcript(video_id, 0, 600)
            learning_goals = """
                Introduction: Identify segments where David Robinson introduces himself, the project, and the dataset's theme, emphasizing the context and purpose of the analysis.
                Load data/packages: Look for parts where he discusses accessing, downloading, and loading the dataset into the software, as well as importing necessary libraries or packages for the analysis.
                Understand the dataset: Focus on segments where David examines the dataset for the first time, mentions data attributes, and talks about initial findings or hypotheses.
                Visualize the data: Recognize parts where David talks about his intent to create visualizations, the process of making these plots, and the technical details of the visualization tools or methods he uses.
                Interpret the chart: Look for segments where David analyzes and discusses the implications of the data visualizations, drawing conclusions, and theorizing about the underlying trends or patterns in the data.
                Preprocess the data: Identify any actions taken to modify, clean, or transform the data to facilitate better analysis, such as creating new variables or adjusting the existing dataset for analysis.
            """
        else:
            end = end_time if end_time <= (i + 1) * 600 else (i + 1) * 600
            transcript_with_time, transcript = get_transcript(video_id, i * 600, end)
            learning_goals = """
                Visualize the data: Recognize parts where David talks about his intent to create visualizations, the process of making these plots, and the technical details of the visualization tools or methods he uses.
                Interpret the chart: Look for segments where David analyzes and discusses the implications of the data visualizations, drawing conclusions, and theorizing about the underlying trends or patterns in the data.
                Preprocess the data: Identify any actions taken to modify, clean, or transform the data to facilitate better analysis, such as creating new variables or adjusting the existing dataset for analysis.
            """
        summary_list = get_summary_by_LO(transcript, learning_goals)
        start_sentence_list = get_start_sentence(summary_list, transcript)
        time = get_timestamp(transcript_with_time, start_sentence_list)

        for i, item in enumerate(summary_list):
            if i != len(summary_list) - 1:
                results.append(
                    {"category": item["category"], "start": time[i], "end": time[i + 1]}
                )
            else:
                results.append(
                    {"category": item["category"], "start": time[i], "end": end_time}
                )

    return merge_and_convert_to_integers(results)


def get_knowledge(video_id, video_type, learning_obj, segment_index, code_block):
    """Get the knowledge from the video transcript and code block."""
    segments_set = get_segments(video_id)
    segment = segments_set[segment_index]
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT knowledge FROM knowledge_cache WHERE video_id = ? AND segment_index = ?",
        (
            video_id,
            segment_index,
        ),
    )
    row = c.fetchone()
    if row:
        return ast.literal_eval(row[0])

    start_time = segment["start"]
    end_time = segment["end"]
    _, segment_transcript = get_transcript("nx5yhXAQLxw", start_time, end_time)
    if end_time - start_time > 150:
        num = 5
    elif end_time - start_time < 50:
        num = 3
    else:
        num = 4
    if code_block != "":
        # response = openai.ChatCompletion.create(
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""The following {video_type} video transcript and the code block taught in the video are about a learning goal: {learning_obj}. Summarize the declarative and procedural knowledge in the video transcript and code block.
                                The result should be summarized in one sentence of declarative knowledge, and no more than {num - 1} sentences of procedural knowledge, in the order in which it should be learned.
                                Each knowledge should follow this format:
                                Declarative knowledge: "The task is + [final goal] + using + [general method/tool] + and + [additional method/technique for enhancement]".
                                For example, The task is comparing the distribution of median earnings across different major categories using a box plot and adjusting the visualization for better readability and interpretation."
                                Procedural knowledge: "To achieve + [specific goal] + one need to + [action/verb] + [specific function/tool] + on + [specific attribute/object] + because + [reason/purpose]."
                                The [specfic goal] and [action/verb] + [specific function/tool] should be quoted in a && sign. The [specific function/tool] and [specific attribute/object] should be quoted in a pair of single quotes.
                                For example, "To &achieve an ordered factor level& based on the 'Median', one need to &use 'fct_reorder'& on 'Major_category', making it easier to compare distributions."
                                Your response should be in a list format:
                                [
                                    'knowledge_1',
                                    'knowledge_2',
                                    ...
                                ]
                                """,
                },
                {
                    "role": "user",
                    "content": f"video transcript: {segment_transcript}, code block: {code_block}",
                },
            ],
            temperature=0.2,
        )
    else:
        # response = openai.ChatCompletion.create(
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""The following {video_type} video transcript is about a learning goal: {learning_obj}. Summarize the declarative and procedural knowledge in the video transcript.
                                    The result should be summarized in one sentence of procedural knowledge, and no more than {num - 1} sentences of declarative knowledge, in the order in which it should be learned.
                                    Each knowledge should follow this format:
                                    Procedural knowledge: "To achieve/understand + [specific goal/outcome] + one need to + [general actions/processes] + [additional details] + and consider/use + [relevant factors/tools]." The [general actions/processes] should be quoted in a && sign.
                                    For example, "To understand the distribution of earnings by college major, one need to &examine the histogram and identify overall trend or extreme values&, and consider whether high earnings are due to the field's financial reward or influenced by factors such as low sample size and high variation."
                                    Declarative knowledge: "[Subject] + [verb phrase] + that + [independent clause]".
                                    For example, "The median income by college major shows that majors earn a median income of over $30K right out of college."
                                    And sort the output knowledge order according to the correct cognitive order. For example, students need to first learn how to interpret the chart then find out the facts in the chart.
                                    Your response should be in a list format without any explanations:
                                    [
                                        'knowledge_1',
                                        'knowledge_2',
                                        ...
                                    ]
                                """,
                },
                {
                    "role": "user",
                    "content": f"video transcript: {segment_transcript}",
                },
            ],
            temperature=0.2,
        )
    knowledge = response.choices[0].message.content
    # Insert new data if video_id doesn't exist
    c.execute(
        "INSERT INTO knowledge_cache (video_id, segment_index, knowledge) VALUES (?, ?, ?)",
        (video_id, segment_index, knowledge),
    )
    conn.commit()
    conn.close()
    knowledge = ast.literal_eval(knowledge)
    return knowledge


def get_methods(video_type, learning_obj, knowledge, mastery_level, code_block):
    """Get the teaching methods for the given knowledge and mastery level."""
    if code_block == "":
        video_content = "concept-related"
    else:
        video_content = "programming-related"
    # response = openai.ChatCompletion.create(
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": f"""You are an expert mentor who is good at arrange teaching methods to help student learn from a video about {video_type}.
                                You are teaching student to learn knowledge for {learning_obj} using the Cognitive Apprenticeship framework.

                                Definition of Cognitive Apprenticeship framework methods:
                                Coaching: mentor observes mentee's activities along with provision of guidance and feedback
                                Scaffolding: mentor supports mentee while they work through the task with gradual fading of such supports
                                Articulation: mentor encourage mentees to verbalize their knowledge and thinking
                                Reflection: mentor enable mentees to self-assesses own performance

                                Your task is to choose proper Cognitive Apprenticeship methods to teach the student each of the given knowledge.
                                The input knowledge list contains the declarative and procedural knowledge in the video.
                                The input student mastery level list has a one-to-one correspondence with the knowledge, which represents the student's mastery of each knowledge.

                                Teaching method arrangement rules:
                                1. Global before local skills: use Scaffolding as the first move to teach the first knowledge.

                                2.1 Increasing complexity for concept-related video:
                                Choose one method from Scaffolding, Coaching, or Articulation to teach each knowledge.
                                If the student's mastery level of the corresponding knowledge exceeds 0.5, Scaffolding should fade out.
                                Coaching should be followed by Reflection. Reflection should only be used after Coaching.

                                2.2 Increasing complexity for programming-related video:
                                For each declarative knowledge, choose between Scaffolding and Articulation.
                                For each procedural knowledge, if the student's mastery level of the corresponding knowledge is lower than 0.3, use Scaffolding only.
                                If the student's mastery level of the corresponding knowledge is between 0.3 and 0.7, use Scaffolding and Coaching.
                                If the student's mastery level of the corresponding knowledge is higher than 0.7, Scaffolding fades out and use Coaching only.
                                Reflection should be used once as the last method for the last knowledge.

                                3. Increasing diversity: diversify the selection of teaching methods based on the first two conditions.

                                You should use no more than three methods for each knowledge. Please include your choice in a structure in the same format like the following.
                                Response Example:
                                [
                                    {{
                                        "knowledge": ...,
                                        "method": [...]
                                    }},
                                    ...
                                ]
                            """,
            },
            {
                "role": "user",
                "content": f"programming or concept: {video_content}, knowledge: {knowledge}, student's mastery level: {mastery_level}",
            },
        ],
        temperature=0.2,
    )
    methods = response.choices[0].message.content
    methods = ast.literal_eval(methods)
    return methods


def get_dsl(methods, action_set):
    """Get the domain specific language for a video segment."""
    result = []

    for method_entry in methods:
        knowledge = method_entry["knowledge"]
        action_entries = method_entry["method"]

        # Prepare the actions list based on the teaching methods provided
        actions = []
        for action in action_entries:
            if action in action_set:
                for action_detail in action_set[action]:
                    # Create a new action entry
                    new_action = {
                        "method": action,
                        "action": action_detail["action"].replace(
                            "{interaction}", action_detail["interaction"]
                        ),
                        "prompt": action_detail["prompt"].replace(
                            "{knowledge}", knowledge
                        ),
                        "interaction": action_detail["interaction"],
                        "need-response": action_detail["need-response"],
                        "parameters": action_detail["parameters"],
                    }
                    actions.append(new_action)

        # Add to the final result
        result.append({"knowledge": knowledge, "actions": actions})

    return result


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
    if is_correct == True:
        numerator = model["probMastery"] * (1 - model["probSlip"])
        mastery_and_guess = (1 - model["probMastery"]) * model["probGuess"]
    else:
        numerator = model["probMastery"] * model["probSlip"]
        mastery_and_guess = (1 - model["probMastery"]) * (1 - model["probGuess"])

    prob_mastery_given_observation = numerator / (numerator + mastery_and_guess)
    model["probMastery"] = prob_mastery_given_observation + (
        (1 - prob_mastery_given_observation) * model["probTransit"]
    )


def get_mastery_level_by_segment(list_of_knowledge, bkt_params):
    """Get the mastery level for the given list of knowledge."""
    mastery_level = []
    for knowledge in list_of_knowledge:
        skill = get_skill_by_knowledge(knowledge)
        rerank_results = model.rerank(skill, bkt_params.keys())

        if skill == "":
            # if the knowledge does not contain a skill
            mastery_level.append(0.5)
        elif rerank_results["rerank_scores"][0] >= 0.55:
            # if the skill is very similar to a skill in the bkt_params
            # use the bkt_params of that skill and update the skill name
            bkt_params[skill] = bkt_params[rerank_results["rerank_passages"][0]]
            del bkt_params[rerank_results["rerank_passages"][0]]
            mastery_level.append(bkt_params[skill]["probMastery"])
        else:
            # if the skill is not similar to any skill in the bkt_params
            # create a new skill with default params
            bkt_params[skill] = {
                "probMastery": 0.1,
                "probTransit": 0.1,
                "probSlip": 0.1,
                "probGuess": 0.1,
            }
            mastery_level.append(0.1)
    return mastery_level


def update_bkt_params(skill, filled_code, selected_choice):
    """Update the bkt parameters for the practiced skills."""
    global bkt_params, code_line_buffer, correct_answer_buffer
    if filled_code != "":
        is_correct = filled_code.strip() == code_line_buffer.strip()
        code_line_buffer = ""
    else:
        is_correct = selected_choice == correct_answer_buffer
        correct_answer_buffer = ""

    update_bkt_param(bkt_params[skill], is_correct)
    print("bkt_params: " + str(bkt_params))


def get_skill_by_knowledge(knowledge):
    """Get the skills corresponding to the given segment."""
    # Regular expression to find text between & symbols
    pattern = r"&([^&]*)&"
    # Using re.findall to get all substrings between & characters
    substrings = re.findall(pattern, knowledge)

    if len(substrings) > 1:
        skill = substrings[1] + " to " + substrings[0]
    elif len(substrings) == 1:
        skill = substrings[0]
    else:
        skill = ""
    return skill


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


def get_function_attribute_by_knowledge(knowledge):
    """Get the functions and attributes to learn of knowledge."""
    # Regular expression to find text within single quotes
    pattern = r"'([^']*)'"
    # Using re.findall to get all substrings within single quotes
    results = re.findall(pattern, knowledge)
    return results


def get_function_attribute_by_segment(video_id, segment_index, code_json):
    """Get the functions and attributes to learn in a video segment."""
    if str(segment_index) in code_json.keys():
        code_block = code_json[str(segment_index)]
    else:
        return []
    segment_set = get_segments(video_id)
    segment = segment_set[segment_index]
    learning_goal = segment["category"]
    knowledge = get_knowledge(
        video_id, video_type, learning_goal, segment_index, code_block
    )
    results = []
    for item in knowledge:
        # Using re.findall to get all substrings within single quotes
        substrings = get_function_attribute_by_knowledge(item)
        results += substrings
    return results


def get_code_with_blank(video_id, segment_index, code_json):
    """Get the code block with blanks for the given video segment."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT code_with_blanks FROM code_block_cache WHERE video_id = ? AND segment_index = ?",
        (video_id, segment_index),
    )
    row = c.fetchone()
    if row:
        return row[0]
    # get the code block
    function_attribute = get_function_attribute_by_segment(
        video_id, segment_index, code_json
    )
    code_block = code_json[str(segment_index)]
    print("functions_attributes_to_learn:", function_attribute)
    # get the code with blank
    # response = openai.ChatCompletion.create(
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": """Use the given code block, make all the designated functions and attributes to be blanks in the code as blanks.
                            You should not make code that is not in the designated functions and attributes to be blanks.
                            The code blanks should only be the items in the functions/attributes to learn so that students can use the items to fill in the blanks.
                            Adjusts the range of blanks according to the format of the items in the given functions/attributes to learn list.
                            If the item in functions/attributes to learn is a single function or attribute, such as 'geom_boxplot' or 'median', then make this function place a blank.
                            If the item in functions/attributes to learn is a function with attributes as a whole, such as 'aes(median)', then make this function with the attribute place a whole blank.
                            If the item in functions/attributes to learn is a parameter in a function, such as 'labels = dollar_format()', then make this whole as a blank.
                            You should not respond with any comments or explanations.
                            Each blank should be exactly an underscore consisting of three short underscores '___'.
                            Respond in the following format: ```{{r code with blanks}}```
                            """,
            },
            {
                "role": "user",
                "content": f"functions/attributes to learn: {str(function_attribute)}, code block: {str(code_block)}",
            },
        ],
        temperature=0.2,
    )
    code_with_blanks = response.choices[0].message.content
    c.execute(
        "UPDATE code_block_cache SET code_with_blanks = ? WHERE video_id = ? AND segment_index = ?",
        (code_with_blanks, video_id, segment_index),
    )
    conn.commit()
    conn.close()
    return code_with_blanks


def get_code_with_blank_by_step(video_id, segment_index, code_json, knowledge):
    """Get the code with blank by step index for a video segment."""
    code_with_blanks = get_code_with_blank(video_id, segment_index, code_json)
    code_block = code_json[str(segment_index)]
    # Split the code block into a list by newline character
    code_lines = code_block.split("\\n")[1:-1]
    code_lines_with_blanks = code_with_blanks.split("\n")[1:-1]
    function_attribute = get_function_attribute_by_knowledge(knowledge)
    # get the code with blank
    # response = openai.ChatCompletion.create(
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": """You are an expert programmer who can understand R code. A student is learning EDA by learning code line-by-line.
                            Now your task is to find out the corresponding code lines index (start from 0) in the code block that corresponds to current knowledge and the functions and attributes to learn.
                            The corresponding code lines can have one or two lines. Respond in the following format (a list without explanation): [index_1, ...]
                        """,
            },
            {
                "role": "user",
                "content": f"knowledge to learn: {str(knowledge)}, function and attribute to learn: {str(function_attribute)}, code block: {code_lines}",
            },
        ],
        temperature=0.2,
    )
    line_index = response.choices[0].message.content
    line_index = ast.literal_eval(line_index)
    line_index.sort()
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
