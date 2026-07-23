# handler.py
import os
import re
import ast
import json
import math
import isodate
import hashlib
import datetime
import requests
from google import genai
from google.genai import types as genai_types
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
# from BCEmbedding import RerankerModel
from jlab_ext_example import firebase_logger

# init reranker model
# model = RerankerModel(model_name_or_path="maidalun1020/bce-reranker-base_v1")
# _reranker_model = None
# def _get_reranker():
#     global _reranker_model
#     if _reranker_model is None:
#         _reranker_model = RerankerModel(model_name_or_path="maidalun1020/bce-reranker-base_v1")
#     return _reranker_model

# Absolute path to a data file shipped inside this package. Used so the
# bundled *_code.json files load regardless of the server's working
# directory (the deployed single-user server's CWD is the participant's
# home, not the repo root).
_PACKAGE_DIR = os.path.dirname(os.path.abspath(__file__))


def _package_data_path(filename: str) -> str:
    return os.path.join(_PACKAGE_DIR, filename)


YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
# google-genai's Client picks up GEMINI_API_KEY (or GOOGLE_API_KEY) from the
# environment automatically, but we pass it explicitly so the missing-key
# error path is in our hands.
_gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY is not set. LLM features will not work.")

# All LLM call sites flow through llm_chat() so we have one place to swap
# models, tweak defaults, or add retries.
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash"


def _parse_llm_list(raw: str):
    """Extract a Python/JSON list from LLM output that may contain prose.

    Gemini sometimes prepends preambles like "Here is the list:\\n[ ... ]"
    around the actual literal we want. We slice between the first `[` and
    the last `]`, try Python literal first (handles single-quoted strings
    the existing prompts ask for), and fall back to JSON if that fails.
    Raises ValueError if no list can be found or parsed.
    """
    if raw is None:
        raise ValueError("empty LLM response")
    text = raw.strip()
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"no list literal in response: {text[:200]!r}")
    list_str = text[start : end + 1]
    try:
        return ast.literal_eval(list_str)
    except (ValueError, SyntaxError):
        return json.loads(list_str)


def llm_chat(
    system_prompt: str,
    user_message: str,
    model: str = DEFAULT_GEMINI_MODEL,
    temperature: float = 0.7,
    response_mime_type: str = None,
) -> str:
    """Single-turn Gemini call. Returns the model's text output, stripped.

    `response_mime_type="application/json"` asks Gemini to emit valid JSON;
    pass it for the call sites whose downstream code does `json.loads` so
    we don't get fenced ```json ... ``` blocks.
    """
    if _gemini_client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not set; cannot call the LLM. "
            "Get a key at https://aistudio.google.com/apikey."
        )
    config_kwargs = {
        "system_instruction": system_prompt,
        "temperature": temperature,
    }
    if response_mime_type:
        config_kwargs["response_mime_type"] = response_mime_type
    resp = _gemini_client.models.generate_content(
        model=model,
        contents=user_message,
        config=genai_types.GenerateContentConfig(**config_kwargs),
    )
    text = (resp.text or "").strip()
    # Strip stray ```json fences if the model added them anyway.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text


def _repair_json(text):
    """Best-effort parse of an LLM JSON reply. Returns a dict/list or None.

    Gemini occasionally stops mid-object (hitting the output limit), leaving
    JSON that is complete except for its closing brace. The frontend's
    JSON.parse then fails and the card silently degrades into a raw-JSON chat
    message, so recover here instead.
    """
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except ValueError:
        pass
    start = text.find("{")
    if start == -1:
        return None
    s = text[start:]
    # Trailing prose after the object.
    end = s.rfind("}")
    if end != -1:
        try:
            return json.loads(s[: end + 1])
        except ValueError:
            pass
    # Truncated: walk the text to see whether we merely lost the closers.
    depth = 0
    in_str = False
    esc = False
    last_pair_end = None
    for i, ch in enumerate(s):
        if esc:
            esc = False
            continue
        if ch == "\\":
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch in "{[":
            depth += 1
        elif ch in "}]":
            depth -= 1
        elif ch == "," and depth == 1:
            last_pair_end = i
    if not in_str and depth > 0:
        try:
            return json.loads(s + "}" * depth)
        except ValueError:
            pass
    # Cut back to the last complete key/value pair and close the object.
    if last_pair_end is not None:
        try:
            return json.loads(s[:last_pair_end] + "}")
        except ValueError:
            pass
    return None


def llm_json(system_prompt, user_message, required_keys=(), model=None, retries=1):
    """Call the LLM and return parsed JSON, repairing/retrying as needed.

    Returns a dict (possibly missing keys) or None if nothing usable came
    back. Callers render a card from the result, so returning valid JSON
    matters more than returning the first response verbatim.
    """
    kwargs = {"response_mime_type": "application/json"}
    if model:
        kwargs["model"] = model
    for attempt in range(retries + 1):
        raw = llm_chat(
            system_prompt=system_prompt, user_message=user_message, **kwargs
        )
        parsed = _repair_json(raw)
        if isinstance(parsed, dict) and (
            not required_keys or any(k in parsed for k in required_keys)
        ):
            missing = [k for k in required_keys if not parsed.get(k)]
            if missing and attempt < retries:
                print(f"llm_json: missing {missing}; retrying.")
                continue
            return parsed
        if attempt < retries:
            print("llm_json: unparseable response; retrying.")
    return parsed if isinstance(parsed, dict) else None

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY") or YOUTUBE_API_KEY
if not YOUTUBE_API_KEY:
    print("⚠️  YOUTUBE_API_KEY is not set. YouTube API features may not work.")
