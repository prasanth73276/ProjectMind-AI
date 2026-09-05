const API = '/api';
const button = document.getElementById('generateBtn');
const results = document.getElementById('results');
const savedBtn = document.getElementById('savedBtn');
const savedCount = document.getElementById('savedCount');
const savedSection = document.getElementById('savedSection');
const savedProjects = document.getElementById('savedProjects');
const mentorForm = document.getElementById('mentorForm');
const mentorInput = document.getElementById('mentorInput');
const mentorSend = document.getElementById('mentorSend');
const mentorMessages = document.getElementById('mentorMessages');
const STORAGE_KEY = 'projectmind_saved_projects';
let currentProjects = [];

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list = (items, ordered = false) => { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`; };

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: {'Content-Type': 'application/json', ...(options.headers || {})}, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function setSaved(projects) { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); }

function renderSaved(projects = getSaved()) {
  savedCount.textContent = projects.length;
  if (!projects.length) { savedProjects.innerHTML = '<div class="card empty-state">No saved projects yet. Generate ideas and save the ones you like.</div>'; return; }
  savedProjects.innerHTML = projects.map((p, i) => `<article class="saved-card"><p class="eyebrow">SAVED ${i + 1}</p><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="saved-actions"><button class="secondary-btn compare-btn" data-title="${escapeHtml(p.title)}">Compare</button><button class="secondary-btn remove-btn" data-title="${escapeHtml(p.title)}">Remove</button></div></article>`).join('');
}

function saveProject(project) {
  const projects = getSaved();
  if (projects.some(p => p.title === project.title)) return;
  projects.push(project); setSaved(projects); renderSaved(); renderCurrentProjects();
}
function removeProject(title) { setSaved(getSaved().filter(p => p.title !== title)); renderSaved(); renderCurrentProjects(); }

function compareProject() {
  const comparison = getSaved().slice(0, 3);
  if (!comparison.length) return;
  results.innerHTML = `<div class="comparison card"><div class="comparison-head"><div><p class="eyebrow">PROJECT COMPARISON</p><h2>Compare your saved ideas</h2></div><button id="backToProjects" class="secondary-btn">Back</button></div><div class="comparison-grid">${comparison.map(item => `<div class="comparison-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><strong>Technologies</strong>${list(item.technologies)}<strong>Features</strong>${list(item.features)}<strong>Roadmap</strong>${list(item.roadmap,true)}</div>`).join('')}</div></div>`;
  document.getElementById('backToProjects').addEventListener('click', renderCurrentProjects);
  window.scrollTo({top:results.offsetTop-30,behavior:'smooth'});
}

function renderCurrentProjects() {
  if (!currentProjects.length) return;
  const savedTitles = new Set(getSaved().map(p => p.title));
  results.innerHTML = currentProjects.map((project, index) => `<article class="project"><div class="project-top"><p class="eyebrow">PROJECT ${index + 1}</p><button class="save-btn ${savedTitles.has(project.title) ? 'saved' : ''}" data-title="${escapeHtml(project.title)}">${savedTitles.has(project.title) ? '♥ Saved' : '♡ Save Project'}</button></div><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.description)}</p><h3>🛠 Recommended Technologies</h3>${list(project.technologies)}<h3>✨ Key Features</h3>${list(project.features)}<h3>🗺 Development Roadmap</h3>${list(project.roadmap,true)}<h3>🚀 Advanced Improvements</h3>${list(project.advanced)}</article>`).join('');
}

button.addEventListener('click', async () => {
  const skills = document.getElementById('skills').value.trim(), interests = document.getElementById('interests').value.trim(), difficulty = document.getElementById('difficulty').value, duration = document.getElementById('duration').value;
  if (!skills || !interests) { results.innerHTML = '<div class="card error">Please enter both your skills and interests.</div>'; return; }
  button.disabled = true; button.innerHTML = '<span>✦</span> Generating your ideas...'; results.innerHTML = '<div class="card">✨ Finding projects that match your profile...</div>';
  try { const data = await api('/generate', {method:'POST', body:JSON.stringify({skills,interests,difficulty,duration})}); currentProjects = data.projects || []; renderCurrentProjects(); }
  catch (e) { results.innerHTML = `<div class="card error"><strong>Unable to generate ideas.</strong><br>${escapeHtml(e.message)}</div>`; }
  finally { button.disabled = false; button.innerHTML = '<span>✦</span> Generate My Ideas'; }
});

results.addEventListener('click', event => { const save = event.target.closest('.save-btn'); if (save) { const project = currentProjects.find(p => p.title === save.dataset.title); if (project) saveProject(project); } });
savedProjects.addEventListener('click', event => { const remove = event.target.closest('.remove-btn'); const compare = event.target.closest('.compare-btn'); if (remove) removeProject(remove.dataset.title); if (compare) compareProject(); });
savedBtn.addEventListener('click', () => { savedSection.hidden = false; renderSaved(); savedSection.scrollIntoView({behavior:'smooth'}); });

mentorForm.addEventListener('submit', async event => {
  event.preventDefault();
  const message = mentorInput.value.trim(); if (!message) return;
  mentorInput.value = ''; mentorSend.disabled = true;
  mentorMessages.insertAdjacentHTML('beforeend', `<div class="mentor-message user-message">${escapeHtml(message)}</div><div class="mentor-message assistant-message">Thinking…</div>`);
  mentorMessages.scrollTop = mentorMessages.scrollHeight;
  try {
    const data = await api('/mentor', {method:'POST', body:JSON.stringify({message})});
    const replies = mentorMessages.querySelectorAll('.assistant-message');
    replies[replies.length - 1].textContent = data.reply;
  } catch (e) {
    const replies = mentorMessages.querySelectorAll('.assistant-message');
    replies[replies.length - 1].textContent = e.message;
  } finally { mentorSend.disabled = false; mentorInput.focus(); mentorMessages.scrollTop = mentorMessages.scrollHeight; }
});

document.querySelectorAll('.mentor-prompts button').forEach(btn => btn.addEventListener('click', () => { mentorInput.value = btn.dataset.prompt; mentorInput.focus(); }));

renderSaved();
