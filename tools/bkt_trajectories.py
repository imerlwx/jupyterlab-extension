"""Reconstruct per-skill mastery trajectories from the bkt_updates log.

`bkt_state/{user}/{skill}` deliberately holds only the CURRENT snapshot. The
full history is in `bkt_updates/{user}/{session}/{push_id}`, where every event
records old_mastery, new_mastery, mastery_change and n_observations. Because a
concept-tagged skill is practiced across several videos (and therefore several
sessions), one skill's trajectory is spread over multiple session children —
this script stitches them back together, ordered by timestamp.

Output is long-format CSV (one row per observation), ready for ggplot:

    ggplot(d, aes(seq, new_mastery, colour = skill)) +
      geom_line() + geom_point() + facet_wrap(~ user_id)

Usage:
    # from a directory produced by tools/export_firebase_data.py
    python tools/bkt_trajectories.py --export-dir firebase_export

    # or straight from Firebase
    FIREBASE_CREDENTIALS_PATH=... FIREBASE_DATABASE_URL=... \
        python tools/bkt_trajectories.py --live

    # drop pilot/test accounts
    python tools/bkt_trajectories.py --export-dir firebase_export \
        --exclude-prefix test_
"""

import argparse
import csv
import json
import os
import sys

FIELDS = [
    "user_id",
    "skill",
    "seq",            # 1..N: this skill's observation number for this user
    "timestamp",
    "session_id",
    "video_id",
    "segment_index",
    "interaction_type",
    "is_correct",
    "old_mastery",
    "new_mastery",
    "mastery_change",
    "n_observations",
    "rubric_mean",
    "slip",
    "guess",
    "transit",
]


def load_updates(args):
    if args.live:
        try:
            import firebase_admin
            from firebase_admin import credentials, db
        except ImportError:
            sys.exit("firebase-admin not installed.")
        cred = os.environ.get("FIREBASE_CREDENTIALS_PATH")
        url = os.environ.get("FIREBASE_DATABASE_URL")
        if not cred or not url:
            sys.exit("Set FIREBASE_CREDENTIALS_PATH and FIREBASE_DATABASE_URL.")
        firebase_admin.initialize_app(
            credentials.Certificate(cred), {"databaseURL": url}
        )
        return db.reference("bkt_updates").get() or {}
    path = os.path.join(args.export_dir, "bkt_updates.json")
    if not os.path.exists(path):
        sys.exit(f"{path} not found. Run tools/export_firebase_data.py first.")
    with open(path) as f:
        return json.load(f) or {}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    src = parser.add_mutually_exclusive_group()
    src.add_argument("--export-dir", default="firebase_export")
    src.add_argument("--live", action="store_true", help="Read from Firebase.")
    parser.add_argument("--out", default="bkt_trajectories.csv")
    parser.add_argument(
        "--exclude-prefix",
        default="",
        help="Skip user IDs starting with this (e.g. test_).",
    )
    args = parser.parse_args()

    data = load_updates(args)

    rows = []
    for user_id, sessions in (data or {}).items():
        if args.exclude_prefix and user_id.startswith(args.exclude_prefix):
            continue
        if not isinstance(sessions, dict):
            continue
        events = []
        for session_id, pushes in sessions.items():
            if not isinstance(pushes, dict):
                continue
            for _, ev in pushes.items():
                if isinstance(ev, dict) and ev.get("skill"):
                    events.append((session_id, ev))
        # One timeline per skill, ordered by wall-clock time. Sessions are
        # interleaved deliberately: a shared concept:: skill is practiced in
        # more than one video.
        events.sort(key=lambda se: se[1].get("timestamp") or "")
        seq_by_skill = {}
        for session_id, ev in events:
            skill = ev["skill"]
            seq_by_skill[skill] = seq_by_skill.get(skill, 0) + 1
            rows.append(
                {
                    "user_id": user_id,
                    "skill": skill,
                    "seq": seq_by_skill[skill],
                    "timestamp": ev.get("timestamp"),
                    "session_id": session_id,
                    "video_id": ev.get("video_id"),
                    "segment_index": ev.get("segment_index"),
                    "interaction_type": ev.get("interaction_type"),
                    "is_correct": ev.get("is_correct"),
                    "old_mastery": ev.get("old_mastery"),
                    "new_mastery": ev.get("new_mastery"),
                    "mastery_change": ev.get("mastery_change"),
                    "n_observations": ev.get("n_observations"),
                    "rubric_mean": ev.get("rubric_mean"),
                    "slip": ev.get("slip"),
                    "guess": ev.get("guess"),
                    "transit": ev.get("transit"),
                }
            )

    rows.sort(key=lambda r: (r["user_id"], r["skill"], r["seq"]))
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)

    users = {r["user_id"] for r in rows}
    skills = {r["skill"] for r in rows}
    # Transfer only counts within ONE participant: the same concept practiced
    # by two different people in two videos is not cross-video transfer.
    videos_per = {}
    for r in rows:
        videos_per.setdefault((r["user_id"], r["skill"]), set()).add(r["video_id"])
    cross = {
        (u, s)
        for (u, s), vids in videos_per.items()
        if s.startswith("concept::") and len(vids) > 1
    }
    print(f"Wrote {args.out}: {len(rows)} observations")
    print(f"  {len(users)} participant(s), {len(skills)} distinct skill(s)")
    print(f"  {len(cross)} participant-skill pair(s) practiced across >1 video")


if __name__ == "__main__":
    main()
