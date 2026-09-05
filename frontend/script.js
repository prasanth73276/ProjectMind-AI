const API = 'http://localhost:5000/api';
const button = document.getElementById('generateBtn');
const results = document.getElementById('results');
const savedBtn = document.getElementById('savedBtn');
const savedCount = document.getElementById('savedCount');
const savedSection = document.getElementById('savedSection');
const savedProjects = document.getElementById('savedProjects');
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authSwitch = document.getElementById('authSwitch');
const closeAuth = document.getElementById('closeAuth');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authName = document.getElementById('authName');
const nameField = document.getElementById('nameField');
const authMessage = document.getElementById('authMessage');
const profileSection = document.getElementById('profileSection');
const profileForm = document.getElementById('profileForm');
const STORAGE_KEY = 'projectmind_saved_projects';
let currentProjects = [];
let user = null;
let signupMode = false;

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list = (items, ordered = false) => { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`; };

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'include', headers: {'Content-Type': 'application/json', ...(options.headers || {})}, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showAuth(open = true) { authModal.hidden = !open; authMessage.textContent = ''; if (open) authEmail.focus(); }
function setAuthMode(signup) { signupMode = signup; authTitle.textContent = signup ? 'Create your account' : 'Log in'; authSubmit.textContent = signup ? 'Create account' : 'Log in'; authSwitch.textContent = signup ? 'Already have an account? Log in' : 'Create an account'; nameField.hidden = !signup; authName.required = signup; }

function updateUserUI() {
  if (user) { authBtn.textContent = `Hi, ${user.name}`; profileSection.hidden = false; document.getElementById('profileName').value = user.name || ''; document.getElementById('profileEmail').value = user.email || ''; document.getElementById('profileSkills').value = user.skills || ''; document.getElementById('profileInterests').value = user.interests || ''; }
  else { authBtn.textContent = 'Log in'; profileSection.hidden = true; }
}

async function loadUser() {
  try { const data = await api('/auth/me'); user = data.user; updateUserUI(); if (user) await loadSaved(); else { savedCount.textContent = '0'; renderSaved([]); } } catch (e) { console.error(e); }
}

async function loadSaved() {
  const data = await api('/saved');
  renderSaved(data.projects || []);
}

function renderSaved(projects) {
  savedCount.textContent = projects.length;
  if (!projects.length) { savedProjects.innerHTML = '<div class="card empty-state">No saved projects yet. Generate ideas and save the ones you like.</div>'; return; }
  savedProjects.innerHTML = projects.map((p, i) => `<article class="saved-card"><p class="eyebrow">SAVED ${i + 1}</p><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="saved-actions"><button class="secondary-btn compare-btn" data-title="${escapeHtml(p.title)}">Compare</button><button class="secondary-btn remove-btn" data-title="${escapeHtml(p.title)}">Remove</button></div></article>`).join('');
}

async function saveProject(project) { if (!user) { showAuth(); authMessage.textContent = 'Log in to save projects to your account.'; return; } try { await api('/saved', {method:'POST', body:JSON.stringify(project)}); await loadSaved(); renderCurrentProjects(); } catch (e) { alert(e.message); } }
async function removeProject(title) { try { await api('/saved', {method:'DELETE', body:JSON.stringify({title})}); await loadSaved(); renderCurrentProjects(); } catch (e) { alert(e.message); } }

async function compareProject(title) {
  const data = await api('/saved'); const projects = data.projects || []; const comparison = projects.slice(0, 3);
  results.innerHTML = `<div class="comparison card"><div class="comparison-head"><div><p class="eyebrow">PROJECT COMPARISON</p><h2>Compare your saved ideas</h2></div><button id="backToProjects" class="secondary-btn">Back</button></div><div class="comparison-grid">${comparison.map(item => `<div class="comparison-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><strong>Technologies</strong>${list(item.technologies)}<strong>Features</strong>${list(item.features)}<strong>Roadmap</strong>${list(item.roadmap, true)}</div>`).join('')}</div></div>`;
  document.getElementById('backToProjects').addEventListener('click', renderCurrentProjects); window.scrollTo({top:results.offsetTop-30,behavior:'smooth'});
}

function isSaved(project) { return false; }
function renderCurrentProjects() {
  if (!currentProjects.length) return;
  results.innerHTML = currentProjects.map((project, index) => `<article class="project"><div class="project-top"><p class="eyebrow">PROJECT ${index + 1}</p><button class="save-btn" data-title="${escapeHtml(project.title)}">♡ Save Project</button></div><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.description)}</p><h3>🛠 Recommended Technologies</h3>${list(project.technologies)}<h3>✨ Key Features</h3>${list(project.features)}<h3>🗺 Development Roadmap</h3>${list(project.roadmap,true)}<h3>🚀 Advanced Improvements</h3>${list(project.advanced)}</article>`).join('');
}

button.addEventListener('click', async () => {
  const skills = document.getElementById('skills').value.trim(), interests = document.getElementById('interests').value.trim(), difficulty = document.getElementById('difficulty').value, duration = document.getElementById('duration').value;
  if (!skills || !interests) { results.innerHTML = '<div class="card error">Please enter both your skills and interests.</div>'; return; }
  button.disabled = true; button.innerHTML = '<span>✦</span> Generating your ideas...'; results.innerHTML = '<div class="card">✨ Finding projects that match your profile...</div>';
  try { const data = await api('/generate', {method:'POST', body:JSON.stringify({skills,interests,difficulty,duration})}); currentProjects = data.projects || []; renderCurrentProjects(); }
  catch (e) { results.innerHTML = `<div class="card error"><strong>Unable to generate ideas.</strong><br>${escapeHtml(e.message)}<br><small>Make sure the Flask backend is running on port 5000.</small></div>`; }
  finally { button.disabled = false; button.innerHTML = '<span>✦</span> Generate My Ideas'; }
});

results.addEventListener('click', event => { const save = event.target.closest('.save-btn'); if (save) { const project = currentProjects.find(p => p.title === save.dataset.title); if (project) saveProject(project); } });
savedProjects.addEventListener('click', event => { const remove = event.target.closest('.remove-btn'); const compare = event.target.closest('.compare-btn'); if (remove) removeProject(remove.dataset.title); if (compare) compareProject(compare.dataset.title); });
savedBtn.addEventListener('click', async () => { if (!user) { showAuth(); authMessage.textContent = 'Log in to access your saved projects.'; return; } savedSection.hidden = false; await loadSaved(); savedSection.scrollIntoView({behavior:'smooth'}); });

authBtn.addEventListener('click', () => { if (user) { profileSection.hidden = !profileSection.hidden; profileSection.scrollIntoView({behavior:'smooth'}); } else { setAuthMode(false); showAuth(); } });
closeAuth.addEventListener('click', () => showAuth(false));
authSwitch.addEventListener('click', () => setAuthMode(!signupMode));
authForm.addEventListener('submit', async event => { event.preventDefault(); authSubmit.disabled = true; authMessage.textContent = ''; try { const path = signupMode ? '/auth/signup' : '/auth/login'; const body = signupMode ? {name:authName.value.trim(),email:authEmail.value.trim(),password:authPassword.value} : {email:authEmail.value.trim(),password:authPassword.value}; const data = await api(path,{method:'POST',body:JSON.stringify(body)}); user = data.user; showAuth(false); authForm.reset(); updateUserUI(); await loadSaved(); } catch(e) { authMessage.textContent = e.message; } finally { authSubmit.disabled = false; } });

profileForm.addEventListener('submit', async event => { event.preventDefault(); try { await api('/profile',{method:'PUT',body:JSON.stringify({name:profileName.value.trim(),skills:profileSkills.value.trim(),interests:profileInterests.value.trim()})}); await loadUser(); alert('Profile updated successfully.'); } catch(e) { alert(e.message); } });

setAuthMode(false); loadUser();