import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

from mentor import mentor_reply

BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

ALLOWED_DIFFICULTIES = {'Beginner', 'Intermediate', 'Advanced'}
ALLOWED_DURATIONS = {'1-2 months', '3-4 months', '5-6 months'}


def fallback_projects(skills, interests, difficulty, duration):
    lower_skills = skills.lower()
    if any(word in lower_skills for word in ['python', 'machine learning', 'ml', 'ai']):
        base_technologies = ['Python', 'Flask', 'scikit-learn', 'SQLite']
    elif 'java' in lower_skills:
        base_technologies = ['Java', 'Spring Boot', 'MySQL', 'REST API']
    elif any(word in lower_skills for word in ['react', 'javascript', 'html', 'css']):
        base_technologies = ['React', 'Node.js', 'Express', 'MongoDB']
    else:
        base_technologies = ['Python', 'Flask', 'SQLite']
    domain = interests.title()
    level = difficulty.lower()
    templates = [
        (f'{domain} Recommendation System', f'A {level}-level {duration} project that recommends useful {domain.lower()} resources, solutions, or next steps based on your skills in {skills}.', ['Personalized recommendations', 'Search and filters', 'Interactive dashboard', 'Recommendation history', 'Feedback collection'], ['Define requirements', 'Design database and API', 'Build frontend', 'Implement recommendation logic', 'Test and deploy'], ['Add an LLM assistant', 'Add feedback personalization', 'Add analytics', 'Add cloud deployment']),
        (f'Smart {domain} Management Platform', f'A practical {level}-level {duration} platform for organizing, tracking, and improving {domain.lower()} workflows using {skills}.', ['Interactive dashboard', 'Create and manage records', 'Progress tracking', 'Reports and export', 'Notifications'], ['Plan user flow', 'Design database', 'Create APIs', 'Build responsive interface', 'Test and deploy'], ['Add real-time updates', 'Add role-based access', 'Add predictive analytics', 'Add cloud monitoring']),
        (f'AI Assistant for {domain}', f'A {level}-level {duration} assistant that helps users solve common {domain.lower()} problems with guided recommendations and intelligent search.', ['AI question answering', 'Suggested actions', 'Knowledge/search module', 'Conversation interface', 'Resource links'], ['Collect use cases', 'Design assistant workflow', 'Build API and interface', 'Connect AI layer', 'Evaluate and deploy'], ['Add retrieval-augmented generation', 'Add document upload', 'Add voice interaction', 'Add response analytics'])]
    return [{'title': t, 'description': d, 'technologies': base_technologies, 'features': f, 'roadmap': r, 'advanced': a} for t, d, f, r, a in templates]


def generate_with_ai(skills, interests, difficulty, duration):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return fallback_projects(skills, interests, difficulty, duration)
    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=os.getenv('OPENAI_MODEL', 'gpt-5.6-luna'),
        input=[
            {'role': 'system', 'content': 'You are ProjectMind AI, an expert final-year project mentor. Return exactly 3 realistic and distinct project ideas for a college student. Respect difficulty and duration. Return valid JSON only: {"projects":[{"title":"...","description":"...","technologies":["..."],"features":["..."],"roadmap":["..."],"advanced":["..."]}]}.'},
            {'role': 'user', 'content': f'Skills: {skills}\nInterests/domain: {interests}\nDifficulty: {difficulty}\nExpected duration: {duration}'}
        ]
    )
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


@app.post('/api/mentor')
def mentor():
    data = request.get_json(silent=True) or {}
    message = str(data.get('message', '')).strip()
    if not message or len(message) > 2000:
        return jsonify({'error': 'Enter a message up to 2000 characters.'}), 400
    try:
        reply = mentor_reply(message, {'name': 'Student', 'email': '', 'skills': '', 'interests': ''}, [])
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


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', debug=False, port=port)
