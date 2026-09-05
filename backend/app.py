import json
import os
import sqlite3

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from openai import OpenAI
from werkzeug.security import check_password_hash, generate_password_hash

from mentor import mentor_reply

BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.secret_key = os.getenv('SECRET_KEY', 'change-this-development-secret')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', '0') == '1'
CORS(app, supports_credentials=True)

DB_PATH = os.path.join(BASE_DIR, 'projectmind.db')
ALLOWED_DIFFICULTIES = {'Beginner', 'Intermediate', 'Advanced'}
ALLOWED_DURATIONS = {'1-2 months', '3-4 months', '5-6 months'}


def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with db() as connection:
        connection.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            skills TEXT DEFAULT '',
            interests TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS saved_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            project_json TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, title),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ''')


def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    with db() as connection:
        return connection.execute('SELECT id, name, email, skills, interests FROM users WHERE id = ?', (user_id,)).fetchone()


def require_user():
    user = current_user()
    if not user:
        return None, (jsonify({'error': 'login required'}), 401)
    return user, None


def fallback_projects(skills, interests, difficulty, duration):
    stack = [s.strip() for s in skills.split(',') if s.strip()]
    lower_skills = skills.lower()
    if any(word in lower_skills for word in ['python', 'machine learning', 'ml', 'ai']):
        base_technologies = ['Flask', 'scikit-learn', 'PostgreSQL']
    elif 'java' in lower_skills:
        base_technologies = ['Spring Boot', 'MySQL', 'REST API']
    elif any(word in lower_skills for word in ['react', 'javascript', 'html', 'css']):
        base_technologies = ['React', 'Node.js', 'Express', 'MongoDB']
    else:
        base_technologies = ['Python', 'Flask', 'SQLite']
    technologies = list(dict.fromkeys(stack + base_technologies))
    domain = interests.title()
    level = difficulty.lower()
    templates = [
        (f'{domain} Recommendation System', f'A {level}-level {duration} project that recommends useful {domain.lower()} resources, solutions, or next steps based on your skills in {skills}.', ['Personalized recommendations', 'Search and filters', 'User dashboard', 'Recommendation history', 'Feedback collection'], ['Define requirements', 'Design database and API', 'Build frontend', 'Implement recommendation logic', 'Test and deploy'], ['Add an LLM assistant', 'Add authentication', 'Use feedback personalization', 'Add analytics']),
        (f'Smart {domain} Management Platform', f'A practical {level}-level {duration} platform for organizing, tracking, and improving {domain.lower()} workflows using {skills}.', ['Interactive dashboard', 'Create and manage records', 'Progress tracking', 'Reports and export', 'Notifications'], ['Plan user flow', 'Design database', 'Create APIs', 'Build responsive interface', 'Test and deploy'], ['Add real-time updates', 'Add role-based access', 'Add predictive analytics', 'Add cloud monitoring']),
        (f'AI Assistant for {domain}', f'A {level}-level {duration} assistant that helps users solve common {domain.lower()} problems with guided recommendations and intelligent search.', ['AI question answering', 'Suggested actions', 'Knowledge/search module', 'Conversation history', 'Resource links'], ['Collect use cases', 'Design assistant workflow', 'Build API and interface', 'Connect AI layer', 'Evaluate and deploy'], ['Add retrieval-augmented generation', 'Add document upload', 'Add voice interaction', 'Add response analytics'])]
    return [{'title': t, 'description': d, 'technologies': technologies, 'features': f, 'roadmap': r, 'advanced': a} for t, d, f, r, a in templates]


def generate_with_ai(skills, interests, difficulty, duration):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return fallback_projects(skills, interests, difficulty, duration)
    client = OpenAI(api_key=api_key)
    response = client.responses.create(model=os.getenv('OPENAI_MODEL', 'gpt-5.6-luna'), input=[
        {'role': 'system', 'content': 'You are ProjectMind AI, an expert final-year project mentor. Return exactly 3 realistic and distinct project ideas for a college student. Respect difficulty and duration. Return valid JSON only: {"projects":[{"title":"...","description":"...","technologies":["..."],"features":["..."],"roadmap":["..."],"advanced":["..."]}]}.'},
        {'role': 'user', 'content': f'Skills: {skills}\nInterests/domain: {interests}\nDifficulty: {difficulty}\nExpected duration: {duration}'}])
    data = json.loads(response.output_text)
    if not isinstance(data.get('projects'), list) or len(data['projects']) != 3:
        raise ValueError('AI returned an invalid project list')
    return data['projects']


@app.get('/')
def home():
    return app.send_static_file('index.html')


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'ai_enabled': bool(os.getenv('OPENAI_API_KEY'))})


@app.post('/api/auth/signup')
def signup():
    data = request.get_json(silent=True) or {}
    name, email, password = str(data.get('name', '')).strip(), str(data.get('email', '')).strip().lower(), str(data.get('password', ''))
    if len(name) < 2 or len(name) > 80 or '@' not in email or len(email) > 160 or len(password) < 6:
        return jsonify({'error': 'Enter a valid name, email, and password of at least 6 characters.'}), 400
    try:
        with db() as connection:
            cursor = connection.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', (name, email, generate_password_hash(password)))
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({'error': 'An account with this email already exists.'}), 409
    session['user_id'] = user_id
    return jsonify({'message': 'Account created', 'user': {'id': user_id, 'name': name, 'email': email, 'skills': '', 'interests': ''}}), 201


@app.post('/api/auth/login')
def login():
    data = request.get_json(silent=True) or {}
    email, password = str(data.get('email', '')).strip().lower(), str(data.get('password', ''))
    with db() as connection:
        user = connection.execute('SELECT id, name, email, password_hash, skills, interests FROM users WHERE email = ?', (email,)).fetchone()
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password.'}), 401
    session['user_id'] = user['id']
    return jsonify({'message': 'Logged in', 'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'skills': user['skills'], 'interests': user['interests']}})


@app.post('/api/auth/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@app.get('/api/auth/me')
def me():
    user = current_user()
    if not user:
        return jsonify({'user': None})
    return jsonify({'user': dict(user)})


@app.put('/api/profile')
def update_profile():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    name = str(data.get('name', user['name'])).strip()
    skills = str(data.get('skills', user['skills'])).strip()
    interests = str(data.get('interests', user['interests'])).strip()
    if len(name) < 2 or len(name) > 80 or len(skills) > 500 or len(interests) > 300:
        return jsonify({'error': 'Profile values are invalid or too long.'}), 400
    with db() as connection:
        connection.execute('UPDATE users SET name = ?, skills = ?, interests = ? WHERE id = ?', (name, skills, interests, user['id']))
    return jsonify({'message': 'Profile updated'})


@app.get('/api/saved')
def get_saved():
    user, error = require_user()
    if error:
        return error
    with db() as connection:
        rows = connection.execute('SELECT project_json FROM saved_projects WHERE user_id = ? ORDER BY id DESC', (user['id'],)).fetchall()
    return jsonify({'projects': [json.loads(row['project_json']) for row in rows]})


@app.post('/api/saved')
def save_project():
    user, error = require_user()
    if error:
        return error
    project = request.get_json(silent=True) or {}
    title = str(project.get('title', '')).strip()
    if not title or len(title) > 200:
        return jsonify({'error': 'Invalid project.'}), 400
    with db() as connection:
        connection.execute('INSERT OR REPLACE INTO saved_projects (user_id, title, project_json) VALUES (?, ?, ?)', (user['id'], title, json.dumps(project)))
    return jsonify({'message': 'Project saved'})


@app.delete('/api/saved')
def delete_project():
    user, error = require_user()
    if error:
        return error
    title = str((request.get_json(silent=True) or {}).get('title', '')).strip()
    with db() as connection:
        connection.execute('DELETE FROM saved_projects WHERE user_id = ? AND title = ?', (user['id'], title))
    return jsonify({'message': 'Project removed'})


@app.post('/api/mentor')
def mentor():
    user, error = require_user()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    message = str(data.get('message', '')).strip()
    if not message or len(message) > 2000:
        return jsonify({'error': 'Enter a message up to 2000 characters.'}), 400
    with db() as connection:
        rows = connection.execute('SELECT project_json FROM saved_projects WHERE user_id = ? ORDER BY id DESC LIMIT 5', (user['id'],)).fetchall()
    projects = [json.loads(row['project_json']) for row in rows]
    try:
        reply = mentor_reply(message, dict(user), projects)
        return jsonify({'reply': reply})
    except Exception:
        app.logger.exception('Mentor generation failed')
        return jsonify({'error': 'Mentor is temporarily unavailable. Check your API key and backend logs.'}), 500


@app.post('/api/generate')
def generate():
    data = request.get_json(silent=True) or {}
    skills = str(data.get('skills', '')).strip()
    interests = str(data.get('interests', '')).strip()
    difficulty = str(data.get('difficulty', 'Intermediate')).strip()
    duration = str(data.get('duration', '3-4 months')).strip()
    if not skills or not interests:
        return jsonify({'error': 'skills and interests are required'}), 400
    if difficulty not in ALLOWED_DIFFICULTIES or duration not in ALLOWED_DURATIONS:
        return jsonify({'error': 'invalid difficulty or duration'}), 400
    if len(skills) > 500 or len(interests) > 300:
        return jsonify({'error': 'skills or interests are too long'}), 400
    try:
        return jsonify({'projects': generate_with_ai(skills, interests, difficulty, duration)})
    except Exception:
        app.logger.exception('AI generation failed')
        return jsonify({'error': 'AI generation failed. Check your API key, model, and backend logs.'}), 500


init_db()

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', debug=False, port=port)
