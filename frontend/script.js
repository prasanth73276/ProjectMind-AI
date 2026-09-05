const button = document.getElementById('generateBtn');
const results = document.getElementById('results');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const list = (items, ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
};

button.addEventListener('click', async () => {
  const skills = document.getElementById('skills').value.trim();
  const interests = document.getElementById('interests').value.trim();
  const difficulty = document.getElementById('difficulty').value;
  const duration = document.getElementById('duration').value;

  if (!skills || !interests) {
    results.innerHTML = '<div class="card error">Please enter both your skills and interests.</div>';
    return;
  }

  button.disabled = true;
  button.innerHTML = '<span>✦</span> Generating your ideas...';
  results.innerHTML = '<div class="card">✨ Finding projects that match your profile...</div>';

  try {
    const response = await fetch('http://localhost:5000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills, interests, difficulty, duration })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');

    results.innerHTML = data.projects.map((project, index) => `
      <article class="project">
        <p class="eyebrow">PROJECT ${index + 1}</p>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.description)}</p>
        <h3>🛠 Recommended Technologies</h3>
        ${list(project.technologies)}
        <h3>✨ Key Features</h3>
        ${list(project.features)}
        <h3>🗺 Development Roadmap</h3>
        ${list(project.roadmap, true)}
        <h3>🚀 Advanced Improvements</h3>
        ${list(project.advanced)}
      </article>
    `).join('');
  } catch (error) {
    results.innerHTML = `<div class="card error"><strong>Unable to generate ideas.</strong><br>${escapeHtml(error.message)}<br><small>Make sure the Flask backend is running on port 5000.</small></div>`;
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Generate My Ideas';
  }
});
