# ProjectMind AI

ProjectMind AI is an AI-powered platform for final-year students. It generates project ideas from a student's skills and interests, then recommends technologies, features, a development roadmap, and advanced improvements.

## Features
- Generate 3 personalized project ideas with OpenAI
- Recommend suitable technologies
- Suggest project features
- Create a development roadmap
- Suggest advanced improvements
- Includes a fallback generator when no OpenAI key is configured
- Health endpoint to verify API status

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

### Enable AI

Copy `backend/.env.example` to `backend/.env`, then set your OpenAI API key and model. Load those environment variables in your terminal before starting Flask.

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="your_api_key"
$env:OPENAI_MODEL="gpt-5.6-luna"
```

macOS/Linux:
```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_MODEL="gpt-5.6-luna"
```

Start the API:
```bash
python app.py
```

The API runs at `http://localhost:5000`.

Check the API:
```text
http://localhost:5000/api/health
```

## Run the Frontend

From the `frontend` folder:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

> Never commit a real API key. The `.gitignore` file excludes `.env` files.

## OpenAI Integration

The backend uses the OpenAI Responses API for AI-generated project recommendations when `OPENAI_API_KEY` is configured. The model is configurable through `OPENAI_MODEL`; keep this value aligned with a model available to your API account. See the official OpenAI documentation for current model/API details.
