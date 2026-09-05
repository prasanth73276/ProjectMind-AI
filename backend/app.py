from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def build_projects(skills, interests):
    skills_text = skills.lower()
    interests_text = interests.lower()
    stack = [s.strip() for s in skills.split(',') if s.strip()]

    if any(word in skills_text for word in ['python', 'machine learning', 'ml', 'ai']):
        technologies = stack + ['FastAPI or Flask', 'scikit-learn', 'PostgreSQL']
    elif 'java' in skills_text:
        technologies = stack + ['Spring Boot', 'MySQL', 'REST API']
    else:
        technologies = stack + ['Python', 'Flask', 'SQLite']

    technologies = list(dict.fromkeys(technologies))
    topic = interests.strip() or 'student productivity'

    return [{
        'title': f'AI-Powered {topic.title()} Assistant',
        'description': f'An intelligent platform that uses your skills ({skills}) to solve problems in {topic}.',
        'technologies': technologies,
        'features': [
            'Personalized user dashboard',
            'AI-based recommendations',
            'Search and filter system',
            'Progress tracking and analytics',
            'Export project results'
        ],
        'roadmap': [
            'Define requirements and user flows',
            'Design the database and API',
            'Build the frontend interface',
            'Implement backend and recommendation logic',
            'Test, deploy, and document the project'
        ],
        'advanced': [
            'Add a large language model for richer recommendations',
            'Add authentication and role-based access',
            'Add feedback-based personalization',
            'Deploy with CI/CD and monitoring'
        ]
    }]


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.post('/api/generate')
def generate():
    data = request.get_json(silent=True) or {}
    skills = data.get('skills', '').strip()
    interests = data.get('interests', '').strip()

    if not skills or not interests:
        return jsonify({'error': 'skills and interests are required'}), 400

    return jsonify({'projects': build_projects(skills, interests)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
