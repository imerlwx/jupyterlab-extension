"""Fetch and bundle YouTube transcripts for the study videos.

YouTube blocks transcript requests from cloud-provider IPs, so the GCP VM
cannot fetch them at runtime (youtube_transcript_api raises RequestBlocked).
Run this from a normal residential connection to refresh the bundled copies in
jlab_ext_example/transcripts/, then commit them so they deploy with the
package.

Usage:
    python tools/fetch_transcripts.py                  # the three study videos
    python tools/fetch_transcripts.py --videos ID ID   # specific videos
"""

import argparse
import json
import os
import sys

STUDY_VIDEO_IDS = ["EF4A4OtQprg", "1xsbTs9-a50", "-1x8Kpyndss"]
OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "jlab_ext_example",
    "transcripts",
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--videos",
        nargs="+",
        default=STUDY_VIDEO_IDS,
        help="Video IDs to fetch (default: the three study videos).",
    )
    parser.add_argument("--out", default=OUT_DIR, help="Output directory.")
    args = parser.parse_args()

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        sys.exit("youtube-transcript-api not installed.")

    os.makedirs(args.out, exist_ok=True)
    api = YouTubeTranscriptApi()
    failed = []

    for vid in args.videos:
        try:
            data = api.fetch(vid).to_raw_data()
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"{vid}: FAILED {type(exc).__name__}: {str(exc)[:200]}")
            failed.append(vid)
            continue
        path = os.path.join(args.out, f"{vid}.json")
        with open(path, "w") as f:
            json.dump(data, f, ensure_ascii=False)
        span = max(i["start"] for i in data) if data else 0
        print(f"{vid}: {len(data)} cues, spans 0-{span:.0f}s -> {path}")

    if failed:
        sys.exit(f"\nFailed for: {', '.join(failed)}")
    print("\nDone. Commit the files in jlab_ext_example/transcripts/.")


if __name__ == "__main__":
    main()
