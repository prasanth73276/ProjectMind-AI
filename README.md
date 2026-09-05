# ProjectMind AI

ProjectMind AI is an AI-powered platform for final-year students. It generates project ideas from skills and interests, recommends technologies, features, a development roadmap, and advanced improvements.

## Features
- Generate 3 personalized project ideas with OpenAI
- Fallback generation when no OpenAI key is configured
- Recommend suitable technologies and features
- Create a development roadmap and advanced improvements
- Student signup and login
- Secure password hashing
- Student profile with skills and interests
- Account-based saved projects
- Compare saved projects
- SQLite database for users and projects
- Health endpoint for API status

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

### Configure environment

Copy `backend/.env.example` to `backend/.env`. The current app reads environment variables from the shell, so either load the values with your preferred environment-variable tool or set them directly.

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="your_api_key"
$env:OPENAI_MODEL="gpt-5.6-luna"
$env:SECRET_KEY="use_a_long_random_secret"
```

macOS/Linux:
```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_MODEL="gpt-5.6-luna"
export SECRET_KEY="use_a_long_random_secret"
```

`OPENAI_API_KEY` is optional because the backend has a local fallback generator. `SECRET_KEY` should be set to a long random value for real deployments.

Start the API:
```bash
python app.py
```

The API runs at `http://localhost:5000` and automatically creates `backend/projectmind.db` on first start. SQLite is used because it requires no separate database server and is included with Python; it is suitable for this small project, while a larger deployment can move to another database. citeturn0search0

### Account API
- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — log in
- `POST /api/auth/logout` — log out
- `GET /api/auth/me` — current account
- `PUT /api/profile` — update student profile
- `GET /api/saved` — list saved projects
- `POST /api/saved` — save a project
- `DELETE /api/saved` — remove a project

Flask sessions are used to remember the logged-in user between requests; production deployments should configure a strong secret key. citeturn0search3

## Run the Frontend

From the `frontend` folder:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

> Never commit a real API key or production secret. The `.gitignore` file excludes `.env` files.

## OpenAI Integration

The backend uses the OpenAI Responses API for AI-generated project recommendations when `OPENAI_API_KEY` is configured. The model is configurable through `OPENAI_MODEL`; keep this value aligned with a model available to your API account.
