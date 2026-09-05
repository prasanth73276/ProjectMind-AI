# ProjectMind AI

ProjectMind AI is an AI-powered platform for final-year students. It generates project ideas from a student's skills and interests, then recommends technologies, features, a development roadmap, and advanced improvements.

## Features
- Generate 3 personalized project ideas with OpenAI
- Recommend suitable technologies
- Suggest project features
- Create a development roadmap
- Suggest advanced improvements
- Includes a fallback generator when no OpenAI key is configured

## Project Structure

```text
ProjectMind-AI/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

## Run the Backend

```bash
cd backend
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Optional AI configuration:

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `OPENAI_API_KEY` to your API key.
3. Set `OPENAI_MODEL` to a model available in your API account.
4. Export the variables in your terminal before starting Flask.

Start the API:
```bash
python app.py
```

The API runs at `http://localhost:5000`.

## Run the Frontend

From the `frontend` folder, use a simple local server, for example:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

> Never commit a real API key. The `.gitignore` file excludes `.env` files.

## OpenAI Integration

The backend uses the OpenAI Responses API for AI-generated project recommendations when `OPENAI_API_KEY` is configured. See the official OpenAI API documentation for current model and API details.
