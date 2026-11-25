// ============================================================
// JICHO — shared data layer
// Used by: index.html, category.html, article.html, admin.html
// Persistence: backend REST API + SQLite (real multi-user support)
// ============================================================

const CATS = ['News', 'Technology', 'Business', 'Culture', 'Reviews'];
const API_BASE = '/api';
const ADMIN_PASSWORD = 'demo';

// ── Auth state ──────────────────────────────────────────────────
let adminToken = null;

function getAuthToken() { return adminToken; }
function isAdminAuthenticated() { return !!adminToken; }

function setAdminToken(token) { adminToken = token; }

function clearAdminToken() { adminToken = null; }

function checkAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

// ── HTTP helpers ────────────────────────────────────────────────
async function apiRequest(path, method = 'GET', body = null) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ── Article CRUD ────────────────────────────────────────────────
async function loadArticles() {
  try {
    return await apiRequest('/articles', 'GET');
  } catch (e) {
    console.error('Failed to load articles', e);
    return [];
  }
}

async function saveArticle(article) {
  if (article.id) {
    await apiRequest(`/articles/${article.id}`, 'PUT', article);
  } else {
    const result = await apiRequest('/articles', 'POST', article);
    article.id = result.id;
  }
  return article;
}

async function deleteArticle(id) {
  await apiRequest(`/articles/${id}`, 'DELETE');
}

function publishedArticles(articles) {
  return (articles || []).filter(a => a.status === 'published').sort((a, b) => b.created_at - a.created_at);
}

function draftArticles(articles) {
  return (articles || []).filter(a => a.status === 'draft');
}

// Seed data already inserted by server on first run.
async function seedIfEmpty() {
  const articles = await loadArticles();
  return articles;
}

// ── Shared chrome ────────────────────────────────────────────────
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderMasthead(activeCat, articles) {
  const navItems = ['Home', ...CATS].map(c => {
    const isActive = (c === 'Home' && (document.body.dataset.page === 'home')) ||
      (c === activeCat);
    const href = c === 'Home' ? 'index.html' : `category.html?cat=${encodeURIComponent(c)}`;
    return `<a class="nav-link ${isActive ? 'active' : ''}" href="${href}">${c}</a>`;
  }).join('');

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return `
  <header class="masthead">
    <div class="masthead-top">
      <a class="brand" href="index.html" style="cursor:pointer">
        <span class="brand-mark">JICH<span>O</span></span>
        <span class="brand-tag">The watchful eye on the day</span>
      </a>
      <div class="masthead-date">${dateStr}</div>
    </div>
    <nav class="masthead-nav">
      ${navItems}
      <a class="nav-admin" href="admin.html">Admin →</a>
    </nav>
  </header>
  ${renderTicker(articles)}
  `;
}

function renderTicker(articles) {
  const pub = publishedArticles(articles);
  if (pub.length === 0) return '';
  const items = pub.slice(0, 8).map(a =>
    `<span class="ticker-item"><a href="article.html?id=${a.id}" style="color:inherit">${escapeHtml(a.title)}</a></span>`
  ).join('');
  return `
  <div class="ticker">
    <span class="ticker-label">Latest</span>
    <div class="ticker-track">${items}${items}</div>
  </div>`;
}

function renderNewsletter() {
  return `
  <div class="newsletter">
    <div class="newsletter-inner">
      <div>
        <h2>Get the day's eye in your inbox</h2>
        <p>One email, every morning. No noise, no push notifications fighting for your attention.</p>
      </div>
      <div>
        <form class="newsletter-form" id="newsletter-form">
          <input type="email" id="newsletter-email" placeholder="you@email.com" required>
          <button type="submit">Subscribe</button>
        </form>
        <div class="newsletter-note" id="newsletter-note"></div>
      </div>
    </div>
  </div>`;
}

function wireNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const note = document.getElementById('newsletter-note');
    note.textContent = `Subscribed ${emailInput.value} — demo only, no emails sent.`;
    emailInput.value = '';
  });
}

function renderFooter() {
  return `
  <footer>
    <div class="footer-inner">
      <span>© ${new Date().getFullYear()} Jicho. A demo publication.</span>
      <span><a href="admin.html">Admin panel</a></span>
    </div>
  </footer>`;
}

// ── Login helpers ───────────────────────────────────────────────
async function loginAdmin() {
  try {
    const result = await apiRequest('/login', 'POST', { password: ADMIN_PASSWORD });
    setAdminToken(result.token);
    return true;
  } catch (e) {
    console.error('Login failed:', e);
    return false;
  }
}

async function logoutAdmin() {
  setAdminToken(null);
}
