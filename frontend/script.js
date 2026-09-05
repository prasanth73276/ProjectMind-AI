const button = document.getElementById('generateBtn');
const results = document.getElementById('results');

button.addEventListener('click', async () => {
  const skills = document.getElementById('skills').value.trim();
  const interests = document.getElementById('interests').value.trim();

  if (!skills || !interests) {
    results.innerHTML = '<div class="card error">Please enter both your skills and interests.</div>';
    return;
  }

  button.disabled = true;
  button.textContent = 'Generating...';
  results.innerHTML = '';

  try {
    const response = await fetch('http://localhost:5000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills, interests })
    });

    if (!response.ok) throw new Error('Server error');
    const data = await response.json();

    results.innerHTML = data.projects.map(project => `
      <article class="project">
        <h2>${project.title}</h2>
        <p>${project.description}</p>
        <h3>Recommended Technologies</h3>
        <ul>${project.technologies.map(item => `<li>${item}</li>`).join('')}</ul>
        <h3>Key Features</h3>
        <ul>${project.features.map(item => `<li>${item}</li>`).join('')}</ul>
        <h3>Development Roadmap</h3>
        <ol>${project.roadmap.map(item => `<li>${item}</li>`).join('')}</ol>
        <h3>Advanced Improvements</h3>
        <ul>${project.advanced.map(item => `<li>${item}</li>`).join('')}</ul>
      </article>
    `).join('');
  } catch (error) {
    results.innerHTML = '<div class="card error">Could not connect to the backend. Start the Flask server on port 5000 and try again.</div>';
  } finally {
    button.disabled = false;
    button.textContent = 'Generate Project Ideas';
  }
});
