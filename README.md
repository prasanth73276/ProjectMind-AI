# ProjectMind AI

ProjectMind AI is an AI-powered platform for final-year students. It turns skills and interests into practical project ideas and helps students plan, compare, build, document, and present their final-year projects.

## Features

- Generate 3 personalized project ideas
- Recommend technologies, features, roadmaps, and advanced improvements
- Student signup/login with hashed passwords
- Student profile with skills and interests
- Account-based saved projects and comparison
- AI Project Mentor with personalized context and fallback guidance
- Project Workspace for architecture, modules, database, APIs, datasets, roadmap, testing, documentation, viva questions, and future scope
- AI Documentation Generator for reports, abstracts, SRS, methodology, modules, testing, and conclusion/future scope
- Viva & Interview Preparation with Study Mode and Mock Viva Mode
- Difficulty-based viva practice with 5, 10, or 15 questions
- AI evaluation of mock-viva answers with score, strengths, missing points, ideal answer, and improvement tip
- Print generated documentation or save it as PDF from the browser
- SQLite database with no separate database server
- Production-ready single-service deployment configuration for Render
- Health endpoint for API status

## Project Structure

```text
ProjectMind-AI/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── workspace.html
│   ├── documentation.html
│   └── viva.html
├── backend/
│   ├── app.py
│   ├── mentor.py
│   ├── requirements.txt
│   └── .env.example
├── render.yaml
├── .gitignore
└── README.md
```

## Run Locally

### Backend

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

Copy `backend/.env.example` to `backend/.env` and add your own values. Never commit a real API key or production secret.

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="your_api_key"
$env:OPENAI_MODEL="your_available_model"
$env:SECRET_KEY="use_a_long_random_secret"
```

macOS/Linux:
```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_MODEL="your_available_model"
export SECRET_KEY="use_a_long_random_secret"
```

`OPENAI_API_KEY` is optional because the project has local fallback behavior. `SECRET_KEY` should be a long random value for real deployments.

Start the application:
```bash
python app.py
```

Then open `http://localhost:5000`. Flask serves both the frontend and API from the same origin. The SQLite database is created automatically and is ignored by Git.

## Live Deployment

The repository includes `render.yaml` and Gunicorn configuration for a single public Flask web service. Render supports deploying Flask applications from a Git repository with a build command, start command, health check, and public `onrender.com` URL. citeturn0search0turn0search1

### Render settings

```text
Service type: Web Service
Root directory: backend
Build command: pip install -r requirements.txt
Start command: gunicorn app:app --bind 0.0.0.0:$PORT
Health check: /api/health
```

Environment variables:

```text
SECRET_KEY=<generate a long random secret>
SESSION_COOKIE_SECURE=1
OPENAI_API_KEY=<your OpenAI API key, optional>
OPENAI_MODEL=<a model available to your API account>
```

The `render.yaml` file contains these deployment settings so the repository is ready to connect to Render. A real OpenAI key should be entered as a hosting secret, not committed to Git.

## Main User Flow

1. Create an account or log in.
2. Add your skills and interests to your profile.
3. Generate project ideas.
4. Save promising projects.
5. Open **Workspace** to build a detailed technical blueprint.
6. Open **Docs** to generate report content.
7. Open **Viva** to practice project-specific viva/interview questions.
8. Use **AI Mentor** for project-specific questions and guidance.

## API Endpoints

- `GET /api/health` — API status
- `POST /api/generate` — generate project ideas
- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — log in
- `POST /api/auth/logout` — log out
- `GET /api/auth/me` — current account
- `PUT /api/profile` — update student profile
- `GET /api/saved` — list saved projects
- `POST /api/saved` — save a project
- `DELETE /api/saved` — remove a project
- `POST /api/mentor` — personalized AI mentor response

## OpenAI Integration

The backend uses the OpenAI Responses API when an API key is configured. The Responses API supports text and JSON responses and structured output formats for reliable application data. Keep `OPENAI_MODEL` aligned with a model available to your API account. citeturn0search0turn0search2

## Security Notes

- Never commit a real API key or production secret.
- `.env` files and `backend/projectmind.db` are ignored by Git.
- Passwords are stored as hashes rather than plaintext.
- Generated academic content is a draft and should be reviewed for correctness, citations, datasets, results, and institution-specific formatting.

## Submission Checklist

- [x] Public GitHub repository with clear README
- [x] Responsive frontend
- [x] Flask backend and REST API
- [x] Authentication and password hashing
- [x] SQLite persistence
- [x] AI project generation with fallback behavior
- [x] Saved projects and comparison
- [x] AI Mentor
- [x] Project Workspace
- [x] Documentation Generator
- [x] Viva & Interview Preparation
- [x] Production deployment configuration
- [x] Environment-variable protection

## Project Status

ProjectMind AI is organized as a final-year project prototype ready for demonstration, hosting, and academic submission. AI-generated content should be reviewed and customized before official submission.
