"""
Firebase Logger Module

This module provides comprehensive logging to Firebase Realtime Database for:
- Chat messages (user questions and AI responses)
- Code execution events
- Student model (BKT) evolution
- User interactions and session data

All data is logged with timestamps and user IDs for analytics.
"""

import os
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
import firebase_admin
from firebase_admin import credentials, db

# Global Firebase app instance
_firebase_app = None
_firebase_enabled = False


def initialize_firebase():
    """
    Initialize Firebase Admin SDK

    Requires environment variable:
    - FIREBASE_CREDENTIALS_PATH: Path to Firebase service account JSON file
    - FIREBASE_DATABASE_URL: Firebase Realtime Database URL

    Returns:
        bool: True if successfully initialized, False otherwise
    """
    global _firebase_app, _firebase_enabled

    if _firebase_app is not None:
        return True

    try:
        cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
        database_url = os.environ.get("FIREBASE_DATABASE_URL")

        if not cred_path or not database_url:
            print(
                "⚠️  Firebase credentials not configured. Logging to Firebase disabled."
            )
            print(
                "   Set FIREBASE_CREDENTIALS_PATH and FIREBASE_DATABASE_URL environment variables."
            )
            _firebase_enabled = False
            return False

        if not os.path.exists(cred_path):
            print(f"⚠️  Firebase credentials file not found: {cred_path}")
            _firebase_enabled = False
            return False

        # Initialize Firebase app
        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(
            cred, {"databaseURL": database_url}
        )

        _firebase_enabled = True
        print("✅ Firebase initialized successfully")
        return True

    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {str(e)}")
        _firebase_enabled = False
        return False


def is_firebase_enabled() -> bool:
    """Check if Firebase is properly configured and enabled"""
    return _firebase_enabled


def assign_condition_balanced(user_id: str, conditions: list):
    """Atomically assign a study condition with permuted-block randomization.

    Uses a single Firebase Realtime Database transaction on
    `/condition_assignment` to keep all participants' counts in one shared,
    concurrency-safe place (each participant otherwise has a separate
    cache.db, so there's no shared SQLite to count against).

    Algorithm — equivalent to permuted-block randomization with block size
    = len(conditions):
      * If the user is already assigned, return that (idempotent / stable).
      * Otherwise assign to the condition with the FEWEST participants so
        far, breaking ties at random. This keeps every cell within 1 of the
        others at all times and exactly equal at each multiple of the block
        size — and because the first participant in each block picks at
        random among the empty cells, each block is a random permutation.

    Returns the assigned condition string, or None if Firebase is
    unavailable (caller should fall back to hash-based assignment).
    """
    if not _firebase_enabled:
        return None

    import random

    def _transaction(current):
        data = current or {}
        assignments = data.get("assignments", {})
        if user_id in assignments:
            # Already assigned — no-op, keep data unchanged.
            return data
        counts = data.get("counts", {})
        # Ensure every condition has a count entry.
        for cond in conditions:
            counts.setdefault(cond, 0)
        min_count = min(counts[cond] for cond in conditions)
        candidates = [cond for cond in conditions if counts[cond] == min_count]
        chosen = random.choice(candidates)
        counts[chosen] = counts[chosen] + 1
        assignments[user_id] = chosen
        data["counts"] = counts
        data["assignments"] = assignments
        return data

    try:
        ref = db.reference("condition_assignment")
        result = ref.transaction(_transaction)
        # transaction() returns the committed snapshot value.
        if isinstance(result, dict):
            assigned = result.get("assignments", {}).get(user_id)
        else:
            assigned = None
        if assigned is None:
            # Fall back to a fresh read in case the SDK returned a
            # non-dict snapshot wrapper.
            assigned = (
                ref.child("assignments").child(user_id).get()
            )
        return assigned
    except Exception as e:
        print(f"❌ Balanced condition assignment failed: {e}")
        return None


