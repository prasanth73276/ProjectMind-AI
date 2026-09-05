const button = document.getElementById('generateBtn');
const results = document.getElementById('results');
const savedBtn = document.getElementById('savedBtn');
const savedCount = document.getElementById('savedCount');
const savedSection = document.getElementById('savedSection');
const savedProjects = document.getElementById('savedProjects');

const STORAGE_KEY = 'projectmind_saved_projects';
let currentProjects = [];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const list = (items, ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
};

const getSaved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const setSaved = (projects) => localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

const isSaved = (project) => getSaved().some(item => item.title === project.title);

function updateSavedCount() {
  savedCount.textContent = getSaved().length;
}

function renderSaved() {
  const projects = getSaved();
  updateSavedCount();
  if (!projects.length) {
    savedProjects.innerHTML = '<div class="card empty-state">No saved projects yet. Generate ideas and click <strong>Save Project</strong> on the ones you like.</div>';
    return;
  }

  savedProjects.innerHTML = projects.map((project, index) => `
    <article class="saved-card">
      <p class="eyebrow">SAVED ${index + 1}</p>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.description)}</p>
      <div class="saved-actions">
        <button class="secondary-btn compare-btn" data-title="${escapeHtml(project.title)}">Compare</button>
        <button class="secondary-btn remove-btn" data-title="${escapeHtml(project.title)}">Remove</button>
      </div>
    </article>
  `).join('');
}

function saveProject(project) {
  const saved = getSaved();
  if (!saved.some(item => item.title === project.title)) {
    saved.push(project);
    setSaved(saved);
  }
  renderSaved();
  renderCurrentProjects();
}

function removeProject(title) {
  setSaved(getSaved().filter(project => project.title !== title));
  renderSaved();
  renderCurrentProjects();
}

function compareProject(title) {
  const project = getSaved().find(item => item.title === title);
  if (!project) return;
  const comparison = getSaved().filter(item => item.title === title || item.title !== title).slice(0, 3);
  results.innerHTML = `
    <div class="comparison card">
      <div class="comparison-head"><div><p class="eyebrow">PROJECT COMPARISON</p><h2>Compare your saved ideas</h2></div><button id="backToProjects" class="secondary-btn">Back</button></div>
      <div class="comparison-grid">
        ${comparison.map(item => `
          <div class="comparison-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <strong>Technologies</strong>${list(item.technologies)}
            <strong>Features</strong>${list(item.features)}
            <strong>Roadmap</strong>${list(item.roadmap, true)}
          </div>
        `).join('')}
      </div>
    </div>`;
  document.getElementById('backToProjects').addEventListener('click', renderCurrentProjects);
  window.scrollTo({ top: results.offsetTop - 30, behavior: 'smooth' });
}

function renderCurrentProjects() {
  if (!currentProjects.length) return;
  results.innerHTML = currentProjects.map((project, index) => `
    <article class="project">
      <div class="project-top"><p class="eyebrow">PROJECT ${index + 1}</p><button class="save-btn ${isSaved(project) ? 'saved' : ''}" data-title="${escapeHtml(project.title)}">${isSaved(project) ? '♥ Saved' : '♡ Save Project'}</button></div>
      <h2>${escapeHtml(project.title)}</h2>
      <p>${escapeHtml(project.description)}</p>
      <h3>🛠 Recommended Technologies</h3>${list(project.technologies)}
      <h3>✨ Key Features</h3>${list(project.features)}
      <h3>🗺 Development Roadmap</h3>${list(project.roadmap, true)}
      <h3>🚀 Advanced Improvements</h3>${list(project.advanced)}
    </article>
  `).join('');
}

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
    currentProjects = data.projects || [];
    renderCurrentProjects();
  } catch (error) {
    results.innerHTML = `<div class="card error"><strong>Unable to generate ideas.</strong><br>${escapeHtml(error.message)}<br><small>Make sure the Flask backend is running on port 5000.</small></div>`;
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Generate My Ideas';
  }
});

results.addEventListener('click', (event) => {
  const saveButton = event.target.closest('.save-btn');
  if (saveButton) {
    const project = currentProjects.find(item => item.title === saveButton.dataset.title);
    if (project) {
      if (isSaved(project)) removeProject(project.title);
      else saveProject(project);
    }
  }
});

savedProjects.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.remove-btn');
  if (removeButton) removeProject(removeButton.dataset.title);
  const compareButton = event.target.closest('.compare-btn');
  if (compareButton) compareProject(compareButton.dataset.title);
});

savedBtn.addEventListener('click', () => {
  savedSection.hidden = false;
  renderSaved();
  savedSection.scrollIntoView({ behavior: 'smooth' });
});

renderSaved();
