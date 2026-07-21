"""Export only THIS study's data from the shared Firebase Realtime Database.

The lab's RTDB (gse-aixdesign-lab-default-rtdb) is shared across many
projects, each of which owns its own top-level nodes. This study (Tutorly)
writes to exactly the eight nodes listed in PROJECT_NODES below — every
db.reference(...) path in jlab_ext_example/firebase_logger.py starts with one
of these. This script downloads just those nodes into local JSON files so you
can analyze your data without touching anyone else's.

Usage:
    FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccount.json \
    FIREBASE_DATABASE_URL=https://gse-aixdesign-lab-default-rtdb.firebaseio.com/ \
    python tools/export_firebase_data.py --out firebase_export

    # Optional: keep only specific participant IDs (repeatable / comma-list).
    #   --users P001,P002   or   --user-prefix TUTORLY-
"""

import argparse
import json
import os
import sys

# The eight top-level nodes this project owns. Keep in sync with the
# db.reference(...) calls in jlab_ext_example/firebase_logger.py.
PROJECT_NODES = [
    "condition_assignment",  # study-wide: {counts, assignments}
    "sessions",              # sessions/{user_id}/{session_id}
    "chat_logs",             # chat_logs/{user_id}/{session_id}
    "code_executions",       # code_executions/{user_id}/{session_id}
    "interactions",          # interactions/{user_id}/{session_id}
    "bkt_updates",           # bkt_updates/{user_id}/{session_id}
    "bkt_state",             # bkt_state/{user_id}
    "teaching_methods",      # teaching_methods/{user_id}/{session_id}
]

# Nodes keyed by user_id at the top level (used only when --users/--user-prefix
# filtering is requested). condition_assignment is study-wide, not per-user, so
# it is exported whole and its assignments/counts are filtered separately.
PER_USER_NODES = {
    "sessions",
    "chat_logs",
    "code_executions",
    "interactions",
    "bkt_updates",
    "bkt_state",
    "teaching_methods",
}


def _match(user_id, users, prefix):
    if users and user_id in users:
        return True
    if prefix and user_id.startswith(prefix):
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default="firebase_export",
        help="Output directory for the per-node JSON files (default: firebase_export).",
    )
    parser.add_argument(
        "--users",
        default="",
        help="Comma-separated participant IDs to keep (default: keep everyone).",
    )
    parser.add_argument(
        "--user-prefix",
        default="",
        help="Keep only participant IDs starting with this prefix "
        "(e.g. a Prolific/pilot tag). Combined with --users by OR.",
    )
    parser.add_argument(
        "--combined",
        action="store_true",
        help="Also write a single combined tutorly_export.json with all nodes.",
    )
    args = parser.parse_args()

    try:
        import firebase_admin
        from firebase_admin import credentials, db
    except ImportError:
        sys.exit("firebase-admin not installed. Run `pip install firebase-admin` first.")

    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    database_url = os.environ.get("FIREBASE_DATABASE_URL")
    if not cred_path or not database_url:
        sys.exit(
            "Set FIREBASE_CREDENTIALS_PATH and FIREBASE_DATABASE_URL "
            "environment variables (same ones the server uses)."
        )

    firebase_admin.initialize_app(
        credentials.Certificate(cred_path), {"databaseURL": database_url}
    )

    users = {u.strip() for u in args.users.split(",") if u.strip()}
    prefix = args.user_prefix.strip()
    filtering = bool(users or prefix)

    os.makedirs(args.out, exist_ok=True)
    combined = {}

    for node in PROJECT_NODES:
        data = db.reference(node).get()

        if data and filtering and node in PER_USER_NODES and isinstance(data, dict):
            data = {uid: v for uid, v in data.items() if _match(uid, users, prefix)}

        if data and filtering and node == "condition_assignment" and isinstance(data, dict):
            # Study-wide node: filter its assignments map (counts are left as-is
            # since they are aggregate, not per-user).
            assignments = data.get("assignments", {})
            data = {
                **data,
                "assignments": {
                    uid: v
                    for uid, v in assignments.items()
                    if _match(uid, users, prefix)
                },
            }

        n = len(data) if isinstance(data, (dict, list)) else (0 if data is None else 1)
        print(f"  {node}: {n} record(s)")

        with open(os.path.join(args.out, f"{node}.json"), "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        combined[node] = data

    if args.combined:
        with open(os.path.join(args.out, "tutorly_export.json"), "w") as f:
            json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(PROJECT_NODES)} node file(s) to {args.out}/")


if __name__ == "__main__":
    main()
