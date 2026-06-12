#!/usr/bin/env python3
"""
Draft a concept_tags.json file by reading cached knowledge from cache.db
and asking GPT to assign each knowledge item an EDA-grounded concept_id
from a shared vocabulary.

The file the system uses at runtime is `concept_tags.json` (in the working
directory of the running Jupyter server). All knowledge items that get the
same concept_id share one BKT mastery curve, which is how the student model
transfers mastery across videos.

Workflow:
    1. Run the JupyterLab extension once for each study video, far enough
       that the knowledge for each segment is generated and cached in
       cache.db's `knowledge_cache` table.
    2. Run this script:
           OPENAI_API_KEY=sk-... python tools/draft_concept_tags.py \
               --videos 1xsbTs9-a50 EF4A4OtQprg -1x8Kpyndss
       It will write `concept_tags.json` in the current directory.
    3. Open the file, review every tag, edit anything that looks wrong.
    4. The runtime hot-reloads the file on every skill lookup, so changes
       take effect without restarting the server.
"""
from __future__ import annotations

import argparse
import ast
import json
import os
import sqlite3
import sys
import textwrap
from pathlib import Path


# Shared EDA-grounded vocabulary. The LLM is asked to pick from this list
# whenever possible, and may propose new snake_case concept_ids in the same
# pedagogical style only when nothing here fits. Keep this list small enough
# that the model can reason about it (10–20 entries is the sweet spot).
DEFAULT_VOCABULARY = [
    # Data preparation
    "inspect_data_structure",
    "filter_to_meaningful_subset",
    "aggregate_by_group",
    "derive_new_variable",
    "join_related_tables",
    # Visualization
    "choose_appropriate_chart_type",
    "order_categorical_for_readability",
    "decompose_by_category",
    "orient_for_clarity",
    "compare_across_groups",
    "visualize_distribution",
    "visualize_relationship",
    # Interpretation
    "identify_pattern",
    "form_hypothesis",
    "propose_check",
    "spot_outliers_or_anomalies",
]


SYSTEM_PROMPT = textwrap.dedent("""\
    You are helping build a knowledge-component mapping for a student model
    in an EDA (exploratory data analysis) tutoring system.

    The student watches several videos that teach overlapping EDA concepts
    using R + tidyverse. Each video is divided into segments, and each
    segment has 1 or more `knowledge` items (short natural-language
    statements of what the segment teaches).

    Your job: assign each knowledge item a `concept_id` from the shared
    vocabulary below. Items in different videos that teach the *same EDA
    competency* must get the *same* concept_id, even when the R syntax
    differs. Items in concept segments (chart interpretation, no code) get
    interpretation-flavored concept_ids.

    SHARED VOCABULARY (prefer these):
    {vocabulary}

    You may propose a NEW concept_id only when none of the above fits. New
    ids must be lowercase snake_case, EDA-flavored (describe the
    competency, not the R function), and you should reuse your own new
    proposals across items where they apply.

    Output: a JSON object of the form
        {{
          "<video_id>": {{
            "<segment_index>": {{
              "<knowledge_index>": "<concept_id>"
            }}
          }}
        }}
    Do not wrap in ```json``` fences. Include every (video, segment, item)
    triple that appears in the input.
""")


def read_knowledge_cache(db_path: Path, video_ids: list[str]) -> dict:
    """Return {video_id: {segment_index: [knowledge_item, ...]}}."""
    if not db_path.exists():
        sys.exit(f"cache.db not found at {db_path}. Run the extension at least once first.")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    out: dict = {}
    for vid in video_ids:
        c.execute(
            "SELECT segment_index, knowledge FROM knowledge_cache WHERE video_id = ?",
            (vid,),
        )
        rows = c.fetchall()
        if not rows:
            print(f"Warning: no cached knowledge found for video {vid!r}. "
                  f"Run the extension through that video first.")
            continue
        out[vid] = {}
        for seg_idx, knowledge_str in rows:
            try:
                items = ast.literal_eval(knowledge_str)
            except (ValueError, SyntaxError):
                print(f"Warning: could not parse knowledge for {vid} seg {seg_idx}; skipping.")
                continue
            if isinstance(items, str):
                items = [items]
            out[vid][int(seg_idx)] = list(items)
    conn.close()
    return out


def build_user_payload(knowledge_by_video: dict) -> str:
    lines = []
    for vid, segments in knowledge_by_video.items():
        lines.append(f"Video: {vid}")
        for seg_idx in sorted(segments.keys()):
            for ki, item in enumerate(segments[seg_idx]):
                lines.append(f"  ({vid}, segment {seg_idx}, knowledge {ki}): {item}")
        lines.append("")
    return "\n".join(lines)


def call_llm(system_prompt: str, user_payload: str, model: str) -> str:
    try:
        from google import genai  # type: ignore
        from google.genai import types as genai_types  # type: ignore
    except ImportError:
        sys.exit(
            "google-genai not installed. Run "
            "`pip install 'google-genai>=1.0.0'` first."
        )
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit(
            "GEMINI_API_KEY env var not set. "
            "Get a key at https://aistudio.google.com/apikey."
        )
    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model=model,
        contents=user_payload,
        config=genai_types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0,
            response_mime_type="application/json",
        ),
    )
    text = (resp.text or "").strip()
    if text.startswith("```"):
        text = text.removeprefix("```json").removeprefix("```").strip()
        text = text.removesuffix("```").strip()
    return text


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--videos",
        nargs="+",
        required=True,
        help="One or more video IDs to draft tags for.",
    )
    parser.add_argument(
        "--cache-db",
        default="cache.db",
        help="Path to cache.db (default: ./cache.db).",
    )
    parser.add_argument(
        "--out",
        default="concept_tags.json",
        help="Output path (default: ./concept_tags.json).",
    )
    parser.add_argument(
        "--model",
        default="gemini-3.5-flash",
        help="Gemini model to use for tagging (default: gemini-3.5-flash).",
    )
    parser.add_argument(
        "--vocabulary",
        default=None,
        help="Optional path to a JSON file containing a custom vocabulary list "
             "(otherwise the default EDA vocabulary baked into this script is used).",
    )
    args = parser.parse_args()

    if args.vocabulary:
        with open(args.vocabulary) as f:
            vocabulary = json.load(f)
    else:
        vocabulary = DEFAULT_VOCABULARY

    knowledge_by_video = read_knowledge_cache(Path(args.cache_db), args.videos)
    if not knowledge_by_video:
        sys.exit("No knowledge cached for any of the requested videos.")

    user_payload = build_user_payload(knowledge_by_video)
    print(f"Sending {sum(len(s) for v in knowledge_by_video.values() for s in v.values())} "
          f"items across {len(knowledge_by_video)} videos to {args.model}...")
    raw = call_llm(
        SYSTEM_PROMPT.format(vocabulary="\n".join(f"  - {v}" for v in vocabulary)),
        user_payload,
        args.model,
    )

    try:
        tags = json.loads(raw)
    except json.JSONDecodeError as exc:
        sys.exit(
            f"LLM did not return valid JSON. Raw output:\n{raw}\n\nError: {exc}"
        )

    out = {
        "_README": (
            "Concept-tag mapping for the EDA student model. Each entry maps "
            "(video_id -> segment_index -> knowledge_index) to a concept_id. "
            "Items with the same concept_id share BKT mastery across videos. "
            "Edit freely — the runtime hot-reloads this file."
        ),
        "vocabulary": vocabulary,
        "tags": tags,
    }
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Wrote {args.out}. Review the file and edit any tags that look wrong.")


if __name__ == "__main__":
    main()
