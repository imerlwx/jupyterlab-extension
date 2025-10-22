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
        cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
        database_url = os.environ.get('FIREBASE_DATABASE_URL')

        if not cred_path or not database_url:
            print("⚠️  Firebase credentials not configured. Logging to Firebase disabled.")
            print("   Set FIREBASE_CREDENTIALS_PATH and FIREBASE_DATABASE_URL environment variables.")
            _firebase_enabled = False
            return False

        if not os.path.exists(cred_path):
            print(f"⚠️  Firebase credentials file not found: {cred_path}")
            _firebase_enabled = False
            return False

        # Initialize Firebase app
        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': database_url
        })

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


def get_timestamp() -> str:
    """Get current timestamp in ISO 8601 format"""
    return datetime.utcnow().isoformat() + 'Z'


def log_chat_message(
    user_id: str,
    session_id: str,
    message_type: str,
    content: str,
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
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
        ref = db.reference(f'chat_logs/{user_id}/{session_id}')

        message_data = {
            'timestamp': get_timestamp(),
            'type': message_type,
            'content': content,
            'video_id': video_id,
            'segment_index': segment_index,
            'metadata': metadata or {}
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
    segment_index: Optional[int] = None
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
        ref = db.reference(f'code_executions/{user_id}/{session_id}')

        execution_data = {
            'timestamp': get_timestamp(),
            'code': code,
            'cell_type': cell_type,
            'status': execution_status,
            'output': output,
            'error': error,
            'execution_time': execution_time,
            'video_id': video_id,
            'segment_index': segment_index
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
    user_response: Optional[str] = None
):
    """
    Log BKT (Bayesian Knowledge Tracing) model update to Firebase

    Args:
        user_id: Unique identifier for the user
        session_id: Unique identifier for the session
        skill: The skill being assessed
        old_mastery: Probability of mastery before update (0-1)
        new_mastery: Probability of mastery after update (0-1)
        is_correct: Whether the user answered correctly
        interaction_type: 'fill_in_blanks' or 'multiple_choice'
        video_id: YouTube video ID (optional)
        segment_index: Current segment index (optional)
        user_response: The user's actual response (optional)
    """
    if not _firebase_enabled:
        return

    try:
        # Log to BKT updates timeline
        ref = db.reference(f'bkt_updates/{user_id}/{session_id}')

        update_data = {
            'timestamp': get_timestamp(),
            'skill': skill,
            'old_mastery': old_mastery,
            'new_mastery': new_mastery,
            'is_correct': is_correct,
            'interaction_type': interaction_type,
            'video_id': video_id,
            'segment_index': segment_index,
            'user_response': user_response,
            'mastery_change': new_mastery - old_mastery
        }

        ref.push(update_data)

        # Also update the current BKT state
        state_ref = db.reference(f'bkt_state/{user_id}')
        state_ref.child(skill).set({
            'mastery': new_mastery,
            'last_updated': get_timestamp(),
            'session_id': session_id
        })

    except Exception as e:
        print(f"❌ Failed to log BKT update: {str(e)}")


def log_interaction(
    user_id: str,
    session_id: str,
    interaction_type: str,
    interaction_data: Dict[str, Any],
    video_id: Optional[str] = None,
    segment_index: Optional[int] = None
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
        ref = db.reference(f'interactions/{user_id}/{session_id}')

        event_data = {
            'timestamp': get_timestamp(),
            'type': interaction_type,
            'data': interaction_data,
            'video_id': video_id,
            'segment_index': segment_index
        }

        ref.push(event_data)

    except Exception as e:
        print(f"❌ Failed to log interaction: {str(e)}")


def log_session_start(
    user_id: str,
    session_id: str,
    user_metadata: Optional[Dict[str, Any]] = None
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
        ref = db.reference(f'sessions/{user_id}/{session_id}')

        session_data = {
            'start_time': get_timestamp(),
            'status': 'active',
            'user_metadata': user_metadata or {}
        }

        ref.set(session_data)

    except Exception as e:
        print(f"❌ Failed to log session start: {str(e)}")


def log_session_end(
    user_id: str,
    session_id: str,
    session_summary: Optional[Dict[str, Any]] = None
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
        ref = db.reference(f'sessions/{user_id}/{session_id}')

        ref.update({
            'end_time': get_timestamp(),
            'status': 'completed',
            'summary': session_summary or {}
        })

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
        ref = db.reference(f'bkt_state/{user_id}')
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
    context: Optional[Dict[str, Any]] = None
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
        ref = db.reference(f'teaching_methods/{user_id}/{session_id}')

        method_data = {
            'timestamp': get_timestamp(),
            'method': method,
            'video_id': video_id,
            'segment_index': segment_index,
            'context': context or {}
        }

        ref.push(method_data)

    except Exception as e:
        print(f"❌ Failed to log teaching method: {str(e)}")


# Initialize Firebase when module is imported
initialize_firebase()
