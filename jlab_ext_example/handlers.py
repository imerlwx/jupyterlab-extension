# handler.py
import os
import re
import json
import isodate
import datetime
import requests
import openai
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# openai.api_key = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
openai.api_key = "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"
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
DATA_URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"
CODE_URL = "https://api.github.com/repos/dgrtwo/data-screencasts/contents/"
TRANSCRIPT_CACHE = {}


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
        if not video_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "Missing video_id"}))
            return
        llm_response = get_video_segment(video_id)
        segments = [
            {"start": item["start"], "end": item["end"], "name": item["category"]}
            for item in llm_response
        ]

        self.finish(json.dumps(segments))


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
            and datetime.datetime.strptime(folder["name"], "%Y-%m-%d") <= target_date
        ),
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
    """Get the transcript file corresponding to a video."""
    if video_id not in TRANSCRIPT_CACHE.keys():
        data = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = [i for i in data if i["start"] < 900]
        for item in transcript:
            del item["duration"]
        TRANSCRIPT_CACHE[video_id] = transcript
    return TRANSCRIPT_CACHE[video_id]


def get_code_file(video_id):
    """Get the code file wrote by David Robinson in the tutorial video."""
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
