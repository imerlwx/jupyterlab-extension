# handler.py
import os
import re
import json
import isodate
import datetime
import requests
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from googleapiclient.discovery import build

YOUTUBE_API_KEY = "AIzaSyA_72GvOE9OdRKdCIk2-lXC_BTUrGwnz2A"
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"


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
        video_response = (
            youtube.videos().list(part="contentDetails", id=video_id).execute()
        )

        duration = video_response["items"][0]["contentDetails"]["duration"]
        total_seconds = iso8601_duration_as_seconds(duration)
        segment_duration = total_seconds // 10
        segments = [
            {
                "start": i * segment_duration,
                "end": (i + 1) * segment_duration,
                "url": f"https://www.youtube.com/embed/{video_id}?start={i * segment_duration}&end={(i + 1) * segment_duration}&autoplay=0",
            }
            for i in range(10)
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
