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

# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
openai.api_key = "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"
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"
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
        csv_data = get_csv_from_youtube_video(YOUTUBE_API_KEY, video_id)
        self.finish(json.dumps(csv_data))


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
        # video_response = (
        #     youtube.videos().list(part="contentDetails", id=video_id).execute()
        # )

        # duration = video_response["items"][0]["contentDetails"]["duration"]
        # total_seconds = iso8601_duration_as_seconds(duration)
        # segment_duration = total_seconds // 10
        # segments = [
        #     {
        #         "start": i * segment_duration,
        #         "end": (i + 1) * segment_duration,
        #         "url": f"https://www.youtube.com/embed/{video_id}?start={i * segment_duration}&end={(i + 1) * segment_duration}&autoplay=0",
        #     }
        #     for i in range(10)
        # ]
        llm_response = get_video_segment(video_id)
        segments = [
            {"start": item["start"], "end": item["end"], "name": item["category"]}
            for item in llm_response
        ]

        self.finish(json.dumps(segments))


def iso8601_duration_as_seconds(duration):
    duration_obj = isodate.parse_duration(duration)
    return duration_obj.total_seconds()


def get_youtube_publish_date(youtube_api, video_id):
    """Returns the published date of the given youtube video."""
    url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={youtube_api}"
    response = requests.get(url)
    data = response.json()
    publish_date = data["items"][0]["snippet"]["publishedAt"]
    publish_date = publish_date.split("T")[0]
    return publish_date


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
    url = URL + str(year_date)
    data = get_data(url)
    closest_folder = min(
        (folder for folder in data if is_valid_date(folder["name"])),
        key=lambda folder: abs(
            datetime.datetime.strptime(folder["name"], "%Y-%m-%d") - target_date
        ),
    )
    return closest_folder["url"]


def get_csv_file(folder):
    """"""
    data = get_data(folder)
    # Filter out items where 'name' ends with '.csv'
    csv_files = list(filter(lambda item: item["name"].endswith(".csv"), data))

    # Make a dictionary list that each item has this structure: {'name': string, 'download_url': string}
    csv_list = []
    for csv_file in csv_files:
        csv_list.append(
            {"name": csv_file["name"], "download_url": csv_file["download_url"]}
        )

    return csv_list


def get_csv_from_youtube_video(youtube_api, video_id):
    video_publish_date = get_youtube_publish_date(youtube_api, video_id)
    closest_folder = get_closest_date_folder(video_publish_date)
    csv_list = get_csv_file(closest_folder)
    return csv_list


def get_transcript(video_id):
    if video_id not in TRANSCRIPT_CACHE.keys():
        data = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = [i for i in data if i["start"] < 900]
        for item in transcript:
            del item["duration"]
        TRANSCRIPT_CACHE[video_id] = transcript
    return TRANSCRIPT_CACHE[video_id]


def get_video_segment(video_id):
    transcript_1 = get_transcript("Kd9BNI6QMmQ")
    transcript_2 = get_transcript("nx5yhXAQLxw")
    transcript_3 = get_transcript(video_id)

    completion = openai.ChatCompletion.create(
        model="gpt-4-32k",
        messages=[
            {
                "role": "system",
                "content": """
                            You are the most experienced transcript segment assistant in the world who is focused on segmenting the transcripts of videos teaching exploratory data analysis. 
                            You have read countless video transcripts about exploratory data analysis so you are confident to segment one into the following 6 categories.
                            1. Introduction; 2. Load data / packages; 3. Initial observation on raw data; 4. Data processing; 5. Data visualization; 6. Chart interpretation / insights.
                            Specifically, you can find categories that correspond to nothing in the transcript, and can find parts in the transcript that correspond to the same category.
                            It is okay if the transcript for you to segment is shorter then the example. 
                            Restriction:
                            - Don't assume the example is the answer. 
                            - You will not make any assumptions without the input transcript.
                            - You will not omit any video transcript segment.
                            - Output all the times in integer seconds.
                            - Each category could have multiple time period.
                            - Don't segment time that do not appear in the video.
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