youtube = (
    build("youtube", "v3", developerKey=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None
)
DATA_URL = "https://api.github.com/repos/rfordatascience/tidytuesday/contents/data/"
CODE_URL = "https://api.github.com/repos/dgrtwo/data-screencasts/contents/"
STUDY_VIDEO_IDS = ["EF4A4OtQprg", "1xsbTs9-a50", "-1x8Kpyndss"]
LEGACY_VIDEO_ID_MAP = {
    "1x8Kpyndss": "-1x8Kpyndss",
}


def normalize_video_id(video_id):
    if not video_id:
        return video_id
    return LEGACY_VIDEO_ID_MAP.get(video_id, video_id)


def normalize_video_id_list(video_ids):
    return [normalize_video_id(video_id) for video_id in video_ids]

# Global state variables. Things that are genuinely per-process (loaded
# once, identical across users) stay as globals: chat_bot, video_type.
# Per-user mutable state — BKT, CUR_SEQ, the in-flight correctness buffers —
# lives in USER_SESSIONS, see get_user_session().
user_id = ""
chat_bot = None
video_type = "Exploratory Data Analysis (EDA)"

# Code blocks are PER VIDEO and must be fetched by video_id, never held in a
# single shared global. (A previous bug loaded code into one `all_code` global
# only when empty, so switching to a second video kept serving the first
# video's code.) get_all_code() caches each video's code separately.
_CODE_FILE_BY_VIDEO = {
    "nx5yhXAQLxw": "college_major_code.json",
    "Kd9BNI6QMmQ": "video_game_code.json",
    "EF4A4OtQprg": "pet_names_code.json",
    "1xsbTs9-a50": "franchise_revenue_code.json",
    "-1x8Kpyndss": "coffee_ratings_code.json",
    "8jazNUpO3lQ": "ml_code.json",
}
_all_code_cache: dict = {}


def get_all_code(video_id: str) -> dict:
    """Return the code-blocks dict for a specific video (cached per video)."""
    if video_id not in _all_code_cache:
        fname = _CODE_FILE_BY_VIDEO.get(video_id)
        if fname:
            with open(_package_data_path(fname), "r") as f:
                _all_code_cache[video_id] = json.load(f)
        else:
            _all_code_cache[video_id] = {}
    return _all_code_cache[video_id]

# T1.5: per-user session state. Each entry holds the state that used to be
# scattered across module globals. Keyed by the user_id sent in each request
# so that two browser tabs / two concurrent requests for the same user can't
# stomp on each other's buffers (and so a future shared-server deployment
# keeps users isolated even within one process).
#
# Per-user fields:
#   bkt_params        : {skill_id: {"probMastery": float, "n_observations": int}}
#   cur_seq           : list of pending teaching moves
#   skill_id_buffer   : skill_id of the last move that set up a practice item
#                       (replaces the old `knowledge_buffer` global)
#   interaction_buffer: which interaction that practice item used; needed at
#                       BKT update time to look up the right slip/guess
#   code_line_buffer  : canonical code line for fill-in-blanks correctness
#   code_line_blanks_buffer: the same line with ___ placeholders, used to
#                            align per-blank correctness at update time
#   correct_answer_buffer: canonical correct choice for multiple-choice
USER_SESSIONS: dict = {}


def get_user_session(uid: str) -> dict:
    """Return (creating if needed) the per-user state dict."""
    if uid not in USER_SESSIONS:
        USER_SESSIONS[uid] = {
            "bkt_params": {},
            "cur_seq": [],
            "skill_id_buffer": "",
            "interaction_buffer": "",
            "code_line_buffer": "",
            "code_line_blanks_buffer": "",
            "correct_answer_buffer": "",
            # Lines already taught in the current segment, so two knowledge
            # items don't drill the student on the same line twice. Reset
            # whenever taught_lines_key changes (see _segment_taught_lines).
            "taught_lines_key": None,
            "taught_lines": set(),
        }
    return USER_SESSIONS[uid]


def _segment_taught_lines(session, video_id, segment_index):
    """Return the set of code-line indices already taught in this segment."""
    key = (video_id, str(segment_index))
    if session.get("taught_lines_key") != key:
        session["taught_lines_key"] = key
        session["taught_lines"] = set()
    return session["taught_lines"]


# T1.2: per-interaction noise parameters. slip/guess/transit are properties of
# the question type, not of the skill, so they live in this lookup rather than
# in per-skill state. probGuess for a 4-option MC is 0.25 (a random click is
# right one in four times); fill-in-blanks gets a much lower guess rate;
# structured-text articulation has effectively zero guess but a higher slip
# because the student may understand it but phrase it poorly.
INTERACTION_PARAMS = {
    "fill-in-blanks":  {"probSlip": 0.10, "probGuess": 0.05, "probTransit": 0.15},
    "multiple-choice": {"probSlip": 0.10, "probGuess": 0.25, "probTransit": 0.10},
    # Structured-text articulation: students who *do* understand may still
    # phrase it poorly (high slip), and a rubric-passing answer is not perfect
    # proof of mastery — the LLM grader is itself noisy and students can echo
    # the right keywords (small but nonzero guess). probGuess > 0 also avoids
    # the BKT degeneracy where a single correct obs pegs posterior to 1.0.
    "structured-text": {"probSlip": 0.25, "probGuess": 0.05, "probTransit": 0.15},
}
DEFAULT_INTERACTION_PARAMS = {
    "probSlip": 0.10,
    "probGuess": 0.10,
    "probTransit": 0.10,
}


def get_interaction_params(interaction: str) -> dict:
    return INTERACTION_PARAMS.get(interaction, DEFAULT_INTERACTION_PARAMS)


# T1.3: lenient code comparison for fill-in-blank correctness. Removes
# comments, collapses whitespace, and tightens spacing around common
# punctuation so that minor stylistic differences (extra spaces, trailing
# commas, "# my note" annotations) don't cause false negatives that would
# unfairly lower the student's mastery.
_COMMENT_RE = re.compile(r"#.*$", re.MULTILINE)
_WHITESPACE_RE = re.compile(r"\s+")
_PUNCT_RE = re.compile(r"\s*([(),;])\s*")


def canonicalize_code(s: str) -> str:
    if not s:
        return ""
    s = _COMMENT_RE.sub("", s)
    s = _WHITESPACE_RE.sub(" ", s)
    s = _PUNCT_RE.sub(r"\1", s)
    return s.strip()


def extract_blank_answers(masked: str, full: str):
    """Pull out what fills each `___` in `masked`, given the realized `full`.

    Example:
        masked = "___(___ %>% top_n(16, total_revenue), by = \"___\")"
        full   = "semi_join(franchises %>% top_n(16, total_revenue), by = \"franchise\")"
        → ["semi_join", "franchises", "franchise"]

    Returns None if alignment fails (e.g., student modified the non-blank
    skeleton), in which case the caller should fall back to all-or-nothing
    comparison so we don't silently misattribute correctness.
    """
    if not masked or "___" not in masked:
        return None
    masked_c = canonicalize_code(masked)
    full_c = canonicalize_code(full)
    parts = masked_c.split("___")  # N+1 literal chunks around N blanks
    answers: list = []
    pos = 0
    for i, chunk in enumerate(parts[:-1]):
        # Locate this literal chunk in `full`.
        start = full_c.find(chunk, pos)
        if start == -1:
            return None
        pos = start + len(chunk)
        next_chunk = parts[i + 1]
        if next_chunk == "":
            # The blank runs to the end of the string.
            answers.append(full_c[pos:])
            pos = len(full_c)
        else:
            next_start = full_c.find(next_chunk, pos)
            if next_start == -1:
                return None
            answers.append(full_c[pos:next_start])
            pos = next_start
    return answers


# T1.1 + cross-video transfer: deterministic skill IDs.
#
# Default: skill_id = "{video_id}::{segment_index}::{knowledge_index}". One
# skill per knowledge item, no sharing across videos.
#
# With concept_tags.json present (see tools/draft_concept_tags.py), a knowledge
# item can be mapped to an EDA-grounded concept_id like "filter_to_meaningful_subset".
# All knowledge items mapped to the same concept_id share one BKT mastery curve,
# which is how mastery transfers across the three study videos.
#
# Checked in order; the first file that exists wins. The bundled package copy
# is the default, so tags ship with the extension and deploy automatically on
# update — no manual copying into each participant's home directory (getting
# that wrong silently degrades every skill ID back to the position-based
# fallback, which is easy to miss). The /etc and CWD paths are overrides for
# patching mid-pilot / local development. Hot-reloaded on every lookup.
_CONCEPT_TAGS_PATHS = [
    "/etc/tutorly/concept_tags.json",
    "concept_tags.json",
    _package_data_path("concept_tags.json"),
]
_concept_tags_cache: dict = {}
_concept_tags_key = None  # (path, mtime) of the currently loaded file


def _load_concept_tags() -> dict:
    """Load concept_tags.json from disk, with hot-reload via mtime check."""
    global _concept_tags_cache, _concept_tags_key
    path = mtime = None
    for candidate in _CONCEPT_TAGS_PATHS:
        try:
            mtime = os.path.getmtime(candidate)
            path = candidate
            break
        except OSError:
            continue
    if path is None:
        # No tag file anywhere — no cross-video transfer, just fall back to
        # position-based skill IDs. Not an error.
        _concept_tags_cache = {}
        _concept_tags_key = None
        return _concept_tags_cache
    if (path, mtime) != _concept_tags_key:
        try:
            with open(path) as f:
                data = json.load(f)
            # Accept either {"tags": {...}, "vocabulary": [...]} or a plain
            # {video: {seg: {ki: concept}}} layout. Normalize to the tags map.
            if isinstance(data, dict) and "tags" in data:
                _concept_tags_cache = data["tags"] or {}
            else:
                _concept_tags_cache = data or {}
            _concept_tags_key = (path, mtime)
            n = sum(len(s) for v in _concept_tags_cache.values() for s in v.values())
            print(f"Loaded concept tags from {path} ({n} tags)")
        except (OSError, ValueError) as exc:
            print(f"Warning: could not read {path}: {exc}")
            _concept_tags_cache = {}
            _concept_tags_key = None
    return _concept_tags_cache


def make_skill_id(video_id: str, segment_index, knowledge_index: int) -> str:
    tags = _load_concept_tags()
    concept = (
        tags.get(str(video_id), {})
        .get(str(segment_index), {})
        .get(str(knowledge_index))
    )
    if concept:
        return f"concept::{concept}"
    return f"{video_id}::{segment_index}::{knowledge_index}"


# T2.1: rubric-score a student's structured-text articulation so we can
# feed open-ended answers into BKT. Three independent dimensions matched to
# the prompt slots the system asks for (notice / cause / check). Each is
# rated 0–1; the caller averages and binarizes for a single BKT observation
# (a more diagnostic per-dimension scoring with separate skill tags is
# possible later but requires authoring those skill tags first).
_ARTICULATION_RUBRIC_PROMPT = (
    "You are scoring a student's open-ended written articulation about a data "
    "analysis concept. Rate the answer on three independent dimensions, each "
    "in [0, 1]. Be lenient with phrasing and strict only about substance.\n"
    "  - notices_pattern: does the student correctly identify what's happening "
    "in the data or chart?\n"
    "  - plausible_cause: does the student offer a sensible explanation or "
    "hypothesis for the pattern?\n"
    "  - proposes_check: does the student suggest a way to verify, refute, or "
    "further investigate?\n"
    "If a dimension is not addressed at all in the answer, score it 0.\n"
    "Respond with JSON only, no ```json``` fences:\n"
    '  {"notices_pattern": <0-1>, "plausible_cause": <0-1>, "proposes_check": <0-1>}'
)


def plan_methods_for_knowledge(
    knowledge: str,
    mastery: float,
    n_observations: int,
    video_content_type: str,
    is_last_in_segment: bool,
) -> list:
    """Pick the CA methods to teach this knowledge item.

    Note: this does NOT special-case declarative knowledge. Modeling is
    applied exactly once per segment — to the first knowledge item — by
    plan_methods(), regardless of whether items are declarative or
    procedural. (Previously every declarative item was forced to Modeling,
    which produced one expert-reading card per declarative fact — e.g. five
    Modeling cards in a concept segment.)
    """
    # Very-high mastery → Exploration: the student has repeatedly demonstrated
    # the skill, so move them past assessment to independent application (pose
    # a novel task / open analytical question). Requires BOTH high mastery and
    # enough evidence (n_obs), so we don't jump to open-ended work on a lucky
    # early streak. plan_methods() caps this to one Exploration per segment.
    EXPLORATION_MASTERY = 0.9
    EXPLORATION_MIN_OBS = 3

    if video_content_type == "programming":
        # Programming tier table (single method per knowledge, checked in
        # this priority order — the first matching tier wins):
        # 1. Declarative knowledge string                      → [Modeling]
        # 2. mastery < 0.3 AND n_obs < 1                       → [Scaffolding]
        # 3. 0.3 ≤ mastery < 0.7 OR n_obs < 3                  → [Coaching]
        # 4. mastery ≥ 0.9 AND n_obs ≥ 3 (very high)           → [Exploration]
        # 5. mastery ≥ 0.7 OR (n_obs ≥ 3 AND mastery ≥ 0.3)    → [Articulation]
        # 6. mastery < 0.3 AND n_obs ≥ 3 (chronic-fail)        → [Scaffolding, Coaching]
        # Last knowledge item also gets a trailing Reflection (show-code
        # gestalt wrap-up) — EXCEPT Exploration, where the student works a
        # novel task on their own, so the reference code isn't shown.
        # Programming Articulation is an MC with its own built-in reveal, so
        # it doesn't need a paired Reflection.
        #
        # Once a Scaffolding turn has been consumed, ChatHandler bumps n_obs
        # to 1, See the Scaffolding-consumption hook in ChatHandler.
        if mastery < 0.3 and n_observations < 1:
            methods = ["Scaffolding"]
        elif (0.3 <= mastery < 0.7) or n_observations < 3:
            methods = ["Coaching"]
        elif mastery >= EXPLORATION_MASTERY and n_observations >= EXPLORATION_MIN_OBS:
            methods = ["Exploration"]
        elif mastery >= 0.7 or (n_observations >= 3 and mastery >= 0.3):
            methods = ["Articulation"]
        else:
            # Chronic-fail fallback: mastery < 0.3 AND n_obs >= 3 — student
            # has practiced repeatedly but mastery hasn't moved. Pair
            # Scaffolding (re-explain the concept) with Coaching (another
            # practice attempt so mastery can actually change). Falling
            # back to Scaffolding alone would put them right back into the
            # same dead-end the n_obs bump was meant to fix.
            methods = ["Scaffolding", "Coaching"]
        # Trailing show-code Reflection for the segment's last item, but not
        # after Exploration (open task — showing the answer undercuts it).
        if (
            is_last_in_segment
            and methods[-1] != "Reflection"
            and methods[-1] != "Exploration"
        ):
            methods.append("Reflection")
    else:
        # Concept tier table. Scaffolding in concept_action is multiple-
        # choice, which already triggers a BKT update, so n_obs naturally
        # bumps and we don't need the manual increment from ChatHandler.
        # Articulation here is structured-text and Reflection is
        # compare-with-expert, which only makes sense paired.
        # 1. Declarative knowledge string                → [Modeling]
        # 2. n_obs == 0  OR  mastery < 0.3               → [Scaffolding]
        # 3. 0.3 ≤ mastery < 0.5  OR  n_obs < 2          → [Coaching]
        # 4. 0.5 ≤ mastery < 0.7                         → [Coaching, Articulation]
        # 5. mastery ≥ 0.9 AND n_obs ≥ 3 (very high)     → [Exploration]
        # 6. mastery ≥ 0.7                               → [Articulation]
        # Any plan ending in Articulation automatically appends Reflection
        # (so the student always gets feedback on open-text answers).
        if mastery >= EXPLORATION_MASTERY and n_observations >= EXPLORATION_MIN_OBS:
            methods = ["Exploration"]
        elif mastery > 0.7 or (n_observations >= 3 and mastery >= 0.3):
            methods = ["Articulation"]
        elif mastery < 0.3 or n_observations < 1:
            methods = ["Scaffolding"]
        else:
            methods = ["Coaching"]
        if methods and methods[-1] == "Articulation":
            methods.append("Reflection")

    return methods


def plan_methods(
    knowledge_list: list,
    mastery_levels: list,
    n_observations_list: list,
    video_content_type: str,
) -> list:
    """Deterministic replacement for the LLM-based get_methods().

    Returns a list of {"knowledge": ..., "method": [...]} dicts, the same
    shape get_dsl() expects.

    Modeling is used EXACTLY ONCE per segment, as the opener (the first
    action). The first knowledge item is taught with [Modeling] — for
    programming that's `task-intent` (task / approach / rationale), for
    concept it's `expert-reading` (where to look / what to compare / what to
    notice). Every OTHER knowledge item gets a real teaching method
    (Scaffolding / Coaching / Articulation) chosen by mastery — never
    Modeling, regardless of declarative vs procedural. This avoids the bug
    where concept segments (which have many declarative facts) produced one
    Modeling card per item.
    """
    out = []
    n = len(knowledge_list)
    for i, knowledge in enumerate(knowledge_list):
        if i == 0:
            # Segment opener: a single Modeling card framing the segment.
            method = ["Modeling"]
        else:
            mastery = mastery_levels[i] if i < len(mastery_levels) else 0.1
            n_obs = (
                n_observations_list[i] if i < len(n_observations_list) else 0
            )
            method = plan_methods_for_knowledge(
                knowledge=knowledge,
                mastery=mastery,
                n_observations=n_obs,
                video_content_type=video_content_type,
                is_last_in_segment=(i == n - 1),
            )
        out.append({"knowledge": knowledge, "method": method})

    # Cap Exploration at one per segment: it poses an open novel task the
    # student must respond to, so several in a row is a heavy, repetitive ask.
    # Keep the first Exploration; downgrade any later ones to Articulation (the
    # next move down), pairing a Reflection for concept so the open answer
    # still gets feedback.
    seen_exploration = False
    for entry in out:
        if entry["method"] == ["Exploration"]:
            if seen_exploration:
                if video_content_type == "programming":
                    entry["method"] = ["Articulation"]
                else:
                    entry["method"] = ["Articulation", "Reflection"]
            else:
                seen_exploration = True

    return out


def score_articulation(
    articulation_answer: str,
    knowledge: str,
    model: str = DEFAULT_GEMINI_MODEL,
) -> dict:
    """Score a structured-text articulation answer against a 3-dim rubric.

    Returns {notices_pattern, plausible_cause, proposes_check} with float
    values in [0, 1], or None if scoring failed (LLM error, malformed JSON,
    empty answer). Callers should treat None as "no observation made."
    """
    if not articulation_answer or not articulation_answer.strip():
        return None
    if not GEMINI_API_KEY:
        return None
    user_payload = (
        f"Knowledge the student is articulating about:\n{knowledge}\n\n"
        f"Student's answer:\n{articulation_answer}"
    )
    try:
        raw = llm_chat(
            system_prompt=_ARTICULATION_RUBRIC_PROMPT,
            user_message=user_payload,
            model=model,
            temperature=0,
            response_mime_type="application/json",
        )
        scores = json.loads(raw)
    except Exception as exc:
        print(f"Warning: articulation scoring failed: {exc}")
        return None

    def _clip(v):
        try:
            return max(0.0, min(1.0, float(v)))
        except (TypeError, ValueError):
            return 0.0

    return {
        "notices_pattern": _clip(scores.get("notices_pattern")),
        "plausible_cause": _clip(scores.get("plausible_cause")),
        "proposes_check": _clip(scores.get("proposes_check")),
    }


prog_action = {
    "Modeling": [
        {
            "action": "Open the segment by stating the task intention and the rationale for the chosen approach, using {interaction}",
            "interaction": "task-intent",
            "prompt": (
                "Given the declarative knowledge from this segment: {knowledge}\n"
                "This is the FIRST teaching message of a programming "
                "segment. Frame the segment by stating what we're going to "
                "build and why we choose this particular approach. The "
                "video shows the code but doesn't explicitly motivate why "
                "the chart type / functions were chosen — make that "
                "rationale explicit. Respond as JSON without ```json``` "
                "fences with exactly these three fields, each ONE short "
                "sentence:\n"
                '  {"task_goal": "what this segment is trying to '
                'build or answer (the analytical question or visualization '
                'goal)", '
                '"approach": "the chart type / dplyr verbs / function '
                'chain chosen to achieve it", '
                '"rationale": "why this approach is well-suited to the '
                'task (what makes the chosen chart/functions appropriate)"}'
            ),
            "parameters": ["knowledge"],
            "need-response": False,
        }
    ],
    "Scaffolding": [
        {
            "action": "Demonstrate the current task and provide explanations of the concepts underlying the current step of the task using {interaction}",
            "interaction": "annotated-code",
            "prompt": "[Use one sentence to explain the {knowledge} as it applies to the corresponding {code-line}, covering what effect we want to achieve, why we do it, and what function we use]",
            "parameters": ["knowledge", "code-line"],
            "need-response": False,
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
            "action": "Use {interaction} to let the student predict and articulate their reasoning about a specific code line",
            "interaction": "multiple-choice",
            "prompt": "Propose a multiple-choice question (with exactly four plausible options, only one correct) that asks the student to predict the rationale or behavior tied to {knowledge}, focusing on why this code choice is made.",
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
            "need-response": False,
        }
    ],
    "Exploration": [
        {
            "action": "Encourage the student to independently apply the {knowledge} to a novel task using {interaction}",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to pose a related but new task that requires the student to adapt the {knowledge} to a different context, such as applying the same function to a different column or dataset][Tell the student to try writing the code in the notebook on their own, and to reply here when they have finished so we can move on]",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
}


concept_action = {
    "Modeling": [
        {
            "action": "Expose the cognitive interpretation process the video tutor uses to reach {knowledge}, using {interaction}",
            "interaction": "expert-reading",
            "prompt": (
                "Given the declarative knowledge from this segment: {knowledge}\n"
                "The video tutor shows the chart and states the insight but "
                "doesn't narrate the gaze path or comparison they make to "
                "get there. Make their hidden interpretive process explicit "
                "so the student learns the META-skill of how the expert "
                "reads a chart. Respond as JSON without ```json``` fences "
                "with exactly these three fields, each ONE short sentence:\n"
                '  {"where_to_look": "the specific feature on the chart '
                'the expert focuses on (e.g., a bar, a stack segment, an '
                'axis label)", '
                '"what_to_compare": "the comparison or pattern the expert '
                'mentally performs across the chart", '
                '"what_to_notice": "the conclusion the student should '
                'draw from that comparison (i.e., the insight stated by '
                'the knowledge)"}'
            ),
            "parameters": ["knowledge"],
            "need-response": False,
        }
    ],
    "Scaffolding": [
        {
            "action": "Provide a small guided-question step through {interaction} that walks the student toward understanding {knowledge}",
            "interaction": "multiple-choice",
            "prompt": "Propose a short, easy multiple-choice comprehension question (4 options, one correct) that focuses the student on a single observable feature of the chart relevant to {knowledge}. Keep it light — this is a guided step, not a deep test.",
            "parameters": ["knowledge"],
            "need-response": True,
        }
    ],
    "Articulation": [
        {
            "action": "Ask the student one focused open question to articulate their reasoning about {knowledge}, using {interaction}",
            "interaction": "structured-text",
            "prompt": (
                "Design a structured-text writing prompt that asks the "
                "student ONE focused open question about {knowledge}. "
                "Use exactly one slot — the textarea label should be a "
                "short noun phrase that, together with the intro, reads "
                "coherently as a single thinking task. Keep it light "
                "enough that a one- or two-sentence answer feels natural. "
                "Respond as JSON without ```json``` fences with this exact "
                "shape: {\"intro\": \"the question to think about, in one "
                "short sentence\", \"slots\": [\"<one specific slot label>\"]} "
                "Example shape (do not copy verbatim): {\"intro\": \"Why "
                "might Marvel Universe stand out from the other "
                "franchises?\", \"slots\": [\"Your explanation\"]}"
            ),
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
            "action": "Show the student a brief comparison of their answer with an expert interpretation using {interaction}",
            "interaction": "compare-with-expert",
            "prompt": (
                "Given the student's answer: {student-answer}\n"
                "Produce a brief comparison with an expert interpretation "
                "of {knowledge}. Respond as JSON without ```json``` fences:\n"
                "{\"expertAnswer\": \"one or two sentences giving the "
                "expert's interpretation, in the same voice as the "
                "student's answer\", \"feedback\": \"one sentence of "
                "constructive feedback that acknowledges what the student "
                "got right and points to one thing to refine\"}"
            ),
            "parameters": ["student-answer", "knowledge"],
            "need-response": False,
        }
    ],
    "Exploration": [
        {
            "action": "Encourage the student to independently extend their understanding of {knowledge} by forming and investigating their own analytical questions using {interaction}",
            "interaction": "plain-text",
            "prompt": "[Use one sentence to prompt the student to think about how the {knowledge} could apply to a different dataset or lead to a different conclusion][Ask the student to formulate their own question or hypothesis and briefly explain their reasoning]",
            "parameters": ["knowledge"],
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
        global user_id
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
        global chat_bot, video_type

        # Existing video_id logic
        data = self.get_json_body()
        notebook = data["notebook"]
        question = data["question"]
        video_id = data["videoId"]
        # Per-video code blocks (cached per video_id) — never a shared global.
        all_code = get_all_code(video_id)
        segment_index = data["segmentIndex"]
        kernelType = data["kernelType"]
        selected_choice = data["selectedChoice"]
        articulation_answer = data.get("articulationAnswer", "")
        user_id_req = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")

        # Get user's experimental condition
        user_condition = get_user_condition(user_id_req)

        # Log user question to Firebase
        if question:
            firebase_logger.log_chat_message(
                user_id=user_id_req,
                session_id=session_id,
                message_type="user_question",
                content=question,
                video_id=video_id,
                segment_index=segment_index,
                metadata={
                    "selected_choice": selected_choice,
                    "kernel_type": kernelType,
                    "condition": user_condition,
                },
            )

        if kernelType == "ir":
            kernelType = "R"
        elif kernelType == "python3":
            kernelType = "Python"

        conn = sqlite3.connect("cache.db")
        c = conn.cursor()

        # T1.5: per-user state lives in a session dict, not module globals.
        session = get_user_session(user_id_req)
        # Hydrate BKT from disk on first contact for this user this process.
        if not session["bkt_params"]:
            session["bkt_params"] = init_bkt_params(user_id_req)

        if chat_bot is None:
            initialize_chat_server(kernelType)

        # T2.1: score the structured-text articulation that just arrived.
        # The articulation move was popped on the previous turn (and its
        # skill_id + "structured-text" interaction recorded in the session
        # buffers). The next move in CUR_SEQ is typically Reflection. We run
        # the rubric and update BKT before processing that next move so the
        # turn includes both feedback and a mastery update.
        if (
            user_condition == "full_coggen"
            and articulation_answer
            and articulation_answer.strip()
            and session.get("interaction_buffer") == "structured-text"
            and session.get("skill_id_buffer")
        ):
            artic_skill_id = session["skill_id_buffer"]
            knowledge_for_rubric = ""
            if session["cur_seq"]:
                knowledge_for_rubric = session["cur_seq"][0].get("knowledge", "")
            rubric = score_articulation(articulation_answer, knowledge_for_rubric)
            if rubric is not None:
                mean_score = (
                    rubric["notices_pattern"]
                    + rubric["plausible_cause"]
                    + rubric["proposes_check"]
                ) / 3.0
                is_correct = mean_score >= 0.5
                if artic_skill_id not in session["bkt_params"]:
                    session["bkt_params"][artic_skill_id] = _default_skill_state()
                old_mastery = session["bkt_params"][artic_skill_id]["probMastery"]
                update_bkt_param(
                    session["bkt_params"][artic_skill_id],
                    is_correct,
                    "structured-text",
                )
                new_mastery = session["bkt_params"][artic_skill_id]["probMastery"]
                # Persist the raw rubric scores alongside mastery so the
                # study analysis can audit per-articulation grading later.
                # The rubric history lives inside the per-skill JSON value so
                # it travels with the existing bkt_params_cache row.
                rubric_record = {
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "video_id": video_id,
                    "segment_index": segment_index,
                    "notices_pattern": rubric["notices_pattern"],
                    "plausible_cause": rubric["plausible_cause"],
                    "proposes_check": rubric["proposes_check"],
                    "mean": mean_score,
                    "is_correct": is_correct,
                    "mastery_before": old_mastery,
                    "mastery_after": new_mastery,
                    # Cap the stored answer so the JSON row doesn't bloat if
                    # a participant writes a paragraph.
                    "answer_excerpt": articulation_answer[:500],
                }
                session["bkt_params"][artic_skill_id].setdefault(
                    "rubric_history", []
                ).append(rubric_record)
                print(
                    f"T2.1 articulation: skill={artic_skill_id} "
                    f"rubric={rubric} mean={mean_score:.2f} "
                    f"correct={is_correct} mastery "
                    f"{old_mastery:.3f} -> {new_mastery:.3f}"
                )
                try:
                    bkt_params_to_database(user_id_req, session["bkt_params"])
                except Exception as exc:
                    print(f"Warning: BKT persistence failed (articulation): {exc}")
                p = get_interaction_params("structured-text")
                firebase_logger.log_bkt_update(
                    user_id=user_id_req,
                    session_id=session_id,
                    skill=artic_skill_id,
                    old_mastery=old_mastery,
                    new_mastery=new_mastery,
                    is_correct=is_correct,
                    interaction_type="structured-text",
                    video_id=video_id,
                    segment_index=segment_index,
                    user_response=articulation_answer,
                    n_observations=session["bkt_params"][artic_skill_id].get(
                        "n_observations", 0
                    ),
                    rubric=rubric,
                    rubric_mean=mean_score,
                    slip=p["probSlip"],
                    guess=p["probGuess"],
                    transit=p["probTransit"],
                )
            # Clear the interaction buffer so we don't re-score on this same
            # articulation. The skill_id buffer will be overwritten naturally
            # when the next move (Reflection) is processed below.
            session["interaction_buffer"] = ""

        # ========== CONDITION 1: CONTROL (No Directed Learning) ==========
        if user_condition == "control":
            # For control condition: No teaching sequences, just plain Q&A with LLM
            if notebook and question:
                # Simple Q&A without pedagogical structure
                context_info = f"The student is watching a data analysis video (segment {segment_index}). "
                context_info += f"They are working in a {kernelType} notebook. "

                # Get notebook context if available
                if notebook:
                    context_info += "Here is their current notebook:\n"
                    for cell in notebook.get("cells", []):
                        if cell.get("cell_type") == "code" and cell.get("source"):
                            context_info += f"\nCode: {cell['source']}\n"

                # Simple prompt for control condition
                prompt = f"{context_info}\n\nStudent question: {question}\n\nProvide a helpful response to guide their learning."

                # Get response from chatbot
                results = chat_bot.ask({"input": prompt})
                interaction = "plain-text"
                need_response = True

                # Log AI response
                firebase_logger.log_chat_message(
                    user_id=user_id_req,
                    session_id=session_id,
                    message_type="ai_response",
                    content=results,
                    video_id=video_id,
                    segment_index=segment_index,
                    metadata={
                        "interaction": interaction,
                        "need_response": need_response,
                        "condition": user_condition,
                    },
                )

                response_data = {
                    "message": results,
                    "need_response": need_response,
                    "interaction": interaction,
                }
                self.finish(json.dumps(response_data))
                return
            else:
                # No question asked, just acknowledge
                results = "I'm here to help! Feel free to ask any questions as you watch the video and work on your code."
                interaction = "plain-text"
                need_response = True

                response_data = {
                    "message": results,
                    "need_response": need_response,
                    "interaction": interaction,
                }
                self.finish(json.dumps(response_data))
                return
        # ========== END CONDITION 1 ==========

        if notebook:
            input_data = {}
            # Default to None to handle cases where it might not get set
            move_detail = None
            if session["cur_seq"] and question == "":
                # If the student does not ask a question, get the pedagogy, parameters, etc
                move_detail = session["cur_seq"][0]

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

                # Substitute {student-answer} placeholder with the student's
                # actual articulation text (preferred) or MC choice fallback.
                if "student-answer" in parameters:
                    student_answer_value = (
                        articulation_answer or selected_choice or "(no answer provided)"
                    )
                    pedagogy = pedagogy.replace(
                        "{student-answer}", student_answer_value
                    )
                    input_data["pedagogy"] = (
                        "Use the following structure to respond: " + pedagogy
                    )
                    input_data["student's answer"] = student_answer_value

                # Handle interaction logic
                if interaction == "show-code":
                    input_data["requirement"] = (
                        "Don't include the 'code-block' in the response"
                    )
                    results = chat_bot.ask({"input": str(input_data)})
                    # Some segments (e.g., "Understand the dataset") have no
                    # code block. Skip the append rather than KeyError-ing.
                    code_block_text = all_code.get(str(segment_index))
                    if code_block_text:
                        results = results + "\n" + code_block_text
                elif interaction == "drop-down":
                    results = pedagogy
                elif interaction == "multiple-choice":
                    input_data["pedagogy"] = (
                        input_data["pedagogy"]
                        + ' Please respond with the following json structure without the ```json``` title: {"question": "question", "choices": ["choice", "choice", "choice", "choice"], "correct answer": "choice", "rationale": "one sentence explaining why the correct answer is right"}'
                    )
                    # results = conversation({"input": str(input_data)})["text"]
                    raw = chat_bot.ask({"input": str(input_data)})
                    # Same repair as the Modeling cards: a truncated reply
                    # would otherwise render as raw JSON in the transcript.
                    parsed = _repair_json(raw)
                    if isinstance(parsed, dict) and parsed.get("question"):
                        results = json.dumps(parsed)
                        session["correct_answer_buffer"] = parsed.get(
                            "correct answer", ""
                        )
                    else:
                        results = raw
                        session["correct_answer_buffer"] = ""
                elif interaction in ("expert-reading", "task-intent"):
                    # Modeling cards. "expert-reading" (concept segments)
                    # exposes the gaze path the video tutor doesn't narrate.
                    # "task-intent" (programming segments) frames the
                    # segment's goal and why the chosen approach fits.
                    # Both return JSON the frontend renders into a card.
                    # No BKT update fires — Modeling is teaching, not
                    # assessment.
                    #
                    # Go through llm_json so a truncated/prose-wrapped reply is
                    # repaired here. The frontend falls back to dumping the raw
                    # body as a chat message when JSON.parse fails, which is how
                    # a half-finished object ends up visible to the student.
                    card_keys = (
                        ("task_goal", "approach", "rationale")
                        if interaction == "task-intent"
                        else ("where_to_look", "what_to_compare", "what_to_notice")
                    )
                    payload = llm_json(
                        "You are a tutoring system. Respond with valid JSON only.",
                        pedagogy,
                        required_keys=card_keys,
                    )
                    if payload is None:
                        # Never emit unparseable text: render an empty card
                        # rather than leaking JSON into the transcript.
                        payload = {k: "" for k in card_keys}
                        print(
                            f"{interaction}: no usable JSON from the LLM; "
                            "sending an empty card."
                        )
                    results = json.dumps(payload)
                elif interaction == "structured-text":
                    # Generates a writing prompt + slot labels for the student.
                    # The full JSON is returned as the message body and parsed by
                    # the frontend renderer — repair it first so a truncated
                    # reply doesn't surface as raw JSON.
                    raw = chat_bot.ask({"input": str(input_data)})
                    parsed = _repair_json(raw)
                    results = (
                        json.dumps(parsed) if isinstance(parsed, dict) else raw
                    )
                elif interaction == "compare-with-expert":
                    # Generates expert interpretation + comparison fields. We
                    # also echo the student's answer into the JSON so the
                    # frontend can render the side-by-side without separate
                    # lookups.
                    raw = chat_bot.ask({"input": str(input_data)})
                    try:
                        payload = json.loads(raw)
                    except Exception:
                        payload = {"expertAnswer": raw}
                    payload["studentAnswer"] = (
                        articulation_answer or selected_choice or ""
                    )
                    results = json.dumps(payload)
                elif interaction == "annotated-code":
                    # Scaffolding only needs the plain line to explain — no
                    # blanked version, so use the lighter line-only helper.
                    code_line = get_code_line_by_step(
                        video_id,
                        segment_index,
                        all_code,
                        move_detail["knowledge"],
                        _segment_taught_lines(session, video_id, segment_index),
                    )
                    input_data["code-line"] = code_line
                    input_data["requirement"] = (
                        "Don't include the 'code-line' in the response; explain it in one sentence."
                    )
                    results = chat_bot.ask({"input": str(input_data)})
                    results = (
                        results
                        + "\n"
                        + "```R"
                        + code_line
                        + "```"
                    )
                elif interaction == "fill-in-blanks":
                    # results = conversation({"input": str(input_data)})["text"]
                    code_line, code_line_with_blanks = get_code_with_blank_by_step(
                        video_id,
                        segment_index,
                        all_code,
                        move_detail["knowledge"],
                        _segment_taught_lines(session, video_id, segment_index),
                    )
                    session["code_line_buffer"] = code_line
                    session["code_line_blanks_buffer"] = code_line_with_blanks
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
                        code_line = get_code_line_by_step(
                            video_id,
                            segment_index,
                            all_code,
                            move_detail["knowledge"],
                            _segment_taught_lines(session, video_id, segment_index),
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
                # T1.1: skill_id comes straight from the move (assigned in
                # UpdateSeqHandler), so we no longer need to re-extract it
                # from the natural-language knowledge string.
                if move_detail.get("skill_id"):
                    session["skill_id_buffer"] = move_detail["skill_id"]
                    session["interaction_buffer"] = interaction

                # Scaffolding consumption: bump n_observations for this skill
                # when the Scaffolding move uses an interaction that does
                # NOT trigger a downstream BKT update. This makes the next
                # encounter of the same skill fall through Tier 1 into
                # Coaching automatically, instead of getting stuck at
                # mastery=0.1, n_obs=0 forever (programming Scaffolding is
                # annotated-code, which has no correctness signal). Concept
                # Scaffolding is multiple-choice and already triggers a
                # BKT update through UpdateBKTHandler, so we skip the bump
                # there to avoid double-counting.
                _BKT_UPDATING_INTERACTIONS = (
                    "fill-in-blanks",
                    "multiple-choice",
                    "structured-text",
                )
                if (
                    move_detail.get("method") == "Scaffolding"
                    and interaction not in _BKT_UPDATING_INTERACTIONS
                    and move_detail.get("skill_id")
                ):
                    bkt_dict = session["bkt_params"]
                    sid = move_detail["skill_id"]
                    if sid not in bkt_dict:
                        bkt_dict[sid] = _default_skill_state()
                    bkt_dict[sid]["n_observations"] = (
                        bkt_dict[sid].get("n_observations", 0) + 1
                    )
                    print(
                        f"Scaffolding n_obs bump: skill={sid} "
                        f"n_obs={bkt_dict[sid]['n_observations']} "
                        f"(mastery unchanged at {bkt_dict[sid]['probMastery']:.3f})"
                    )
                    try:
                        bkt_params_to_database(user_id_req, bkt_dict)
                    except Exception as exc:
                        print(f"Warning: BKT persistence failed after Scaffolding: {exc}")

                session["cur_seq"].pop(0)  # After using this move, remove it

            elif question != "":
                # Logic for when there's a question
                input_data = {
                    "student's question": question,
                    "pedagogy": "Use less than three sentences briefly answer student's query or give feedbacks.",
                }
                if not session["cur_seq"]:
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
            firebase_logger.log_chat_message(
                user_id=user_id_req,
                session_id=session_id,
                message_type="ai_response",
                content=results,
                video_id=video_id,
                segment_index=segment_index,
                metadata={
                    "interaction": interaction,
                    "need_response": need_response,
                    # Gap 1: the CogApp move this message realizes, so the
                    # conversation can be joined to teaching_methods without
                    # guessing the move from the (ambiguous) interaction type.
                    "method": move_detail.get("method") if move_detail else None,
                    "skill": move_detail.get("skill_id") if move_detail else None,
                },
            )
            self.finish(json.dumps(response_data))
        else:
            self.set_status(400)
            self.finish(json.dumps({"error": "No notebook file active"}))


class GoOnHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Evaluate if the user is ready to go on to the next segment."""
        data = self.get_json_body() or {}
        uid = data.get("userId", "unknown")
        session = get_user_session(uid)
        if session["cur_seq"]:
            result = "no"
        else:
            # set_prev_notebook(data["notebook"])
            result = "yes"  # if there is no false, go on
        self.finish(json.dumps(result))


class UpdateSeqHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Update the sequence of moves and step index depending on the mastery of the skill and category."""
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        learning_obj = data["category"]
        user_id = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")
        session = get_user_session(user_id)
        # Hydrate BKT once per process for this user; cheap if already loaded.
        if not session["bkt_params"]:
            session["bkt_params"] = init_bkt_params(user_id)
        bkt_params = session["bkt_params"]

        # Check user's condition
        user_condition = get_user_condition(user_id)

        # For control condition, don't generate teaching sequences
        if user_condition == "control":
            self.finish(json.dumps({"status": "skipped", "condition": "control"}))
            return

        # Per-video code blocks (cached per video_id), so switching videos
        # always uses the correct code.
        all_code = get_all_code(video_id)

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
                            # show-code has no submit widget — the student
                            # reads/runs the cell and uses the "Next message"
                            # button to advance. need-response=False so that
                            # button enables as soon as the message arrives.
                            "need-response": False,
                        }
                    ],
                }
            ]
        elif learning_obj == "Understand the dataset":
            # The drop-down explorer only charts NUMERIC columns. For the pet
            # names dataset the only numeric columns are license_number and
            # zip_code — identifiers whose distributions are meaningless — so
            # that video gets a plain-text exploration prompt instead (the
            # student explores the loaded table in the notebook and shares a
            # hypothesis in chat). Same Exploration step either way, keeping
            # segment 0 comparable across videos.
            if video_id == "EF4A4OtQprg":  # Seattle pet names
                explore_action = {
                    "method": "Exploration",
                    "action": "Have the student illustrate his findings by explore the dataset",
                    "prompt": "Exploring and understanding the dataset and its attributes is the first step to doing exploratory data analysis. Now please try exploring the data on your own in the notebook — look at the animals' names, species, and breeds just like Dave! If you have any hypothesis, please share with me.",
                    "interaction": "plain text",
                    "parameters": [],
                    # Free exploration in the notebook — no submit widget.
                    "need-response": False,
                }
            else:
                explore_action = {
                    "method": "Exploration",
                    "action": "Have the student illustrate his findings by explore the dataset",
                    "prompt": "Exploring and understanding the dataset and its attributes is the first step to doing exploratory data analysis. Now please try exploring the data on your own! Select a column below and look at a description and distribution just like Dave! If you have any hypothesis, please share with me.",
                    "interaction": "drop-down",
                    "parameters": [],
                    # The drop-down widget updates stats/chart in
                    # place — no submit. Student explores freely
                    # then clicks "Next message" when done.
                    "need-response": False,
                }
            sections = [
                {
                    "knowledge": "Understand the attribute meanings and metrics of the dataset, and generate hypothesis on the data",
                    "actions": [
                        {
                            "method": "Modeling",
                            "action": "Let the student execute the completed full code block",
                            "prompt": "Generate a similar sentence like this: 'The relevant library and dataset can be imported and loaded using the following code. Try to understand the code like the video does. Then, move on to the next video to learn how to look at the dataset.'",
                            "interaction": "show-code",
                            "parameters": ["code-block"],
                            # See above — show-code is read-only, no submit.
                            "need-response": False,
                        },
                        explore_action,
                    ],
                }
            ]
        else:
            code_block = all_code.get(str(segment_index), "")
            knowledge = get_knowledge(
                video_id, video_type, learning_obj, segment_index, code_block
            )
            # For quiz condition: a multiple-choice question + expert-comparison
            # feedback. The MC is CONTENT-AWARE (code-focused for programming
            # segments, chart-focused for concept segments), and feedback uses
            # the same compare-with-expert card as full_coggen. The MC json
            # schema is appended by ChatHandler's multiple-choice branch, so we
            # only describe the question here.
            if user_condition == "quiz":
                if isinstance(knowledge, list) and len(knowledge) > 0:
                    quiz_knowledge = knowledge[0]
                else:
                    quiz_knowledge = "the concepts covered in this segment"

                if code_block != "":
                    mc_prompt = (
                        "Propose a multiple-choice question for the student "
                        "about the programming approach behind {knowledge} — "
                        "for example, why a particular function or step is "
                        "used, or what it achieves in the code."
                    )
                else:
                    mc_prompt = (
                        "Propose a multiple-choice question for the student "
                        "to learn {knowledge}, such as what pattern they find "
                        "in the chart or the potential reason behind it."
                    )

                sections = [
                    {
                        "knowledge": quiz_knowledge,
                        "actions": [
                            {
                                "method": "Coaching",
                                "action": "Use {interaction} for the student to answer to learn the knowledge",
                                "interaction": "multiple-choice",
                                "prompt": mc_prompt,
                                "parameters": ["knowledge"],
                                "need-response": True,
                            },
                            {
                                "method": "Reflection",
                                "action": "Show the student a brief comparison with an expert interpretation using {interaction}",
                                "interaction": "compare-with-expert",
                                "prompt": (
                                    "Given the student's answer: {student-answer}\n"
                                    "Produce a brief comparison with an expert "
                                    "interpretation of {knowledge}. Respond as JSON "
                                    "without ```json``` fences:\n"
                                    '{"expertAnswer": "one or two sentences giving '
                                    'the expert\'s interpretation", "feedback": '
                                    '"one sentence acknowledging what the student '
                                    'got right and pointing to one thing to refine"}'
                                ),
                                "parameters": ["student-answer", "knowledge"],
                                "need-response": False,
                            },
                        ],
                    }
                ]
            # For fixed_cogapp condition (CogApp without a student model):
            # mirror full_coggen's STRUCTURE — a Modeling opener on the first
            # knowledge item, then teach each remaining item — but the method
            # for non-opener items is FIXED by segment index instead of chosen
            # by mastery. The action set (prog_action / concept_action) is the
            # same one full_coggen uses, so each method renders with the same
            # interaction.
            elif user_condition == "fixed_cogapp":
                # Method by segment index (the "fixed order" of the baseline).
                if segment_index in [1, 2]:
                    fixed_method = "Scaffolding"
                elif segment_index in [3, 4]:
                    fixed_method = "Coaching"
                elif segment_index in [5, 6]:
                    fixed_method = "Articulation"
                elif segment_index in [7, 8]:
                    fixed_method = "Reflection"
                elif segment_index >= 9:
                    fixed_method = "Exploration"
                else:
                    fixed_method = "Scaffolding"  # segment 0 / fallback

                if code_block == "":
                    action_set = concept_action
                    content_type = "concept"
                else:
                    action_set = prog_action
                    content_type = "programming"

                if not (isinstance(knowledge, list) and len(knowledge) > 0):
                    knowledge = ["the concepts covered in this segment"]

                # First item → Modeling opener; the rest → the fixed method.
                if fixed_method not in action_set:
                    fixed_method = "Coaching"  # safety net

                # Some moves are inherently SEGMENT-LEVEL, not per-knowledge, so
                # teaching them once per knowledge item is redundant or heavy.
                # For these we teach exactly ONE non-opener item then stop:
                #
                #  * Concept Articulation (structured-text): writing a full open
                #    answer for every item is a lot — keep it to one.
                #  * Concept Reflection (compare-with-expert): needs a student
                #    answer to compare against, so pair it with an Articulation
                #    (Modeling → Articulation → Reflection), matching how
                #    full_coggen always precedes Reflection with Articulation.
                #  * Programming Reflection (show-code): displays the WHOLE
                #    segment's code, so repeating it just dumps the same block.
                #  * Exploration (plain-text novel task): each one requires the
                #    student to type a response to advance; several per segment
                #    is a heavy, repetitive ask — one open extension is enough.
                concept_articulation_light = (
                    content_type == "concept" and fixed_method == "Articulation"
                )
                concept_reflection_pair = (
                    content_type == "concept" and fixed_method == "Reflection"
                )
                programming_reflection_single = (
                    content_type == "programming" and fixed_method == "Reflection"
                )
                exploration_single = fixed_method == "Exploration"
                single_item_segment = (
                    concept_articulation_light
                    or concept_reflection_pair
                    or programming_reflection_single
                    or exploration_single
                )

                def _fixed_item_methods():
                    # Concept Articulation AND concept Reflection both render as
                    # a structured-text answer followed by compare-with-expert
                    # feedback, so the student's written answer gets a response.
                    if content_type == "concept" and fixed_method in (
                        "Articulation",
                        "Reflection",
                    ):
                        return ["Articulation", "Reflection"]
                    return [fixed_method]

                fixed_method_entries = []
                for i, k in enumerate(knowledge):
                    if i == 0:
                        fixed_method_entries.append(
                            {"knowledge": k, "method": ["Modeling"]}
                        )
                        continue
                    # Segment-level moves: teach only the first non-opener item.
                    if single_item_segment and i > 1:
                        break
                    fixed_method_entries.append(
                        {"knowledge": k, "method": _fixed_item_methods()}
                    )

                # Programming: end the segment with a show-code Reflection
                # (the gestalt wrap-up), matching full_coggen. Skip if the
                # last item is already a Reflection (e.g. segments 7-8), and
                # skip on an Exploration segment — there the student attempts a
                # novel task on their own and replies when done; showing the
                # reference code afterwards would undercut the open-ended point.
                if (
                    content_type == "programming"
                    and not exploration_single
                    and len(fixed_method_entries) > 1
                    and fixed_method_entries[-1]["method"][-1] != "Reflection"
                ):
                    fixed_method_entries[-1]["method"] = (
                        fixed_method_entries[-1]["method"] + ["Reflection"]
                    )

                sections = get_dsl(fixed_method_entries, action_set)
            else:
                # For full_coggen: use the T2.3 deterministic planner that
                # consumes mastery + n_observations and applies the policy
                # table documented next to plan_methods(). No GPT call here,
                # so segment start is now near-instant.
                mastery_level = get_mastery_level_by_segment(
                    knowledge, bkt_params, video_id, segment_index
                )
                n_obs_list = [
                    bkt_params.get(
                        make_skill_id(video_id, segment_index, i), {}
                    ).get("n_observations", 0)
                    for i in range(len(knowledge))
                ]
                if code_block == "":
                    action_set = concept_action
                    content_type = "concept"
                else:
                    action_set = prog_action
                    content_type = "programming"
                methods = plan_methods(
                    knowledge, mastery_level, n_obs_list, content_type
                )
                print(
                    f"T2.3 planner: video={video_id} seg={segment_index} "
                    f"mastery={mastery_level} n_obs={n_obs_list} -> "
                    f"methods={[m['method'] for m in methods]}"
                )
                sections = get_dsl(methods, action_set)

            # Note: no declarative→Modeling final guard. Both full_coggen and
            # fixed_cogapp now place Modeling explicitly as the segment opener
            # (first knowledge item only), so forcing every declarative item
            # to Modeling here would recreate the multiple-Modeling-cards bug.
        # T1.1: attach the deterministic skill_id to every move so the
        # downstream BKT update doesn't need to re-extract a skill from the
        # natural-language knowledge string.
        new_cur_seq = []
        for ki, section in enumerate(sections):
            skill_id = make_skill_id(video_id, segment_index, ki)
            for action in section["actions"]:
                new_cur_seq.append(
                    dict(
                        knowledge=section["knowledge"],
                        skill_id=skill_id,
                        **action,
                    )
                )
        session["cur_seq"] = new_cur_seq

        # Gap 1: log the teaching MOVE chosen for each item, with the mastery
        # the planner saw at decision time. This is what RQ2.1 / Measure 3.2
        # need — aligning move choice against knowledge state — and can't be
        # recovered from chat_logs, where several moves share one interaction
        # type (e.g. multiple-choice is Scaffolding OR Coaching OR
        # Articulation). Mastery is read BEFORE any teaching this segment, so
        # it reflects the state the decision was based on, not the post-answer
        # value that bkt_updates records.
        for entry in new_cur_seq:
            skill_id = entry["skill_id"]
            skill_state = bkt_params.get(skill_id, {})
            firebase_logger.log_teaching_method(
                user_id=user_id,
                session_id=session_id,
                method=entry.get("method"),
                video_id=video_id,
                segment_index=segment_index,
                context={
                    "condition": user_condition,
                    "skill": skill_id,
                    "interaction": entry.get("interaction"),
                    "knowledge": entry.get("knowledge"),
                    "mastery_at_decision": skill_state.get("probMastery", 0.1),
                    "n_observations_at_decision": skill_state.get(
                        "n_observations", 0
                    ),
                },
            )
        # Fresh teaching sequence for this segment — forget which code lines
        # the previous sequence used, so a rebuild (e.g. after a refresh)
        # starts from the best-matching lines again.
        session["taught_lines_key"] = None
        session["taught_lines"] = set()
        print("CUR_SEQ after update:", session["cur_seq"])


class FillInBlanksHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        """Get all choices for the fill-in-blanks action."""
        data = self.get_json_body()
        video_id = data["videoId"]
        segment_index = data["segmentIndex"]
        functions_attributes_to_learn = get_function_attribute_by_segment(
            video_id=video_id,
            segment_index=segment_index,
            code_json=get_all_code(video_id),
        )
        # Flattening the list of lists and extracting unique items
        choices = list(set(functions_attributes_to_learn))
        self.finish(json.dumps(choices))


class UpdateBKTHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        video_id = data["videoId"]
        filled_code = data["filledCode"]
        selected_choice = data["selectedChoice"]
        segment_index = data.get("segmentIndex", 0)
        user_id_req = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")
        # Check user's condition - skip BKT for control, quiz, and fixed_cogapp conditions
        user_condition = get_user_condition(user_id_req)
        if user_condition in ["control", "quiz", "fixed_cogapp"]:
            self.finish(json.dumps({"status": "skipped", "condition": user_condition}))
            return

        session = get_user_session(user_id_req)
        if not session["bkt_params"]:
            session["bkt_params"] = init_bkt_params(user_id_req)

        # T1.1: skill_id was buffered by ChatHandler when the practice item
        # was sent out, so we use it directly instead of re-extracting from
        # a fragile natural-language knowledge string.
        skill_id = session.get("skill_id_buffer", "")
        if video_id != "" and skill_id:
            update_bkt_params(
                session,
                skill_id,
                filled_code,
                selected_choice,
                user_id_req,
                session_id,
                video_id,
                segment_index,
            )
            # T1.4: persist after each update so the on-disk state stays in
            # sync with memory (also survives process restarts mid-study).
            try:
                bkt_params_to_database(user_id_req, session["bkt_params"])
            except Exception as exc:
                print(f"Warning: BKT persistence failed: {exc}")
            self.finish(json.dumps("update bkt successfully"))
        else:
            print(
                f"UpdateBKTHandler skipped: video_id={video_id!r} "
                f"skill_id_buffer={skill_id!r}"
            )
            self.finish(json.dumps({"status": "skipped"}))


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

    video_id = "EF4A4OtQprg"  # pet names
    segments_set = [
        {
            "category": "Understand the dataset",
            "start": 1,
            "end": 157,
        },  # 0
        {
            "category": "Preprocess and Visualize the data",
            "start": 157,
            "end": 536,
        },  # 1
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 536,
            "end": 614,
        },  # 2
        {
            "category": "Preprocess and Visualize the data",
            "start": 614,
            "end": 1077,
        },  # 3
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1077,
            "end": 1178,
        },  # 4
        {
            "category": "Preprocess and Visualize the data",
            "start": 1178,
            "end": 1497,
        },  # 5
        {
            "category": "Preprocess and Visualize the data",
            "start": 1497,
            "end": 1787,
        },  # 6
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1787,
            "end": 2540,
        },  # 7
        {
            "category": "Preprocess and Visualize the data",
            "start": 2540,
            "end": 2697,
        },  # 8
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 2697,
            "end": 2846,
        },  # 9
        {
            "category": "Preprocess and Visualize the data",
            "start": 2846,
            "end": 3344,
        },  # 10
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )

    video_id = "1xsbTs9-a50"  # franchise revenue
    segments_set = [
        {
            "category": "Understand the dataset",
            "start": 1,
            "end": 401,
        },  # 0
        {
            "category": "Preprocess and Visualize the data",
            "start": 401,
            "end": 663,
        },  # 1
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 663,
            "end": 1032,
        },  # 2
        {
            "category": "Preprocess and Visualize the data",
            "start": 1032,
            "end": 1414,
        },  # 3
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1414,
            "end": 1589,
        },  # 4
        {
            "category": "Preprocess and Visualize the data",
            "start": 1589,
            "end": 1721,
        },  # 5
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1721,
            "end": 1941,
        },  # 6
        {
            "category": "Preprocess and Visualize the data",
            "start": 1941,
            "end": 2233,
        },  # 7
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 2233,
            "end": 2441,
        },  # 8
        {
            "category": "Preprocess and Visualize the data",
            "start": 2441,
            "end": 2700,
        },  # 9
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 2700,
            "end": 2849,
        },  # 10
        {
            "category": "Preprocess and Visualize the data",
            "start": 2849,
            "end": 3261,
        },  # 11
    ]
    segments_json = json.dumps(segments_set)
    c.execute("SELECT * FROM segments_cache WHERE video_id = ?", (video_id,))
    if c.fetchone() is None:
        # Insert new data if video_id doesn't exist
        c.execute(
            "INSERT INTO segments_cache (video_id, segments) VALUES (?, ?)",
            (video_id, segments_json),
        )

    video_id = "-1x8Kpyndss"  # coffee ratings
    segments_set = [
        {
            "category": "Understand the dataset",
            "start": 1,
            "end": 362,
        },  # 0
        {
            "category": "Preprocess and Visualize the data",
            "start": 362,
            "end": 664,
        },  # 1
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 664,
            "end": 743,
        },  # 2
        {
            "category": "Preprocess and Visualize the data",
            "start": 743,
            "end": 1022,
        },  # 3
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1022,
            "end": 1120,
        },  # 4
        {
            "category": "Preprocess and Visualize the data",
            "start": 1120,
            "end": 1464,
        },  # 5
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1464,
            "end": 1566,
        },  # 6
        {
            "category": "Preprocess and Visualize the data",
            "start": 1566,
            "end": 1930,
        },  # 7
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 1930,
            "end": 2257,
        },  # 8
        {
            "category": "Preprocess and Visualize the data",
            "start": 2257,
            "end": 2487,
        },  # 9
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 2487,
            "end": 2687,
        },  # 10
        {
            "category": "Preprocess and Visualize the data",
            "start": 2687,
            "end": 2873,
        },  # 11
        {
            "category": "Interpret the chart and propose hypotheses",
            "start": 2873,
            "end": 3113,
        },  # 12
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

    c.execute(
        """
    CREATE TABLE IF NOT EXISTS user_conditions (
        user_id TEXT PRIMARY KEY,
        condition TEXT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );"""
    )

    c.execute(
        """
    CREATE TABLE IF NOT EXISTS questionnaire_progress (
        user_id TEXT PRIMARY KEY,
        pretest_completed INTEGER NOT NULL DEFAULT 0,
        pretest_completed_at TIMESTAMP
    );"""
    )

    # Migrate questionnaire_progress for post-test tracking if columns are missing.
    c.execute("PRAGMA table_info(questionnaire_progress)")
    existing_columns = {row[1] for row in c.fetchall()}
    if "latin_order" not in existing_columns:
        c.execute("ALTER TABLE questionnaire_progress ADD COLUMN latin_order TEXT")
    if "posttest_index" not in existing_columns:
        c.execute(
            "ALTER TABLE questionnaire_progress ADD COLUMN posttest_index INTEGER NOT NULL DEFAULT 0"
        )
    if "completed_videos" not in existing_columns:
        c.execute(
            "ALTER TABLE questionnaire_progress ADD COLUMN completed_videos TEXT NOT NULL DEFAULT '[]'"
        )
    if "finished_videos" not in existing_columns:
        c.execute(
            "ALTER TABLE questionnaire_progress ADD COLUMN finished_videos TEXT NOT NULL DEFAULT '[]'"
        )
    if "assigned_video_id" not in existing_columns:
        c.execute(
            "ALTER TABLE questionnaire_progress ADD COLUMN assigned_video_id TEXT"
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
        bot_response = llm_chat(
            system_prompt=prompt,
            user_message=str(user_input),
        )
        # Update memory with the latest exchange (langchain memory works
        # provider-agnostically; we just record the strings).
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


# Transcripts for the study videos are bundled with the package (see
# tools/fetch_transcripts.py). YouTube blocks transcript requests coming from
# cloud-provider IPs, so a live fetch from the GCP VM raises RequestBlocked —
# which used to surface as a 500 the moment a segment's knowledge wasn't
# already cached. Reading the bundled copy removes that network dependency
# entirely; the live API is kept only as a fallback for non-study videos.
_transcript_cache: dict = {}


def _load_bundled_transcript(video_id):
    """Return the bundled raw transcript for a video, or None if not bundled."""
    if video_id in _transcript_cache:
        return _transcript_cache[video_id]
    path = _package_data_path(os.path.join("transcripts", f"{video_id}.json"))
    try:
        with open(path) as f:
            data = json.load(f)
    except (OSError, ValueError):
        data = None
    _transcript_cache[video_id] = data
    return data


def get_transcript(video_id, start=0, end=900):
    """Get the transcript file corresponding to a video from the database."""
    data = _load_bundled_transcript(video_id)
    if data is None:
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)
        data = fetched_transcript.to_raw_data()  # Convert to list of dicts
    # Copy the cues we keep: callers mutate them (deleting "duration"), which
    # would otherwise corrupt the in-memory bundled transcript for later calls.
    transcript = [dict(i) for i in data if i["start"] >= start and i["start"] < end]
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
    raw = llm_chat(
        system_prompt=f"""Here is a video transcript about {video_type}. Summarize the video content that corresponds to each given learning goal.
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
        user_message=f"transcript: {transcript}, learning goals: {learning_goal}",
    )
    summary = _parse_llm_list(raw)
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

        sentence = llm_chat(
            system_prompt=(
                "Here is a transcript of the video about exploratory data "
                "analysis and a summary of one paragraph of the video "
                "transcript. Find the starting sentence in the given "
                "transcript that corresponds to the summary. Don't add "
                "punctuation or capitalization that are not in the original "
                "transcript. Response only the first sentence."
            ),
            user_message=f"transcript: {result_string}, summary: {item['summary']}",
        )
        item["start sentence"] = sentence

    start_sentence_list = []
    for item in summary_list:
        start_sentence_list.append(item["start sentence"])
    return start_sentence_list


def get_timestamp(transcript_with_time, start_sentence_list):
    """Returns the start timestamp of each sentence in the start sentence list."""
    raw = llm_chat(
        system_prompt=(
            "Here is a video transcript about exploratory data analysis and a "
            "list of sentences. Find out the start timestamp corresponding to "
            "each sentence. Response only in a list, for example: "
            "[start timestamp 1, start timestamp 2, start timestamp 3, ...]"
        ),
        user_message=f"transcript: {transcript_with_time}, sentence list: {start_sentence_list}",
    )
    time = _parse_llm_list(raw)
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
        # Defensively re-parse the cached value. Older runs (under OpenAI)
        # stored a pure Python list literal; newer Gemini runs may have
        # cached a value with prose around the list. _parse_llm_list copes
        # with both. If it's corrupt OR EMPTY, drop the row and regenerate
        # (a cached empty list would permanently skip the segment).
        try:
            cached = _parse_llm_list(row[0])
        except (ValueError, SyntaxError):
            cached = None
        if cached:
            return cached
        print(
            f"knowledge_cache row for {video_id}::{segment_index} is "
            f"empty/unparseable; regenerating."
        )
        c.execute(
            "DELETE FROM knowledge_cache WHERE video_id = ? AND segment_index = ?",
            (video_id, segment_index),
        )
        conn.commit()

    start_time = segment["start"]
    end_time = segment["end"]
    _, segment_transcript = get_transcript(video_id, start_time, end_time)
    if end_time - start_time > 150:
        num = 5
    elif end_time - start_time < 50:
        num = 3
    else:
        num = 4
    if code_block != "":
        knowledge = llm_chat(
            system_prompt=f"""The following {video_type} video transcript and the code block taught in the video are about a learning goal: {learning_obj}. Summarize the declarative and procedural knowledge in the video transcript and code block.
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
            user_message=f"video transcript: {segment_transcript}, code block: {code_block}",
        )
    else:
        knowledge = llm_chat(
            system_prompt=f"""The following {video_type} video transcript is about a learning goal: {learning_obj}. Summarize the declarative and procedural knowledge in the video transcript.
                                    The result should be summarized in one sentence of procedural knowledge, and no more than {num - 1} sentences of declarative knowledge, in the order in which it should be learned.
                                    Each knowledge MUST begin with the literal label "Procedural knowledge:" or "Declarative knowledge:" so downstream logic can detect the type. Follow this format:
                                    Procedural knowledge: "To achieve/understand + [specific goal/outcome] + one need to + [general actions/processes] + [additional details] + and consider/use + [relevant factors/tools]." The [general actions/processes] should be quoted in a && sign.
                                    For example, "Procedural knowledge: To understand the distribution of earnings by college major, one need to &examine the histogram and identify overall trend or extreme values&, and consider whether high earnings are due to the field's financial reward or influenced by factors such as low sample size and high variation."
                                    Declarative knowledge: "[Subject] + [verb phrase] + that + [independent clause]".
                                    For example, "Declarative knowledge: The median income by college major shows that majors earn a median income of over $30K right out of college."
                                    And sort the output knowledge order according to the correct cognitive order. For example, students need to first learn how to interpret the chart then find out the facts in the chart.
                                    Your response should be in a list format without any explanations:
                                    [
                                        'Procedural knowledge: ...',
                                        'Declarative knowledge: ...',
                                        ...
                                    ]
                                """,
            user_message=f"video transcript: {segment_transcript}",
        )
    # Parse FIRST so we never cache a value we couldn't decode.
    try:
        parsed = _parse_llm_list(knowledge)
    except (ValueError, SyntaxError):
        parsed = []

    # Don't cache (and surface) an EMPTY result. The LLM occasionally returns
    # an empty list for a segment (a transient hiccup); caching that would
    # permanently skip the segment's teaching ("no methods, proceed to next").
    # Caching only non-empty knowledge means a refresh/re-entry regenerates it.
    if not parsed:
        print(
            f"⚠️  get_knowledge produced EMPTY knowledge for "
            f"{video_id}::{segment_index} ({learning_obj}); not caching so it "
            f"will be retried on the next request."
        )
        conn.close()
        return parsed

    c.execute(
        "INSERT INTO knowledge_cache (video_id, segment_index, knowledge) VALUES (?, ?, ?)",
        (video_id, segment_index, repr(parsed)),
    )
    conn.commit()
    conn.close()
    return parsed


