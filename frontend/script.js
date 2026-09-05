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
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authSwitch = document.getElementById('authSwitch');
const authMessage = document.getElementById('authMessage');
const nameField = document.getElementById('nameField');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const STORAGE_KEY = 'projectmind_saved_projects';
let currentProjects = [];
let currentUser = null;
let registerMode = false;

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list = (items, ordered = false) => { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`; };

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...(options.headers || {})}
  });
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

function openAuth(mode = 'login') {
  registerMode = mode === 'register';
  authTitle.textContent = registerMode ? 'Create your account' : 'Welcome back';
  authSubmit.textContent = registerMode ? 'Create Account' : 'Login';
  authSwitch.textContent = registerMode ? 'Already have an account? Login' : 'New here? Create an account';
  nameField.hidden = !registerMode;
  authMessage.textContent = '';
  authModal.hidden = false;
  setTimeout(() => (registerMode ? authName : authEmail).focus(), 50);
}
function closeAuth() { authModal.hidden = true; }

function updateAuthUI() {
  const welcome = mentorMessages?.querySelector('.mentor-welcome span');
  const heading = document.querySelector('#generator .section-heading p:last-child');
  if (currentUser) {
    authBtn.textContent = `Logout (${currentUser.name})`;
    authBtn.title = currentUser.email || '';
    if (welcome) welcome.textContent = `Logged in as ${currentUser.name}. Ask anything about your final-year project.`;
    if (heading) heading.textContent = 'You are logged in. Enter your skills and interests to generate personalized project ideas.';
  } else {
    authBtn.textContent = 'Login';
    authBtn.title = '';
    if (welcome) welcome.textContent = 'Log in to chat with your AI mentor.';
    if (heading) heading.textContent = 'Log in to generate and save personalized project ideas.';
  }
}

async function loadSession() {
  try {
    const data = await api('/me', {cache: 'no-store'});
    currentUser = data.authenticated ? data.user : null;
  } catch {
    currentUser = null;
  }
  updateAuthUI();
}

button.addEventListener('click', async () => {
  if (!currentUser) { openAuth('login'); return; }
  const skills = document.getElementById('skills').value.trim(), interests = document.getElementById('interests').value.trim(), difficulty = document.getElementById('difficulty').value, duration = document.getElementById('duration').value;
  if (!skills || !interests) { results.innerHTML = '<div class="card error">Please enter both your skills and interests.</div>'; return; }
  button.disabled = true; button.innerHTML = '<span>✦</span> Generating your ideas...'; results.innerHTML = '<div class="card">✨ Finding projects that match your profile...</div>';
  try { const data = await api('/generate', {method:'POST', body:JSON.stringify({skills,interests,difficulty,duration})}); currentProjects = data.projects || []; renderCurrentProjects(); }
  catch (e) { results.innerHTML = `<div class="card error"><strong>Unable to generate ideas.</strong><br>${escapeHtml(e.message)}</div>`; }
  finally { button.disabled = false; button.innerHTML = '<span>✦</span> Generate My Ideas'; }
});

results.addEventListener('click', event => { const save = event.target.closest('.save-btn'); if (save) { const project = currentProjects.find(p => p.title === save.dataset.title); if (project) saveProject(project); } });
savedProjects.addEventListener('click', event => { const remove = event.target.closest('.remove-btn'); const compare = event.target.closest('.compare-btn'); if (remove) removeProject(remove.dataset.title); if (compare) compareProject(); });
savedBtn.addEventListener('click', () => { if (!currentUser) { openAuth('login'); return; } savedSection.hidden = false; renderSaved(); savedSection.scrollIntoView({behavior:'smooth'}); });

authBtn.addEventListener('click', async () => {
  if (!currentUser) { openAuth('login'); return; }
  try { await api('/logout', {method:'POST', body:'{}'}); currentUser = null; currentProjects = []; updateAuthUI(); results.innerHTML = '<div class="card">You have been logged out.</div>'; }
  catch (e) { authMessage.textContent = e.message; }
});
authClose.addEventListener('click', closeAuth);
authModal.addEventListener('click', e => { if (e.target === authModal) closeAuth(); });
authSwitch.addEventListener('click', () => openAuth(registerMode ? 'login' : 'register'));

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  authMessage.textContent = '';
  try {
    const endpoint = registerMode ? '/register' : '/login';
    const body = registerMode ? {name: authName.value.trim(), email: authEmail.value.trim(), password: authPassword.value} : {email: authEmail.value.trim(), password: authPassword.value};
    const data = await api(endpoint, {method:'POST', body:JSON.stringify(body), cache:'no-store'});

    // Use the user returned by the successful auth response immediately.
    // Do not make the UI depend on a second request to /api/me.
    currentUser = data.user || null;
    if (!currentUser) throw new Error('The server accepted the request but did not return a user account.');

    authForm.reset();
    closeAuth();
    updateAuthUI();
    savedSection.hidden = true;
    results.innerHTML = `<div class="card"><strong>✓ Login successful</strong><br>Welcome, ${escapeHtml(currentUser.name)}! Project generation and AI Mentor are now unlocked.</div>`;
    document.getElementById('generator').scrollIntoView({behavior:'smooth', block:'start'});

    // Reload once so the authenticated state is also restored from the server
    // session on a fresh page load. The backend remains the source of truth.
    setTimeout(() => window.location.reload(), 350);
  } catch (e) {
    authMessage.textContent = e.message;
  } finally {
    authSubmit.disabled = false;
  }
});

mentorForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser) { openAuth('login'); return; }
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

document.querySelectorAll('.mentor-prompts button').forEach(btn => btn.addEventListener('click', () => { if (!currentUser) { openAuth('login'); return; } mentorInput.value = btn.dataset.prompt; mentorInput.focus(); }));

renderSaved();
loadSession();
