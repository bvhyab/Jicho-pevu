// ============================================================
// JICHO — admin panel logic (admin.html)
// Depends on data.js being loaded first.
// Two sub-views within the same page: list and editor.
// The view + which article is being edited is tracked via
// the URL hash so links/back-button behave sensibly:
//   admin.html          -> list view
//   admin.html#new      -> new article
//   admin.html#edit=ID  -> edit existing article
// ============================================================

let adminArticles = [];
let draft = null;

function adminInit() {
  adminArticles = seedIfEmpty();
  renderAdminView();
  window.addEventListener('hashchange', renderAdminView);
}

function renderAdminView() {
  const hash = window.location.hash;
  if (hash === '#new') {
    openEditor(null);
  } else if (hash.startsWith('#edit=')) {
    openEditor(hash.replace('#edit=', ''));
  } else {
    renderAdminList();
  }
}

function adminChrome(innerHtml) {
  return `
    <div class="admin-bar">
      <span class="brand-mark">JICH<span>O</span><span class="admin-tag-label">Admin</span></span>
      <a class="admin-exit" href="index.html">View site →</a>
    </div>
    <div class="admin-wrap">${innerHtml}</div>
  `;
}

// ---------- List view ----------
function renderAdminList() {
  adminArticles = loadArticles();
  const sorted = [...adminArticles].sort((a, b) => b.updatedAt - a.updatedAt);
  const pubCount = publishedArticles(adminArticles).length;

  const body = `
    <div class="admin-head">
      <div>
        <h1>Articles</h1>
        <p>${adminArticles.length} total · ${pubCount} published</p>
      </div>
      <a class="btn-primary" href="#new">+ New article</a>
    </div>

    ${sorted.length === 0 ? `
      <div class="admin-empty">
        <h3>No articles yet</h3>
        <p>Create your first one to see it appear here, and on the live site once published.</p>
      </div>
    ` : `
    <table class="admin-table">
      <thead>
        <tr><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr>
      </thead>
      <tbody>
        ${sorted.map(a => `
          <tr>
            <td class="t-title">${escapeHtml(a.title || '(untitled)')}</td>
            <td><span style="font-family:var(--mono); font-size:11.5px; color:var(--slate);">${a.category}</span></td>
            <td><span class="status-pill status-${a.status}">${a.status}</span></td>
            <td><span style="font-family:var(--mono); font-size:11.5px; color:var(--slate);">${timeAgo(a.updatedAt)}</span></td>
            <td>
              <div class="row-actions">
                <a class="btn-ghost" href="#edit=${a.id}">Edit</a>
                <button class="btn-danger" onclick="deleteArticle('${a.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  `;

  document.getElementById('page-root').innerHTML = adminChrome(body);
}

// ---------- Editor view ----------
function openEditor(id) {
  adminArticles = loadArticles();
  if (id) {
    const found = adminArticles.find(a => a.id === id);
    if (!found) {
      window.location.hash = '';
      return;
    }
    draft = { ...found };
  } else {
    draft = {
      id: uid(),
      title: '', category: CATS[0], excerpt: '', body: '', author: '', image: '',
      status: 'draft', createdAt: Date.now(), updatedAt: Date.now(),
      _isNew: true,
    };
  }
  renderAdminEdit();
}

function renderAdminEdit() {
  if (!draft) { renderAdminList(); return; }
  const isNew = draft._isNew;

  const body = `
    <div class="admin-head">
      <div>
        <h1>${isNew ? 'New article' : 'Edit article'}</h1>
        <p>${draft.status === 'published' ? 'Live on the site' : 'Draft — not visible to readers'}</p>
      </div>
    </div>

    <div class="editor-grid">
      <div>
        <div class="field">
          <label>Headline</label>
          <input type="text" class="title-input" id="f-title" value="${escapeHtml(draft.title)}" placeholder="Write a headline">
        </div>
        <div class="field">
          <label>Dek / excerpt</label>
          <textarea id="f-excerpt" placeholder="One or two sentences that summarize the story">${escapeHtml(draft.excerpt)}</textarea>
          <div class="field-hint">Shown on the homepage and category pages. Leave blank to auto-generate from the body.</div>
        </div>
        <div class="field">
          <label>Body</label>
          <textarea class="body-input" id="f-body" placeholder="Write the story. Press enter twice for a new paragraph.">${escapeHtml(draft.body)}</textarea>
        </div>
      </div>

      <div class="editor-sidebar">
        <div class="field">
          <label>Status</label>
          <select id="f-status">
            <option value="draft" ${draft.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="published" ${draft.status === 'published' ? 'selected' : ''}>Published</option>
          </select>
        </div>
        <div class="field">
          <label>Category</label>
          <select id="f-category">
            ${CATS.map(c => `<option value="${c}" ${draft.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Byline</label>
          <input type="text" id="f-author" value="${escapeHtml(draft.author)}" placeholder="e.g. News Desk">
        </div>
        <div class="field">
          <label>Cover image URL</label>
          <input type="url" id="f-image" value="${escapeHtml(draft.image)}" placeholder="https://…">
          <div class="field-hint">Optional. Paste a direct image link.</div>
        </div>

        <div class="sidebar-actions">
          <button class="btn-primary" id="save-btn">Save changes</button>
          ${!isNew ? `<a class="btn-ghost" href="article.html?id=${draft.id}" target="_blank">Preview live page →</a>` : ''}
          <a class="btn-ghost" href="#" id="cancel-btn">Cancel</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('page-root').innerHTML = adminChrome(body);

  // wire inputs to draft object
  document.getElementById('f-title').addEventListener('input', e => draft.title = e.target.value);
  document.getElementById('f-excerpt').addEventListener('input', e => draft.excerpt = e.target.value);
  document.getElementById('f-body').addEventListener('input', e => draft.body = e.target.value);
  document.getElementById('f-status').addEventListener('change', e => draft.status = e.target.value);
  document.getElementById('f-category').addEventListener('change', e => draft.category = e.target.value);
  document.getElementById('f-author').addEventListener('input', e => draft.author = e.target.value);
  document.getElementById('f-image').addEventListener('input', e => draft.image = e.target.value);

  document.getElementById('save-btn').addEventListener('click', saveDraft);
  document.getElementById('cancel-btn').addEventListener('click', e => {
    e.preventDefault();
    window.location.hash = '';
  });
}

function saveDraft() {
  if (!draft.title.trim()) {
    alert('Give the article a headline before saving.');
    return;
  }
  draft.updatedAt = Date.now();
  const wasPublished = draft.status === 'published';
  delete draft._isNew;

  adminArticles = loadArticles();
  const idx = adminArticles.findIndex(a => a.id === draft.id);
  if (idx >= 0) {
    adminArticles[idx] = draft;
  } else {
    adminArticles.push(draft);
  }
  saveArticles(adminArticles);
  showToast(wasPublished ? 'Published' : 'Saved as draft');
  window.location.hash = '';
}

function deleteArticle(id) {
  if (!confirm('Delete this article? This cannot be undone.')) return;
  adminArticles = loadArticles().filter(a => a.id !== id);
  saveArticles(adminArticles);
  showToast('Deleted');
  renderAdminList();
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