def get_methods(video_type, learning_obj, knowledge, mastery_level, code_block):
    """Get the teaching methods for the given knowledge and mastery level."""
    if code_block == "":
        video_content = "concept-related"
    else:
        video_content = "programming-related"
    methods = llm_chat(
        system_prompt=f"""You are an expert mentor who is good at arrange teaching methods to help student learn from a video about {video_type}.
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
                                Whenever you assign Articulation to a knowledge, you must immediately follow it with Reflection on that same knowledge, so the student gets feedback on every open-text answer. Reflection should only be used after Articulation (never after Coaching).

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
        user_message=f"programming or concept: {video_content}, knowledge: {knowledge}, student's mastery level: {mastery_level}",
    )
    methods = _parse_llm_list(methods)
    return methods


def get_dsl(methods, action_set):
    """Get the domain specific language for a video segment."""
    result = []

    for method_entry in methods:
        knowledge = method_entry["knowledge"]
        action_entries = method_entry["method"]

        # NOTE: no declarative→Modeling override here. plan_methods() already
        # decides where Modeling goes (the segment opener only). Forcing
        # declarative items to Modeling here is what produced one expert-
        # reading card per declarative fact in concept segments.

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


def _default_skill_state() -> dict:
    return {"probMastery": 0.1, "n_observations": 0}


def init_bkt_params(uid: str) -> dict:
    """Load this user's BKT state from disk into a fresh dict.

    Backward-compatible with the old persistence shape ({skill: float}) — any
    legacy entry is rehydrated into the new {probMastery, n_observations}
    shape with n_observations=0.
    """
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT skills_probMastery FROM bkt_params_cache WHERE user_id = ?", (uid,)
    )
    row = c.fetchone()
    conn.close()
    if row is None or not row[0]:
        return {}
    try:
        stored = json.loads(row[0])
    except (ValueError, TypeError):
        return {}

    bkt: dict = {}
    for skill, value in stored.items():
        if isinstance(value, dict):
            entry = {
                "probMastery": float(value.get("probMastery", 0.1)),
                "n_observations": int(value.get("n_observations", 0)),
            }
            # Preserve any rubric history attached to this skill so the
            # full audit trail survives reloads.
            if "rubric_history" in value:
                entry["rubric_history"] = list(value["rubric_history"])
            bkt[skill] = entry
        else:
            # Legacy float-only entry.
            bkt[skill] = {
                "probMastery": float(value),
                "n_observations": 0,
            }
    return bkt


def update_bkt_param(state: dict, is_correct, interaction: str) -> None:
    """Apply one BKT update to a single skill's state, in-place.

    `is_correct` accepts either a bool (True / False — the standard binary
    BKT input) or a float in [0, 1] for a *soft* observation (e.g. fraction
    of blanks filled correctly). When fractional, the posterior is the
    Bayesian mixture of the would-be-correct posterior and the would-be-wrong
    posterior weighted by the fraction. Endpoints 1.0 / 0.0 reduce exactly
    to the standard binary update.

    Slip / guess / transit are looked up by interaction type (T1.2): a
    4-option MC has a much higher guess rate than a fill-in-blanks item, so
    identical correctness signals are *not* equally diagnostic. The per-skill
    state keeps only probMastery and the running count of observations.
    """
    fraction = float(is_correct)
    fraction = max(0.0, min(1.0, fraction))
    p = get_interaction_params(interaction)
    prob_mastery = state["probMastery"]

    # Posteriors under the two hypotheses about the observation.
    num_correct = prob_mastery * (1 - p["probSlip"])
    den_correct = num_correct + (1 - prob_mastery) * p["probGuess"]
    num_wrong = prob_mastery * p["probSlip"]
    den_wrong = num_wrong + (1 - prob_mastery) * (1 - p["probGuess"])
    if den_correct <= 0 or den_wrong <= 0:
        # Degenerate case (shouldn't happen with sensible params); skip update.
        return
    posterior_correct = num_correct / den_correct
    posterior_wrong = num_wrong / den_wrong

    # Soft mixture: with fraction=1.0 this is exactly the old correct-update,
    # with fraction=0.0 it's exactly the old wrong-update.
    posterior = fraction * posterior_correct + (1.0 - fraction) * posterior_wrong
    state["probMastery"] = posterior + (1 - posterior) * p["probTransit"]
    state["n_observations"] = state.get("n_observations", 0) + 1


def get_mastery_level_by_segment(
    list_of_knowledge, bkt_params: dict, video_id: str, segment_index
) -> list:
    """Return mastery for each knowledge item in this segment.

    T1.1: skills are identified deterministically by (video_id, segment_index,
    knowledge_index). No reranker, no rename-on-rerank, no NL-string keys.
    New skills are bootstrapped with default low mastery.
    """
    mastery_level = []
    for idx, _ in enumerate(list_of_knowledge):
        skill_id = make_skill_id(video_id, segment_index, idx)
        if skill_id not in bkt_params:
            bkt_params[skill_id] = _default_skill_state()
        mastery_level.append(bkt_params[skill_id]["probMastery"])
    return mastery_level


def update_bkt_params(
    session: dict,
    skill_id: str,
    filled_code: str,
    selected_choice: str,
    user_id_req="unknown",
    session_id="unknown",
    video_id=None,
    segment_index=None,
):
    """Update one skill's BKT state in `session` based on the latest practice.

    T1.1: skill is now identified by skill_id (deterministic key), not by the
    LLM-extracted natural-language skill phrase.
    T1.2: the interaction stored in the session buffer determines which
    slip/guess profile we apply.
    T1.3: fill-in-blanks correctness uses canonicalize_code() for lenient
    comparison rather than raw `.strip() == .strip()`.
    """
    bkt = session["bkt_params"]
    if skill_id not in bkt:
        bkt[skill_id] = _default_skill_state()

    interaction_used = session.get("interaction_buffer", "")

    if filled_code != "":
        target = session.get("code_line_buffer", "")
        masked = session.get("code_line_blanks_buffer", "")
        user_response = filled_code
        session["code_line_buffer"] = ""
        session["code_line_blanks_buffer"] = ""
        if not interaction_used:
            interaction_used = "fill-in-blanks"

        # Soft scoring: align the filled code against the masked template
        # and the target, count what fraction of blanks were correct, and
        # feed that fraction into a single soft BKT update. This treats one
        # submission as one observation (so n_observations doesn't bloat),
        # while still rewarding partial correctness — 2 of 3 blanks right
        # moves mastery up meaningfully rather than being binarized to
        # "all wrong".
        target_answers = extract_blank_answers(masked, target)
        filled_answers = extract_blank_answers(masked, filled_code)
        n_correct = 0
        n_total = 0
        if (
            target_answers is not None
            and filled_answers is not None
            and len(target_answers) == len(filled_answers)
            and len(target_answers) > 0
        ):
            n_total = len(target_answers)
            for t, f in zip(target_answers, filled_answers):
                if canonicalize_code(t) == canonicalize_code(f):
                    n_correct += 1
            fraction = n_correct / n_total
        else:
            # Alignment failed (likely because the student modified the
            # skeleton). Fall back to whole-line comparison so we don't
            # silently misattribute correctness — that gives 0.0 or 1.0.
            fraction = (
                1.0
                if canonicalize_code(filled_code) == canonicalize_code(target)
                else 0.0
            )
            n_total = 1
            n_correct = int(fraction)

        old_mastery = bkt[skill_id]["probMastery"]
        update_bkt_param(bkt[skill_id], fraction, interaction_used)
        new_mastery = bkt[skill_id]["probMastery"]
        print(
            f"BKT update: skill={skill_id} interaction={interaction_used} "
            f"blanks_correct={n_correct}/{n_total} (fraction={fraction:.2f}) "
            f"mastery {old_mastery:.3f} -> {new_mastery:.3f} "
            f"(n_obs={bkt[skill_id]['n_observations']})"
        )
        p = get_interaction_params(interaction_used)
        firebase_logger.log_bkt_update(
            user_id=user_id_req,
            session_id=session_id,
            skill=skill_id,
            old_mastery=old_mastery,
            new_mastery=new_mastery,
            # Send the fraction itself, not a binarized bool — Firebase now
            # has the raw partial-credit value for analysis.
            is_correct=fraction,
            interaction_type=interaction_used,
            video_id=video_id,
            segment_index=segment_index,
            user_response=user_response,
            n_observations=bkt[skill_id].get("n_observations", 0),
            slip=p["probSlip"],
            guess=p["probGuess"],
            transit=p["probTransit"],
        )
        session["interaction_buffer"] = ""
        return

    # Multiple-choice path: single binary observation as before.
    old_mastery = bkt[skill_id]["probMastery"]
    is_correct = selected_choice == session.get("correct_answer_buffer", "")
    user_response = selected_choice
    session["correct_answer_buffer"] = ""
    if not interaction_used:
        interaction_used = "multiple-choice"

    update_bkt_param(bkt[skill_id], is_correct, interaction_used)
    new_mastery = bkt[skill_id]["probMastery"]
    print(
        f"BKT update: skill={skill_id} interaction={interaction_used} "
        f"correct={is_correct} mastery {old_mastery:.3f} -> {new_mastery:.3f} "
        f"(n_obs={bkt[skill_id]['n_observations']})"
    )

    p = get_interaction_params(interaction_used)
    firebase_logger.log_bkt_update(
        user_id=user_id_req,
        session_id=session_id,
        skill=skill_id,
        old_mastery=old_mastery,
        new_mastery=new_mastery,
        is_correct=is_correct,
        interaction_type=interaction_used,
        video_id=video_id,
        segment_index=segment_index,
        user_response=user_response,
        n_observations=bkt[skill_id].get("n_observations", 0),
        slip=p["probSlip"],
        guess=p["probGuess"],
        transit=p["probTransit"],
    )

    session["interaction_buffer"] = ""


def get_skill_by_knowledge(knowledge):
    """Get the skills corresponding to the given segment."""
    # Regular expression to find text between & symbols
    pattern = r"&([^&]*)&"
    # Using re.findall to get all substrings between & characters
    substrings = re.findall(pattern, knowledge)

    # Strip whitespace so empty/whitespace-only markers don't yield junk
    # skills like " to ".
    substrings = [s.strip() for s in substrings if s.strip()]
    if len(substrings) > 1:
        skill = substrings[1] + " to " + substrings[0]
    elif len(substrings) == 1:
        skill = substrings[0]
    else:
        skill = ""
    return skill


def bkt_params_to_database(uid: str, bkt_params: dict) -> None:
    """Store the updated BKT state for a user.

    T1.4: persist the full per-skill state ({probMastery, n_observations}),
    not just probMastery. Backward compatible with the old float-only schema:
    legacy rows are upgraded in place on first write.
    """
    serialized = {}
    for skill_id, value in bkt_params.items():
        entry = {
            "probMastery": float(value["probMastery"]),
            "n_observations": int(value.get("n_observations", 0)),
        }
        if value.get("rubric_history"):
            entry["rubric_history"] = list(value["rubric_history"])
        serialized[skill_id] = entry
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "SELECT skills_probMastery FROM bkt_params_cache WHERE user_id = ?",
        (uid,),
    )
    row = c.fetchone()
    if row is None:
        c.execute(
            "INSERT INTO bkt_params_cache (user_id, skills_probMastery) VALUES (?, ?)",
            (uid, json.dumps(serialized)),
        )
    else:
        try:
            existing = json.loads(row[0]) if row[0] else {}
        except (ValueError, TypeError):
            existing = {}
        # Upgrade any legacy float entries to the new dict shape so the file
        # is self-consistent after this write.
        merged: dict = {}
        for skill_id, value in existing.items():
            if isinstance(value, dict):
                merged[skill_id] = value
            else:
                merged[skill_id] = {
                    "probMastery": float(value),
                    "n_observations": 0,
                }
        merged.update(serialized)
        c.execute(
            "UPDATE bkt_params_cache SET skills_probMastery = ? WHERE user_id = ?",
            (json.dumps(merged), uid),
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
    code_with_blanks = llm_chat(
        system_prompt="""Use the given code block, make all the designated functions and attributes to be blanks in the code as blanks.
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
        user_message=f"functions/attributes to learn: {str(function_attribute)}, code block: {str(code_block)}",
    )
    c.execute(
        "UPDATE code_block_cache SET code_with_blanks = ? WHERE video_id = ? AND segment_index = ?",
        (code_with_blanks, video_id, segment_index),
    )
    conn.commit()
    conn.close()
    return code_with_blanks


