import os
from openai import OpenAI


def mentor_reply(message, profile=None, saved_projects=None):
    api_key = os.getenv('OPENAI_API_KEY')
    profile = profile or {}
    saved_projects = saved_projects or []

    if not api_key:
        return fallback_reply(message, profile, saved_projects)

    client = OpenAI(api_key=api_key)
    context = (
        f"Student name: {profile.get('name', 'Student')}\n"
        f"Skills: {profile.get('skills', 'Not provided')}\n"
        f"Interests: {profile.get('interests', 'Not provided')}\n"
        f"Saved projects: {', '.join(p.get('title', '') for p in saved_projects[:5]) or 'None'}"
    )
    response = client.responses.create(
        model=os.getenv('OPENAI_MODEL', 'gpt-5.6-luna'),
        instructions=(
            'You are ProjectMind AI Mentor, a practical final-year project guide. '
            'Give concise, actionable advice. Help students choose, plan, improve, and explain projects. '
            'Prefer concrete modules, technologies, milestones, datasets, architecture ideas, and next steps. '
            'Do not claim that an idea is guaranteed to succeed.'
        ),
        input=f"Student context:\n{context}\n\nStudent question:\n{message}",
        max_output_tokens=900,
    )
    return response.output_text.strip()


def fallback_reply(message, profile, saved_projects):
    text = message.lower()
    skills = profile.get('skills', 'your current skills')
    interests = profile.get('interests', 'your chosen domain')

    if 'roadmap' in text or 'plan' in text:
        return (
            f"For a {interests} project using {skills}, start with requirements and a simple MVP, "
            'then design the database/API, build the core feature, add testing, and finish with deployment and documentation. '
            'Break the work into weekly milestones and keep one advanced feature for the final phase.'
        )
    if 'unique' in text or 'improve' in text or 'advanced' in text:
        return (
            'To make a final-year project stronger, add personalization, analytics, role-based access, '
            'an AI assistant or recommendation layer, real-world evaluation, and a clear measurable outcome. '
            'Choose only the improvements you can complete reliably.'
        )
    if 'best' in text or 'choose' in text:
        if saved_projects:
            return 'Compare your saved ideas by problem value, feasibility, available data, technical learning, and demo impact. Pick the idea where you can build a strong MVP and one impressive advanced feature.'
        return 'Choose the project that matches your skills, solves a clear problem, has accessible data, and can produce a working MVP within your available time.'
    return (
        f"I can help you plan your {interests} project around {skills}. Ask me for a project comparison, "
        'roadmap, module breakdown, database design, dataset suggestions, or advanced features.'
    )
