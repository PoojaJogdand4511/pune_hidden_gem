import os
import urllib.parse
from typing import Optional

import streamlit as st
import requests

# Configuration: adjust if backend is remote
BACKEND_URL_DEFAULT = "http://localhost:5000"
BACKEND_URL = os.environ.get("BACKEND_URL", BACKEND_URL_DEFAULT).rstrip("/")

st.set_page_config(
    page_title="Mental Detox",
    page_icon="🧠",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# Custom CSS for cleaner, mobile-friendly design
st.markdown(
    """
    <style>
    .main > div {
        max-width: 800px; margin-left: auto; margin-right: auto;
    }
    .stButton>button {
        width: 100%; border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600;
    }
    .card { padding: 1rem 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; }
    .muted { color: #6b7280; }
    .quote { font-size: 1.25rem; line-height: 1.6; }
    .reference { font-size: 0.95rem; }
    .tip { font-size: 1.05rem; }
    </style>
    """,
    unsafe_allow_html=True,
)


def fetch_issues() -> list[str]:
    try:
        resp = requests.get(f"{BACKEND_URL}/issues", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("issues", [])
    except Exception:
        return []


def fetch_random_entry(issue: str) -> Optional[dict]:
    try:
        params = {"issue": issue}
        resp = requests.get(f"{BACKEND_URL}/get_data", params=params, timeout=10)
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception:
        return None


def extract_youtube_id(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.netloc in {"youtu.be"}:
            return parsed.path.lstrip("/") or None
        if parsed.netloc in {"www.youtube.com", "youtube.com", "m.youtube.com"}:
            qs = urllib.parse.parse_qs(parsed.query)
            if "v" in qs and qs["v"]:
                return qs["v"][0]
            # Handle /embed/VIDEO_ID or /shorts/VIDEO_ID
            parts = parsed.path.split("/")
            for i, part in enumerate(parts):
                if part in {"embed", "v", "shorts"} and i + 1 < len(parts):
                    return parts[i + 1]
        return None
    except Exception:
        return None


st.title("🧠 Mental Detox")

st.caption("Select an issue to receive a quote, reference, video, and tip.")

# Load issues once and cache for the session
@st.cache_data(show_spinner=False)
def get_issues_cached():
    return fetch_issues()

issues = get_issues_cached()
if not issues:
    st.error("Could not load issues from the backend. Ensure the Flask API is running.")
    st.stop()

selected_issue = st.selectbox("Choose an issue", options=issues, index=0)

# Container for results
result_container = st.container()

col1, col2 = st.columns(2)
with col1:
    fetch_btn = st.button("Get Another", type="primary")
with col2:
    refresh_issues = st.button("Refresh Issues")

if refresh_issues:
    get_issues_cached.clear()
    issues = get_issues_cached()
    if not issues:
        st.error("Still unable to load issues. Check backend.")
    else:
        st.success("Issues updated.")

if selected_issue and (fetch_btn or "last_issue" not in st.session_state or st.session_state.get("last_issue") != selected_issue):
    st.session_state["last_issue"] = selected_issue
    st.session_state["last_payload"] = fetch_random_entry(selected_issue)

payload = st.session_state.get("last_payload")

with result_container:
    if not payload:
        st.warning("No data found for this issue yet. Try another or click Get Another.")
    else:
        quote = payload.get("quote")
        reference = payload.get("reference")
        video_title = payload.get("video_title")
        video_link = payload.get("video_link")
        tip = payload.get("tip")

        with st.container():
            st.markdown("<div class='card'>", unsafe_allow_html=True)

            if quote:
                st.markdown(f"<div class='quote'>“{quote}”</div>", unsafe_allow_html=True)
            if reference:
                st.markdown(f"<div class='reference muted'>— {reference}</div>", unsafe_allow_html=True)

            st.divider()

            yt_id = extract_youtube_id(video_link)
            if yt_id:
                st.video(f"https://www.youtube.com/watch?v={yt_id}")
                if video_title:
                    st.markdown(f"<div class='muted'>{video_title}</div>", unsafe_allow_html=True)
            else:
                st.info("No valid video available for this entry.")

            st.divider()

            if tip:
                st.markdown(f"<div class='tip'>{tip}</div>", unsafe_allow_html=True)
            else:
                st.info("No tip available for this entry.")

            st.markdown("</div>", unsafe_allow_html=True)