# A quoted term that the line actually CALLS (`top_n(`) is a far stronger
# signal than one it merely mentions (`species` appearing as an argument).
# Scoring them equally made shared variable names dominate: e.g. for the
# knowledge "use 'group_by' and 'top_n' on 'species'", the line
# `count(species, primary_breed, ...)` scored the same as `top_n(10, percent)`
# and won on line order, so the student practiced the wrong line.
_FUNCTION_CALL_WEIGHT = 3
_MENTION_WEIGHT = 1


def _term_score(term, line):
    """Score one quoted term against one code line (call > mention > absent)."""
    if not term:
        return 0
    escaped = re.escape(term)
    if re.search(rf"\b{escaped}\s*\(", line):
        return _FUNCTION_CALL_WEIGHT
    if re.search(rf"\b{escaped}\b", line):
        return _MENTION_WEIGHT
    return 0


def _find_code_line_indices(code_lines, knowledge, used_lines=None):
    """Find the code-line index/indices for a knowledge item DETERMINISTICALLY.

    The knowledge string names the relevant functions/attributes in single
    quotes (e.g. 'geom_boxplot', 'country'), and those appear verbatim in the
    code — so we match by scoring instead of making an LLM call. Falls back to
    [0] if nothing matches. This replaces a per-move LLM round-trip (it was
    also a frequent source of hallucinated out-of-range indices).

    Two rules keep different knowledge items from landing on the same line:
      * If any line calls one of the named functions, lines that only mention
        a shared variable are dropped entirely rather than filling the second
        slot with a near-irrelevant line.
      * `used_lines` (the lines already taught in this segment) are pushed to
        the back, so a line is only repeated when nothing else matches.
    """
    attrs = [a for a in get_function_attribute_by_knowledge(knowledge) if a]
    if not code_lines:
        return []
    if not attrs:
        return [0]
    used = used_lines or set()
    scored = []
    for i, line in enumerate(code_lines):
        score = sum(_term_score(a, line) for a in attrs)
        if score > 0:
            scored.append((score, i))
    if not scored:
        return [0]
    best = max(score for score, _ in scored)
    threshold = _FUNCTION_CALL_WEIGHT if best >= _FUNCTION_CALL_WEIGHT else 1
    candidates = [(score, i) for score, i in scored if score >= threshold]
    # Unseen lines first, then strongest match, then source order.
    candidates.sort(key=lambda si: (si[1] in used, -si[0], si[1]))
    return sorted(i for _, i in candidates[:2])


