# Mental Detox – Flask + Streamlit

A simple full-stack app that serves a mental wellness dataset from a CSV via Flask and displays random entries in a Streamlit UI.

## Project Structure

- `flask_app.py`: Flask API server. Loads `mental_detox_dataset.csv` and exposes endpoints.
- `streamlit_app.py`: Streamlit frontend. Fetches issues and random entries from Flask.
- `requirements.txt`: Python dependencies for both backend and frontend.
- `mental_detox_dataset.csv`: Your dataset. Place this file next to `flask_app.py`.

## CSV Format

Required columns:
- `issue`
- `quote`
- `reference`
- `video_title`
- `video_link`
- `tip`

## Setup

1. Ensure Python 3.9+ is installed.
2. Create and activate a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Ensure `mental_detox_dataset.csv` is present in the same directory as `flask_app.py`.

## Running

Open two terminals (or run them in background processes):

### Backend (Flask on port 5000)
```bash
python flask_app.py
```

- Health check: `GET http://localhost:5000/health`
- List issues: `GET http://localhost:5000/issues`
- Random data by issue: `GET http://localhost:5000/get_data?issue=Anxiety`

### Frontend (Streamlit on port 8501)
```bash
streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0
```

The frontend expects the backend at `http://localhost:5000`. To override, set `BACKEND_URL`:
```bash
BACKEND_URL="http://127.0.0.1:5000" streamlit run streamlit_app.py
```

## Notes

- Random selection is performed per request using `pandas.DataFrame.sample(n=1)`.
- CORS is enabled on all routes for simplicity, allowing access from Streamlit and browsers.
- The app gracefully handles missing video links by showing a helpful message instead of an embedded video.
- If the CSV is missing required columns or is not found, `/issues` will return an error and the frontend will display an error message.

## Troubleshooting

- If Streamlit shows "Could not load issues": ensure Flask is running and accessible, then refresh the issues via the button or reload the page.
- If you run on different hosts/ports: set `BACKEND_URL` environment variable for the frontend accordingly.
- For YouTube links, supported formats include:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
  - `https://www.youtube.com/shorts/VIDEO_ID`

## Production

- Consider running Flask via a production WSGI server (e.g., gunicorn) behind a reverse proxy.
- Disable debug in production (already disabled).
- Add input validation and rate limiting as needed.