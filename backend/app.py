import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)


def fallback_projects(skills, interests, difficulty, duration):
    stack = [s.strip() for s in skills.split(',') if s.strip()]
    if any(word in skills.lower() for word in ['python', 'machine learning', 'ml', 'ai']):
        technologies = stack + ['Flask', 'scikit-learn', 'PostgreSQL']
    elif 'java' in skills.lower():
        technologies = stack + ['Spring Boot', 'MySQL', 'REST API']
    else:
        technologies = stack + ['Python', 'Flask', 'SQLite']
    technologies = list(dict.fromkeys(technologies))
    return [{
        'title': f'AI-Powered {interests.title()} Assistant',
        'description': f'A {difficulty.lower()}-level {duration} project designed around {interests} using your skills in {skills}.',
        'technologies': technologies,
        'features': ['Personalized dashboard', 'Recommendation engine', 'Search and filters', 'Progress analytics', 'Export results'],
        'roadmap': ['Define requirements', 'Design database and API', 'Build frontend', 'Implement AI and backend', 'Test and deploy'],
        'advanced': ['Add an LLM', 'Add authentication', 'Add feedback-based personalization', 'Add analytics and monitoring']
    }]


def generate_with_ai(skills, interests, difficulty, duration):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return fallback_projects(skills, interests, difficulty, duration)

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=os.getenv('OPENAI_MODEL', 'gpt-5.6-luna'),
        input=[{
            'role': 'system',
            'content': (
                'You are ProjectMind AI, an expert final-year project mentor. '
                'Return exactly 3 realistic and distinct project ideas for a college student. '
                'Respect the requested difficulty and duration. For each idea provide title, description, '
                'technologies, features, roadmap, and advanced improvements. Return valid JSON only with this shape: '
                '{"projects":[{"title":"...","description":"...","technologies":["..."],'
                '"features":["..."],"roadmap":["..."],"advanced":["..."]}]}.'
            )
        }, {
            'role': 'user',
            'content': (
                f'Skills: {skills}\nInterests/domain: {interests}\n'
                f'Difficulty: {difficulty}\nExpected duration: {duration}'
            )
        }]
    )
    data = json.loads(response.output_text)
    if not isinstance(data.get('projects'), list) or len(data['projects']) != 3:
        raise ValueError('AI returned an invalid project list')
    return data['projects']


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'ai_enabled': bool(os.getenv('OPENAI_API_KEY'))})


@app.post('/api/generate')
def generate():
    data = request.get_json(silent=True) or {}
    skills = str(data.get('skills', '')).strip()
    interests = str(data.get('interests', '')).strip()
    difficulty = str(data.get('difficulty', 'Intermediate')).strip()
    duration = str(data.get('duration', '3-4 months')).strip()

    if not skills or not interests:
        return jsonify({'error': 'skills and interests are required'}), 400

    try:
        projects = generate_with_ai(skills, interests, difficulty, duration)
        return jsonify({'projects': projects})
    except Exception:
        app.logger.exception('AI generation failed')
        return jsonify({'error': 'AI generation failed. Check your API key, model, and backend logs.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
