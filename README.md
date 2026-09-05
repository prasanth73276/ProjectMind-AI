# ProjectMind AI

ProjectMind AI is an AI-powered platform for final-year students. It turns skills and interests into practical project ideas and helps students plan, compare, build, document, and present their final-year projects.

## Features

- Generate 3 personalized project ideas
- Recommend technologies, features, roadmaps, and advanced improvements
- Student signup/login with hashed passwords
- Student profile with skills and interests
- Account-based saved projects
- Compare saved projects
- AI Project Mentor with personalized context and fallback guidance
- Project Workspace for architecture, modules, database, APIs, datasets, roadmap, testing, documentation, viva questions, and future scope
- AI Documentation Generator for full reports, abstracts, SRS, methodology, modules, testing, and conclusion/future scope
- Viva & Interview Preparation with Study Mode and Mock Viva Mode
- Difficulty-based viva practice with 5, 10, or 15 questions
- AI evaluation of mock-viva answers with score, strengths, missing points, ideal answer, and improvement tip
- Print generated documentation or save it as PDF from the browser
- SQLite database with no separate database server
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

Start the API:
```bash
python app.py
```

The API runs at `http://localhost:5000` and creates `backend/projectmind.db` on first start. The database is intentionally ignored by Git because it contains local account/project data.

## Run the Frontend

From another terminal, run:

```bash
cd frontend
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

**Important:** serve the `frontend` folder with an HTTP server rather than opening `index.html` directly with `file://`, because the application communicates with the Flask API using browser requests and session cookies.

## Main User Flow

1. Create an account or log in.
2. Add your skills and interests to your profile.
3. Generate project ideas.
4. Save promising projects.
5. Open **Workspace** to build a detailed technical blueprint.
6. Open **Docs** to generate report content such as an abstract, SRS, methodology, testing chapter, or full report draft.
7. Open **Viva** to practice project-specific viva/interview questions in Study Mode or Mock Viva Mode.
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

The backend uses the OpenAI Responses API when an API key is configured. The Responses API can generate text or JSON and supports structured output formats, which is useful for reliable application data. Keep `OPENAI_MODEL` aligned with a model available to your API account.

## Security Notes

- Never commit a real API key or production secret.
- `.env` files and `backend/projectmind.db` are ignored by Git.
- Passwords are stored as hashes rather than plaintext.
- Generated academic content is a draft and should be reviewed for correctness, citations, datasets, results, and institution-specific formatting before submission.

## Submission Checklist

- [x] Public GitHub repository with clear README
- [x] Frontend and backend separated into clear folders
- [x] Student authentication and saved-project workflow
- [x] AI project generation and mentor functionality
- [x] Project workspace and documentation generator
- [x] Viva and interview preparation module
- [x] Environment example without real secrets
- [x] Local database excluded from Git
- [x] Basic run instructions included

## Project Status

ProjectMind AI is organized as a final-year project prototype suitable for demonstration and academic submission. AI-generated project ideas, documentation, and viva answers should be reviewed and customized before being used in an official academic submission.