def get_timestamp() -> str:
    """Get current timestamp in ISO 8601 format"""
    return datetime.utcnow().isoformat() + "Z"


def log_chat_message(
    user_id: str,
    session_id: str,
    message_type: str,
    content: str,
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """
    Log a chat message to Firebase

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        message_type: 'user_question' or 'ai_response'
        content: The message content
        video_id: YouTube video ID (optional)
        segment_index: Current segment index (optional)
        metadata: Additional metadata (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"chat_logs/{user_id}/{session_id}")

        message_data = {
            "timestamp": get_timestamp(),
            "type": message_type,
            "content": content,
            "video_id": video_id,
            "segment_index": segment_index,
            "metadata": metadata or {},
        }

        ref.push(message_data)

    except Exception as e:
        print(f"❌ Failed to log chat message: {str(e)}")


def log_code_execution(
    user_id: str,
    session_id: str,
    code: str,
    cell_type: str,
    execution_status: str,
    output: Optional[str] = None,
    error: Optional[str] = None,
    execution_time: Optional[float] = None,
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
):
    """
    Log code execution event to Firebase

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        code: Code that was executed
        cell_type: 'code' or 'markdown'
        execution_status: 'success' or 'error'
        output: Execution output (optional)
        error: Error message if execution failed (optional)
        execution_time: Execution time in seconds (optional)
        video_id: YouTube video ID (optional)
        segment_index: Current segment index (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"code_executions/{user_id}/{session_id}")

        execution_data = {
            "timestamp": get_timestamp(),
            "code": code,
            "cell_type": cell_type,
            "status": execution_status,
            "output": output,
            "error": error,
            "execution_time": execution_time,
            "video_id": video_id,
            "segment_index": segment_index,
        }

        ref.push(execution_data)

    except Exception as e:
        print(f"❌ Failed to log code execution: {str(e)}")


def log_bkt_update(
    user_id: str,
    session_id: str,
    skill: str,
    old_mastery: float,
    new_mastery: float,
    is_correct: bool,
    interaction_type: str,
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
    user_response: Optional[str] = None,
    n_observations: Optional[int] = None,
    rubric: Optional[Dict[str, float]] = None,
    rubric_mean: Optional[float] = None,
    slip: Optional[float] = None,
    guess: Optional[float] = None,
    transit: Optional[float] = None,
):
    """
    Log BKT (Bayesian Knowledge Tracing) model update to Firebase.

    Every update is appended to a per-session timeline AND used to overwrite
    the current per-skill snapshot. The optional kwargs let callers attach
    additional audit detail (rubric scores for articulation, evidence count,
    interaction-specific BKT parameters used) so the Firebase record is a
    full source of truth for post-study analysis.

    Args:
        user_id, session_id, skill: identifiers.
        old_mastery, new_mastery, is_correct, interaction_type: BKT core fields.
        video_id, segment_index, user_response: context.
        n_observations: total practice events on this skill *after* the update.
        rubric: {notices_pattern, plausible_cause, proposes_check} when the
            update came from a structured-text articulation; else None.
        rubric_mean: mean of the rubric dimensions (the value thresholded to
            produce is_correct).
        slip, guess, transit: the BKT noise parameters used for this update.
    """
    if not _firebase_enabled:
        return

    try:
        # Log to BKT updates timeline
        ref = db.reference(f"bkt_updates/{user_id}/{session_id}")

        update_data = {
            "timestamp": get_timestamp(),
            "skill": skill,
            "old_mastery": old_mastery,
            "new_mastery": new_mastery,
            "is_correct": is_correct,
            "interaction_type": interaction_type,
            "video_id": video_id,
            "segment_index": segment_index,
            "user_response": user_response,
            "mastery_change": new_mastery - old_mastery,
        }
        if n_observations is not None:
            update_data["n_observations"] = n_observations
        if rubric is not None:
            update_data["rubric"] = rubric
        if rubric_mean is not None:
            update_data["rubric_mean"] = rubric_mean
        if slip is not None:
            update_data["slip"] = slip
        if guess is not None:
            update_data["guess"] = guess
        if transit is not None:
            update_data["transit"] = transit

        ref.push(update_data)

        # Also update the current BKT state. Include n_observations and the
        # most recent rubric so a single read of `bkt_state/{uid}/{skill}`
        # gives an analyst the full live picture.
        state_payload = {
            "mastery": new_mastery,
            "last_updated": get_timestamp(),
            "session_id": session_id,
            "last_interaction": interaction_type,
        }
        if n_observations is not None:
            state_payload["n_observations"] = n_observations
        if rubric is not None:
            state_payload["last_rubric"] = rubric
            state_payload["last_rubric_mean"] = rubric_mean
        state_ref = db.reference(f"bkt_state/{user_id}")
        state_ref.child(skill).set(state_payload)

    except Exception as e:
        print(f"❌ Failed to log BKT update: {str(e)}")


def log_interaction(
    user_id: str,
    session_id: str,
    interaction_type: str,
    interaction_data: Dict[str, Any],
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
):
    """
    Log a general user interaction to Firebase

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        interaction_type: Type of interaction (e.g., 'fill_in_blanks', 'multiple_choice', 'navigation')
        interaction_data: Data specific to the interaction
        video_id: YouTube video ID (optional)
        segment_index: Current segment index (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"interactions/{user_id}/{session_id}")

        event_data = {
            "timestamp": get_timestamp(),
            "type": interaction_type,
            "data": interaction_data,
            "video_id": video_id,
            "segment_index": segment_index,
        }

        ref.push(event_data)

    except Exception as e:
        print(f"❌ Failed to log interaction: {str(e)}")


def log_session_start(
    user_id: str, session_id: str, user_metadata: Optional[Dict[str, Any]] = None
):
    """
    Log the start of a new user session

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        user_metadata: Additional user metadata (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"sessions/{user_id}/{session_id}")

        session_data = {
            "start_time": get_timestamp(),
            "status": "active",
            "user_metadata": user_metadata or {},
        }

        ref.set(session_data)

    except Exception as e:
        print(f"❌ Failed to log session start: {str(e)}")


def log_session_end(
    user_id: str, session_id: str, session_summary: Optional[Dict[str, Any]] = None
):
    """
    Log the end of a user session

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        session_summary: Summary statistics for the session (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"sessions/{user_id}/{session_id}")

        ref.update(
            {
                "end_time": get_timestamp(),
                "status": "completed",
                "summary": session_summary or {},
            }
        )

    except Exception as e:
        print(f"❌ Failed to log session end: {str(e)}")


def get_user_bkt_state(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve current BKT state for a user from Firebase

    Args:
        user_id: Unique identifier for the user

    Returns:
        Dictionary of skills and their mastery levels, or None if not found
    """
    if not _firebase_enabled:
        return None

    try:
        ref = db.reference(f"bkt_state/{user_id}")
        return ref.get()

    except Exception as e:
        print(f"❌ Failed to retrieve BKT state: {str(e)}")
        return None


def log_teaching_method(
    user_id: str,
    session_id: str,
    method: str,
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
    context: Optional[Dict[str, Any]] = None,
):
    """
    Log which teaching method was used

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        method: Teaching method name (e.g., 'Scaffolding', 'Coaching', 'Articulation', 'Reflection')
        video_id: YouTube video ID (optional)
        segment_index: Current segment index (optional)
        context: Additional context about why this method was chosen (optional)
    """
    if not _firebase_enabled:
        return

    try:
        ref = db.reference(f"teaching_methods/{user_id}/{session_id}")

        method_data = {
            "timestamp": get_timestamp(),
            "method": method,
            "video_id": video_id,
            "segment_index": segment_index,
            "context": context or {},
        }

        ref.push(method_data)

    except Exception as e:
        print(f"❌ Failed to log teaching method: {str(e)}")


# Initialize Firebase when module is imported
initialize_firebase()