def get_code_line_by_step(
    video_id, segment_index, code_json, knowledge, used_lines=None
):
    """Return just the PLAIN code line(s) matching a knowledge item.

    Used by Scaffolding (annotated-code), which only needs to show/explain a
    code line — it does NOT need the blanked version. Avoids the extra
    get_code_with_blank LLM call and the line-count mismatch that the blanked
    path can hit.
    """
    code_block = code_json[str(segment_index)]
    code_lines = code_block.split("\\n")[1:-1]
    line_index = _find_code_line_indices(code_lines, knowledge, used_lines)
    if used_lines is not None:
        used_lines.update(line_index)
    return "\n".join(code_lines[i] for i in line_index)


def get_code_with_blank_by_step(
    video_id, segment_index, code_json, knowledge, used_lines=None
):
    """Return (plain code line(s), blanked code line(s)) for a knowledge item.

    Used by Coaching (fill-in-blanks), which needs the blanked version for the
    student to fill in.
    """
    code_with_blanks = get_code_with_blank(video_id, segment_index, code_json)
    code_block = code_json[str(segment_index)]
    code_lines = code_block.split("\\n")[1:-1]
    code_lines_with_blanks = code_with_blanks.split("\n")[1:-1]
    # Clamp to indices valid for BOTH lists — the blanked version is
    # LLM-generated and may have a different line count than the original.
    max_idx = min(len(code_lines), len(code_lines_with_blanks))
    line_index = [
        i
        for i in _find_code_line_indices(code_lines, knowledge, used_lines)
        if i < max_idx
    ]
    if not line_index and max_idx > 0:
        line_index = [0]
    if used_lines is not None:
        used_lines.update(line_index)
    combined_code = "\n".join(code_lines[i] for i in line_index)
    combined_code_with_blank = "\n".join(
        code_lines_with_blanks[i] for i in line_index
    )
    return combined_code, combined_code_with_blank


