import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)


def fallback_projects(skills, interests):
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
        'description': f'A project designed around {interests} using your skills in {skills}.',
        'technologies': technologies,
        'features': ['Personalized dashboard', 'Recommendation engine', 'Search and filters', 'Progress analytics', 'Export results'],
        'roadmap': ['Define requirements', 'Design database and API', 'Build frontend', 'Implement AI and backend', 'Test and deploy'],
        'advanced': ['Add an LLM', 'Add authentication', 'Add feedback-based personalization', 'Add analytics and monitoring']
    }]


def generate_with_ai(skills, interests):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return fallback_projects(skills, interests)

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=os.getenv('OPENAI_MODEL', 'gpt-5.6-luna'),
        input=[{
            'role': 'system',
            'content': (
                'You are ProjectMind AI, an expert final-year project mentor. '
                'Return exactly 3 realistic project ideas for a college student. '
                'For each idea provide title, description, technologies, features, roadmap, and advanced improvements. '
                'Return valid JSON only with this shape: '
                '{"projects":[{"title":"...","description":"...","technologies":["..."],'
                '"features":["..."],"roadmap":["..."],"advanced":["..."]}]}.'
            )
        }, {
            'role': 'user',
            'content': f'Skills: {skills}\nInterests: {interests}'
        }]
    )
    data = json.loads(response.output_text)
    return data['projects']


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'ai_enabled': bool(os.getenv('OPENAI_API_KEY'))})


@app.post('/api/generate')
def generate():
    data = request.get_json(silent=True) or {}
    skills = data.get('skills', '').strip()
    interests = data.get('interests', '').strip()

    if not skills or not interests:
        return jsonify({'error': 'skills and interests are required'}), 400

    try:
        return jsonify({'projects': generate_with_ai(skills, interests)})
    except Exception as exc:
        app.logger.exception('AI generation failed')
        return jsonify({'error': 'AI generation failed', 'details': str(exc)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
