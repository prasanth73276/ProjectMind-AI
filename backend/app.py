import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

ALLOWED_DIFFICULTIES = {'Beginner', 'Intermediate', 'Advanced'}
ALLOWED_DURATIONS = {'1-2 months', '3-4 months', '5-6 months'}


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
        (
            f'{domain} Recommendation System',
            f'A {level}-level {duration} project that recommends useful {domain.lower()} resources, solutions, or next steps based on user needs and your skills in {skills}.',
            ['Personalized recommendations', 'Search and filters', 'User dashboard', 'Recommendation history', 'Feedback collection'],
            ['Define requirements and recommendation rules', 'Design database and API', 'Build the frontend and dashboard', 'Implement recommendation logic', 'Test, deploy, and collect feedback'],
            ['Add an LLM assistant', 'Add user authentication', 'Use feedback to improve recommendations', 'Add analytics and monitoring']
        ),
        (
            f'Smart {domain} Management Platform',
            f'A practical {level}-level {duration} platform for organizing, tracking, and improving {domain.lower()} workflows while applying your existing skills in {skills}.',
            ['Interactive dashboard', 'Create and manage records', 'Progress tracking', 'Reports and export', 'Notifications or reminders'],
            ['Plan the user flow', 'Design the database', 'Create backend APIs', 'Build the responsive interface', 'Test and deploy'],
            ['Add real-time updates', 'Add role-based access', 'Add predictive analytics', 'Add cloud monitoring']
        ),
        (
            f'AI Assistant for {domain}',
            f'A {level}-level {duration} assistant that helps students or users solve common {domain.lower()} problems with guided recommendations and intelligent search.',
            ['AI-powered question answering', 'Suggested actions', 'Knowledge/search module', 'Conversation history', 'Useful resource links'],
            ['Collect use cases and data', 'Design the assistant workflow', 'Build the API and interface', 'Connect the AI/recommendation layer', 'Evaluate responses and deploy'],
            ['Add retrieval-augmented generation', 'Add document upload', 'Add voice interaction', 'Add response-quality analytics']
        )
    ]

    return [
        {
            'title': title,
            'description': description,
            'technologies': technologies,
            'features': features,
            'roadmap': roadmap,
            'advanced': advanced
        }
        for title, description, features, roadmap, advanced in templates
    ]


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
    if difficulty not in ALLOWED_DIFFICULTIES:
        return jsonify({'error': 'invalid difficulty'}), 400
    if duration not in ALLOWED_DURATIONS:
        return jsonify({'error': 'invalid duration'}), 400
    if len(skills) > 500 or len(interests) > 300:
        return jsonify({'error': 'skills or interests are too long'}), 400

    try:
        projects = generate_with_ai(skills, interests, difficulty, duration)
        return jsonify({'projects': projects})
    except Exception:
        app.logger.exception('AI generation failed')
        return jsonify({'error': 'AI generation failed. Check your API key, model, and backend logs.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