def get_user_condition(user_id):
    """
    Get or assign a condition for a user.

    Assignment priority:
      0. test_ prefix → pinned condition (researcher testing). Checked FIRST,
         before any cache, so a stale cached row can never mis-route a test
         account (e.g. test_full_001 must always be full_coggen, regardless
         of what an old/seeded cache.db says).
      1. Already assigned (local cache.db) → return it (stable per user).
      2. Firebase permuted-block randomization → EXACT balance across the
         four cells (shared counter, concurrency-safe).
      3. Fallback (Firebase unavailable) → deterministic md5 hash, which is
         only approximately balanced.

    Conditions:
    - "control": No directed learning, just video + chat
    - "quiz": Quiz-directed learning
    - "fixed_cogapp": CogApp with fixed order (no student model)
    - "full_coggen": Full system with adaptivity (default/current)

    Returns: condition string
    """
    initialze_database()
    conditions = ["control", "quiz", "fixed_cogapp", "full_coggen"]

    # 0. Test users: pinned condition by prefix — checked BEFORE the cache so
    #    test accounts are immune to any stale/seeded user_conditions row.
    test_prefixes = {
        "test_control": "control",
        "test_quiz": "quiz",
        "test_fixed": "fixed_cogapp",
        "test_full": "full_coggen",
    }
    for prefix, cond in test_prefixes.items():
        if user_id.startswith(prefix):
            return cond

    conn = sqlite3.connect("cache.db")
    c = conn.cursor()

    # 1. Already assigned for this (real) user → stable, return it.
    c.execute("SELECT condition FROM user_conditions WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    if row:
        condition = row[0]
        conn.close()
        return condition

    condition = None

    # 2. Real participants: exact-balance assignment via Firebase.
    if condition is None:
        condition = firebase_logger.assign_condition_balanced(user_id, conditions)

    # 4. Fallback if Firebase is unavailable: deterministic hash (approximate
    #    balance only). Logged so you can spot it in the server output.
    if condition is None:
        hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        condition = conditions[hash_val % len(conditions)]
        print(
            f"⚠️  Firebase unavailable; fell back to HASH assignment for "
            f"'{user_id}' (balance not guaranteed)."
        )

    # Cache locally so repeat lookups for this user are fast and stable.
    c.execute(
        "INSERT INTO user_conditions (user_id, condition) VALUES (?, ?)",
        (user_id, condition),
    )
    conn.commit()
    conn.close()

    print(f"Assigned condition '{condition}' to user '{user_id}'")
    return condition


# ---------------------------------------------------------------------------
# Survey completion codes.
#
# Each Qualtrics survey shows a secret completion code on its end-of-survey
# page. The participant types that code into Tutorly, and we verify it here
# against survey_codes.json before marking the pre-/post-test as complete.
# The file lives server-side only (next to cache.db in the user's home dir,
# same deployment pattern as concept_tags.json) so the codes never reach the
# frontend bundle. Hot-reloaded via mtime, so codes can be rotated mid-study
# without a restart. Expected shape:
#
#   {
#     "pretest": "TUTORLY-PRE-XXXX",
#     "posttest": {"1": "TUTORLY-P1-XXXX", "2": "...", "3": "..."}
#   }
#
# Post-test codes are keyed by questionnaire ID (the Latin-square slot, same
# key as POSTTEST_QUALTRICS_URLS), since each questionnaire is its own survey.
# Checked in order; the first file that exists wins. The central /etc path
# is preferred on the server: one copy for all participants (rotation is a
# single edit) and it doesn't appear in anyone's JupyterLab file browser the
# way a home-directory file would. The CWD path is for local development.
_SURVEY_CODES_PATHS = [
    "/etc/tutorly/survey_codes.json",
    "survey_codes.json",
]
_survey_codes_cache: dict = {}
_survey_codes_key = None  # (path, mtime) of the currently loaded file


def _load_survey_codes() -> dict:
    """Load survey_codes.json from disk, with hot-reload via mtime check."""
    global _survey_codes_cache, _survey_codes_key
    path = mtime = None
    for candidate in _SURVEY_CODES_PATHS:
        try:
            mtime = os.path.getmtime(candidate)
            path = candidate
            break
        except OSError:
            continue
    if path is None:
        _survey_codes_cache = {}
        _survey_codes_key = None
        return _survey_codes_cache
    if (path, mtime) != _survey_codes_key:
        try:
            with open(path) as f:
                _survey_codes_cache = json.load(f) or {}
            _survey_codes_key = (path, mtime)
            print(f"Loaded survey codes from {path}")
        except (OSError, ValueError) as exc:
            print(f"Warning: could not read {path}: {exc}")
            _survey_codes_cache = {}
            _survey_codes_key = None
    return _survey_codes_cache


def _normalize_survey_code(code) -> str:
    return str(code or "").strip().upper()


def verify_survey_code(stage: str, code: str, questionnaire_id=None):
    """Check a participant-entered completion code.

    stage: "pretest" or "posttest" (posttest also needs questionnaire_id).
    Returns (verified: bool, message: str). Fails closed: if survey_codes.json
    is missing or has no code for this stage, nothing verifies.
    """
    codes = _load_survey_codes()
    if not codes:
        return False, (
            "Code verification is not configured on the server. "
            "Please contact the researcher."
        )

    if stage == "pretest":
        expected = codes.get("pretest")
    else:
        expected = (codes.get("posttest") or {}).get(str(questionnaire_id))

    if not expected:
        return False, (
            "No completion code is configured for this survey. "
            "Please contact the researcher."
        )

    if _normalize_survey_code(code) == _normalize_survey_code(expected):
        return True, "Code verified."
    return False, (
        "That code doesn't match. Please copy the completion code shown at "
        "the end of the survey and try again."
    )


def get_pretest_status(user_id):
    """Get pre-test completion status for a user."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()

    c.execute(
        "SELECT latin_order FROM questionnaire_progress WHERE user_id = ?",
        (user_id,),
    )
    if c.fetchone() is None:
        order = get_latin_square_order(user_id)
        c.execute(
            """
            INSERT INTO questionnaire_progress (
                user_id,
                pretest_completed,
                pretest_completed_at,
                latin_order,
                posttest_index,
                completed_videos,
                finished_videos,
                assigned_video_id
            )
            VALUES (?, 0, NULL, ?, 0, '[]', '[]', ?)
            """,
            (user_id, json.dumps(order), get_video_assignment_order(user_id)[0]),
        )
        conn.commit()

    c.execute(
        "SELECT pretest_completed, pretest_completed_at FROM questionnaire_progress WHERE user_id = ?",
        (user_id,),
    )
    row = c.fetchone()
    conn.close()

    if row is None:
        return {"pretestCompleted": False, "pretestCompletedAt": None}

    return {
        "pretestCompleted": bool(row[0]),
        "pretestCompletedAt": row[1],
    }


def mark_pretest_complete(user_id):
    """Mark pre-test as completed for a user."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    completed_at = datetime.datetime.utcnow().isoformat()
    order = get_latin_square_order(user_id)
    c.execute(
        """
        INSERT INTO questionnaire_progress (
            user_id,
            pretest_completed,
            pretest_completed_at,
            latin_order,
            posttest_index,
            completed_videos,
            finished_videos,
            assigned_video_id
        )
        VALUES (?, 1, ?, ?, 0, '[]', '[]', ?)
        ON CONFLICT(user_id)
        DO UPDATE SET
            pretest_completed = 1,
            pretest_completed_at = excluded.pretest_completed_at,
            latin_order = COALESCE(questionnaire_progress.latin_order, excluded.latin_order),
            posttest_index = COALESCE(questionnaire_progress.posttest_index, 0),
            completed_videos = COALESCE(questionnaire_progress.completed_videos, '[]'),
            finished_videos = COALESCE(questionnaire_progress.finished_videos, '[]'),
            assigned_video_id = COALESCE(questionnaire_progress.assigned_video_id, excluded.assigned_video_id)
        """,
        (
            user_id,
            completed_at,
            json.dumps(order),
            get_video_assignment_order(user_id)[0],
        ),
    )
    conn.commit()
    conn.close()
    return {"pretestCompleted": True, "pretestCompletedAt": completed_at}


def get_latin_square_order(user_id):
    """Assign one of 3 Latin-square orders deterministically for the 3 post-tests."""
    base_order = [1, 2, 3]
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    shift = hash_val % len(base_order)
    return base_order[shift:] + base_order[:shift]


def get_video_assignment_order(user_id):
    """Assign one of 3 video orders deterministically for counterbalancing."""
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    shift = hash_val % len(STUDY_VIDEO_IDS)
    return STUDY_VIDEO_IDS[shift:] + STUDY_VIDEO_IDS[:shift]


def get_or_create_questionnaire_progress(user_id):
    """Load questionnaire progress and initialize a row if missing."""
    initialze_database()
    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        """
        SELECT pretest_completed, pretest_completed_at, latin_order, posttest_index, completed_videos, finished_videos, assigned_video_id
        FROM questionnaire_progress
        WHERE user_id = ?
        """,
        (user_id,),
    )
    row = c.fetchone()

    if row is None:
        latin_order = get_latin_square_order(user_id)
        c.execute(
            """
            INSERT INTO questionnaire_progress (
                user_id,
                pretest_completed,
                pretest_completed_at,
                latin_order,
                posttest_index,
                completed_videos,
                finished_videos,
                assigned_video_id
            )
            VALUES (?, 0, NULL, ?, 0, '[]', '[]', ?)
            """,
            (user_id, json.dumps(latin_order), get_video_assignment_order(user_id)[0]),
        )
        conn.commit()
        progress = {
            "pretest_completed": False,
            "pretest_completed_at": None,
            "latin_order": latin_order,
            "posttest_index": 0,
            "completed_videos": [],
            "finished_videos": [],
            "assigned_video_id": get_video_assignment_order(user_id)[0],
        }
    else:
        latin_order = (
            ast.literal_eval(row[2]) if row[2] else get_latin_square_order(user_id)
        )
        raw_completed_videos = ast.literal_eval(row[4]) if row[4] else []
        raw_finished_videos = ast.literal_eval(row[5]) if row[5] else []
        completed_videos = normalize_video_id_list(raw_completed_videos)
        finished_videos = normalize_video_id_list(raw_finished_videos)
        assigned_video_id = normalize_video_id(row[6])
        if not finished_videos and completed_videos:
            # Backfill legacy rows where only completed_videos existed.
            finished_videos = completed_videos.copy()

        if (
            completed_videos != raw_completed_videos
            or finished_videos != raw_finished_videos
            or assigned_video_id != row[6]
        ):
            c.execute(
                """
                UPDATE questionnaire_progress
                SET completed_videos = ?, finished_videos = ?, assigned_video_id = ?
                WHERE user_id = ?
                """,
                (
                    json.dumps(completed_videos),
                    json.dumps(finished_videos),
                    assigned_video_id,
                    user_id,
                ),
            )
            conn.commit()

        progress = {
            "pretest_completed": bool(row[0]),
            "pretest_completed_at": row[1],
            "latin_order": latin_order,
            "posttest_index": row[3] or 0,
            "completed_videos": completed_videos,
            "finished_videos": finished_videos,
            "assigned_video_id": assigned_video_id,
        }

    conn.close()
    return progress


def get_assigned_video_for_user(user_id):
    """Get the next uncompleted assigned video for a user."""
    progress = get_or_create_questionnaire_progress(user_id)
    video_order = get_video_assignment_order(user_id)
    completed_videos = set(progress["completed_videos"])

    next_video_id = next(
        (video for video in video_order if video not in completed_videos), None
    )
    study_completed = next_video_id is None

    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "UPDATE questionnaire_progress SET assigned_video_id = ? WHERE user_id = ?",
        (next_video_id, user_id),
    )
    conn.commit()
    conn.close()

    return {
        "videoId": next_video_id,
        "studyCompleted": study_completed,
        "videoOrder": video_order,
        "completedVideos": list(completed_videos),
    }


def mark_video_finished(user_id, video_id):
    """Mark that a user has finished watching a full video session."""
    video_id = normalize_video_id(video_id)
    progress = get_or_create_questionnaire_progress(user_id)
    finished_videos = progress["finished_videos"]

    if video_id and video_id not in finished_videos:
        finished_videos.append(video_id)

    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        "UPDATE questionnaire_progress SET finished_videos = ? WHERE user_id = ?",
        (json.dumps(finished_videos), user_id),
    )
    conn.commit()
    conn.close()

    return {"finishedVideos": finished_videos}


def get_study_progress(user_id):
    """Get current study progress for dialog display and resume actions."""
    progress = get_or_create_questionnaire_progress(user_id)
    video_order = get_video_assignment_order(user_id)
    finished_videos = progress["finished_videos"]
    completed_videos = progress["completed_videos"]
    pending_video_id = next(
        (video for video in finished_videos if video not in completed_videos), None
    )
    has_pending_posttest = (
        pending_video_id is not None and progress["posttest_index"] < 3
    )
    pending_posttest_id = (
        progress["latin_order"][progress["posttest_index"]]
        if has_pending_posttest
        else None
    )

    return {
        "pretestCompleted": progress["pretest_completed"],
        "videoOrder": video_order,
        "finishedVideos": finished_videos,
        "completedVideos": completed_videos,
        "posttestIndex": progress["posttest_index"],
        "latinOrder": progress["latin_order"],
        "pendingPosttest": {
            "available": has_pending_posttest,
            "questionnaireId": pending_posttest_id,
            "videoId": pending_video_id,
        },
        "studyCompleted": progress["posttest_index"] >= 3,
    }


def get_next_posttest_for_user(user_id, video_id):
    """Return the next post-test for a finished video session (if applicable)."""
    video_id = normalize_video_id(video_id)
    progress = get_or_create_questionnaire_progress(user_id)
    completed_videos = progress["completed_videos"]

    if video_id in completed_videos:
        return {
            "available": False,
            "alreadyCompletedVideo": True,
            "completedCount": len(completed_videos),
            "nextQuestionnaireId": None,
            "orderPosition": None,
        }

    if progress["posttest_index"] >= 3:
        return {
            "available": False,
            "alreadyCompletedVideo": False,
            "completedCount": len(completed_videos),
            "nextQuestionnaireId": None,
            "orderPosition": None,
        }

    questionnaire_id = progress["latin_order"][progress["posttest_index"]]
    return {
        "available": True,
        "alreadyCompletedVideo": False,
        "completedCount": len(completed_videos),
        "nextQuestionnaireId": questionnaire_id,
        "orderPosition": progress["posttest_index"] + 1,
    }


def mark_posttest_complete(user_id, video_id):
    """Mark a video as completed and advance post-test position once."""
    video_id = normalize_video_id(video_id)
    progress = get_or_create_questionnaire_progress(user_id)
    completed_videos = progress["completed_videos"]
    finished_videos = progress["finished_videos"]

    if video_id and video_id not in finished_videos:
        finished_videos.append(video_id)

    if video_id not in completed_videos:
        completed_videos.append(video_id)
        next_index = min(progress["posttest_index"] + 1, 3)
    else:
        next_index = progress["posttest_index"]

    conn = sqlite3.connect("cache.db")
    c = conn.cursor()
    c.execute(
        """
        UPDATE questionnaire_progress
        SET posttest_index = ?, completed_videos = ?, finished_videos = ?
        WHERE user_id = ?
        """,
        (
            next_index,
            json.dumps(completed_videos),
            json.dumps(finished_videos),
            user_id,
        ),
    )
    conn.commit()
    conn.close()

    return {
        "posttestIndex": next_index,
        "completedVideos": completed_videos,
    }


class GetConditionHandler(APIHandler):
    """Handler to get a user's assigned condition"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")

        condition = get_user_condition(user_id)

        self.finish(json.dumps({"userId": user_id, "condition": condition}))


class SetConditionHandler(APIHandler):
    """Handler to manually set a user's condition (for testing or manual assignment)"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        condition = data.get("condition", "full_coggen")

        # Validate condition
        valid_conditions = ["control", "quiz", "fixed_cogapp", "full_coggen"]
        if condition not in valid_conditions:
            self.set_status(400)
            self.finish(
                json.dumps(
                    {"error": f"Invalid condition. Must be one of: {valid_conditions}"}
                )
            )
            return

        conn = sqlite3.connect("cache.db")
        c = conn.cursor()

        # Insert or update condition
        c.execute(
            """
            INSERT INTO user_conditions (user_id, condition)
            VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET condition = ?
        """,
            (user_id, condition, condition),
        )

        conn.commit()
        conn.close()

        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "condition": condition,
                    "message": "Condition set successfully",
                }
            )
        )


class GetPretestStatusHandler(APIHandler):
    """Handler to get a user's pre-test completion status"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")

        status = get_pretest_status(user_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "pretestCompleted": status["pretestCompleted"],
                    "pretestCompletedAt": status["pretestCompletedAt"],
                }
            )
        )


class MarkPretestCompleteHandler(APIHandler):
    """Handler to mark a user's pre-test as complete.

    Requires the completion code shown at the end of the Qualtrics pre-test;
    the pre-test is only marked complete when the code verifies. Every attempt
    (pass or fail) is logged to Firebase for offline auditing against the
    actual Qualtrics responses.
    """

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        session_id = data.get("sessionId", "login")
        code = data.get("code", "")

        verified, message = verify_survey_code("pretest", code)

        firebase_logger.log_interaction(
            user_id=user_id,
            session_id=session_id,
            interaction_type="survey_code_attempt",
            interaction_data={
                "stage": "pretest",
                "code_entered": _normalize_survey_code(code),
                "verified": verified,
            },
        )

        if not verified:
            self.finish(
                json.dumps(
                    {
                        "userId": user_id,
                        "verified": False,
                        "pretestCompleted": False,
                        "message": message,
                    }
                )
            )
            return

        status = mark_pretest_complete(user_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "verified": True,
                    "pretestCompleted": status["pretestCompleted"],
                    "pretestCompletedAt": status["pretestCompletedAt"],
                    "message": "Pre-test completion recorded",
                }
            )
        )


class GetAssignedVideoHandler(APIHandler):
    """Handler to get user's backend-assigned video id"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        assignment = get_assigned_video_for_user(user_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    **assignment,
                }
            )
        )


class MarkVideoFinishedHandler(APIHandler):
    """Handler to mark a full video learning session as finished"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        video_id = data.get("videoId", "")

        status = mark_video_finished(user_id, video_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "videoId": video_id,
                    "message": "Video completion recorded",
                    **status,
                }
            )
        )


class GetStudyProgressHandler(APIHandler):
    """Handler to retrieve study progress for UserIDDialog"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        status = get_study_progress(user_id)
        self.finish(json.dumps({"userId": user_id, **status}))


class GetNextPosttestHandler(APIHandler):
    """Handler to get the next post-test after finishing a video session"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        video_id = data.get("videoId", "")

        status = get_next_posttest_for_user(user_id, video_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "videoId": video_id,
                    **status,
                }
            )
        )


class MarkPosttestCompleteHandler(APIHandler):
    """Handler to mark post-test completion for a finished video session.

    Requires the completion code from the end of the assigned post-test
    survey. The server itself determines which questionnaire is pending
    (latin_order[posttest_index]), so the code is always checked against the
    survey the participant was actually assigned. Attempts are logged to
    Firebase for auditing.
    """

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        video_id = data.get("videoId", "")
        session_id = data.get("sessionId", "login")
        code = data.get("code", "")

        progress = get_or_create_questionnaire_progress(user_id)
        already_completed = normalize_video_id(video_id) in progress["completed_videos"]

        if already_completed:
            # Idempotent: re-confirming an already-recorded post-test is fine.
            self.finish(
                json.dumps(
                    {
                        "userId": user_id,
                        "videoId": video_id,
                        "verified": True,
                        "message": "Post-test already recorded",
                        "posttestIndex": progress["posttest_index"],
                        "completedVideos": progress["completed_videos"],
                    }
                )
            )
            return

        if progress["posttest_index"] >= 3:
            self.finish(
                json.dumps(
                    {
                        "userId": user_id,
                        "videoId": video_id,
                        "verified": False,
                        "message": "All post-tests are already recorded.",
                    }
                )
            )
            return

        questionnaire_id = progress["latin_order"][progress["posttest_index"]]
        verified, message = verify_survey_code("posttest", code, questionnaire_id)

        firebase_logger.log_interaction(
            user_id=user_id,
            session_id=session_id,
            interaction_type="survey_code_attempt",
            interaction_data={
                "stage": "posttest",
                "questionnaire_id": questionnaire_id,
                "code_entered": _normalize_survey_code(code),
                "verified": verified,
            },
            video_id=video_id,
        )

        if not verified:
            self.finish(
                json.dumps(
                    {
                        "userId": user_id,
                        "videoId": video_id,
                        "verified": False,
                        "message": message,
                    }
                )
            )
            return

        status = mark_posttest_complete(user_id, video_id)
        self.finish(
            json.dumps(
                {
                    "userId": user_id,
                    "videoId": video_id,
                    "verified": True,
                    "message": "Post-test completion recorded",
                    **status,
                }
            )
        )


class LogSessionStartHandler(APIHandler):
    """Handler for logging session start to Firebase"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")
        video_id = data.get("videoId", None)

        # Get user's condition and log it
        condition = get_user_condition(user_id)

        # Log session start to Firebase
        firebase_logger.log_session_start(
            user_id=user_id,
            session_id=session_id,
            user_metadata={
                "video_id": video_id,
                "condition": condition,
                "start_timestamp": firebase_logger.get_timestamp(),
            },
        )

        self.finish(json.dumps({"status": "success", "message": "Session logged"}))


class LogSessionEndHandler(APIHandler):
    """Handler for logging session end to Firebase (Gap 2: time-on-task).

    Fires when the participant finishes a video or leaves the page. Records
    end_time so a session's duration is start_time..end_time. Because a
    session_id is minted per page load, one video ("learning session" in the
    protocol) can span several sessions across a resume — the analyst
    reconciles them by video_id (stamped on every session's user_metadata),
    summing the per-session durations. `reason` distinguishes a clean finish
    from a page-close so partial/idle sessions can be filtered.
    """

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")
        video_id = data.get("videoId", None)
        reason = data.get("reason", "unload")

        firebase_logger.log_session_end(
            user_id=user_id,
            session_id=session_id,
            session_summary={
                "video_id": video_id,
                "reason": reason,
                "end_timestamp": firebase_logger.get_timestamp(),
            },
        )

        self.finish(
            json.dumps({"status": "success", "message": "Session end logged"})
        )


class LogCodeExecutionHandler(APIHandler):
    """Handler for logging code execution to Firebase"""

    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        user_id = data.get("userId", "unknown")
        session_id = data.get("sessionId", "unknown")
        code = data.get("code", "")
        cell_type = data.get("cellType", "code")
        execution_status = data.get("status", "success")
        output = data.get("output", None)
        error = data.get("error", None)
        execution_time = data.get("executionTime", None)
        video_id = data.get("videoId", None)
        segment_index = data.get("segmentIndex", None)

        # Log code execution to Firebase
        firebase_logger.log_code_execution(
            user_id=user_id,
            session_id=session_id,
            code=code,
            cell_type=cell_type,
            execution_status=execution_status,
            output=output,
            error=error,
            execution_time=execution_time,
            video_id=video_id,
            segment_index=segment_index,
        )

        self.finish(
            json.dumps({"status": "success", "message": "Code execution logged"})
        )


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

    # Add route for logging session start to Firebase
    log_session_pattern = url_path_join(
        base_url, "jlab_ext_example", "log_session_start"
    )
    handlers = [(log_session_pattern, LogSessionStartHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for logging session end to Firebase
    log_session_end_pattern = url_path_join(
        base_url, "jlab_ext_example", "log_session_end"
    )
    handlers = [(log_session_end_pattern, LogSessionEndHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for logging code execution to Firebase
    log_code_pattern = url_path_join(base_url, "jlab_ext_example", "log_code_execution")
    handlers = [(log_code_pattern, LogCodeExecutionHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for getting user's experimental condition
    get_condition_pattern = url_path_join(base_url, "jlab_ext_example", "get_condition")
    handlers = [(get_condition_pattern, GetConditionHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for manually setting user's condition (for testing)
    set_condition_pattern = url_path_join(base_url, "jlab_ext_example", "set_condition")
    handlers = [(set_condition_pattern, SetConditionHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for checking pre-test completion status
    get_pretest_status_pattern = url_path_join(
        base_url, "jlab_ext_example", "get_pretest_status"
    )
    handlers = [(get_pretest_status_pattern, GetPretestStatusHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for marking pre-test completion
    mark_pretest_complete_pattern = url_path_join(
        base_url, "jlab_ext_example", "mark_pretest_complete"
    )
    handlers = [(mark_pretest_complete_pattern, MarkPretestCompleteHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for backend-assigned study video id
    get_assigned_video_pattern = url_path_join(
        base_url, "jlab_ext_example", "get_assigned_video"
    )
    handlers = [(get_assigned_video_pattern, GetAssignedVideoHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for marking video completion before post-test
    mark_video_finished_pattern = url_path_join(
        base_url, "jlab_ext_example", "mark_video_finished"
    )
    handlers = [(mark_video_finished_pattern, MarkVideoFinishedHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for study progress summary in UserIDDialog
    get_study_progress_pattern = url_path_join(
        base_url, "jlab_ext_example", "get_study_progress"
    )
    handlers = [(get_study_progress_pattern, GetStudyProgressHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for retrieving next post-test assignment
    get_next_posttest_pattern = url_path_join(
        base_url, "jlab_ext_example", "get_next_posttest"
    )
    handlers = [(get_next_posttest_pattern, GetNextPosttestHandler)]
    web_app.add_handlers(host_pattern, handlers)

    # Add route for marking post-test completion
    mark_posttest_complete_pattern = url_path_join(
        base_url, "jlab_ext_example", "mark_posttest_complete"
    )
    handlers = [(mark_posttest_complete_pattern, MarkPosttestCompleteHandler)]
    web_app.add_handlers(host_pattern, handlers)
