// ============================================================
// JICHO — public page rendering (index.html, category.html, article.html)
// Depends on data.js being loaded first.
// ============================================================

function renderHomePage() {
  const articles = seedIfEmpty();
  const pub = publishedArticles(articles);
  const root = document.getElementById('page-root');

  if (pub.length === 0) {
    root.innerHTML = `
      ${renderMasthead(null, articles)}
      <main>
        <div class="empty-state">
          <h2>No stories yet</h2>
          <p>Nothing's been published. Head to the admin panel to write the first one.</p>
        </div>
      </main>
      ${renderFooter()}
    `;
    return;
  }

  const [lead, ...rest] = pub;
  const sideStories = rest.slice(0, 4);
  const riverStories = pub.slice(5, 11);

  root.innerHTML = `
    ${renderMasthead(null, articles)}
    <main>
      <div class="lead-grid">
        <a class="lead-story" href="article.html?id=${lead.id}">
          ${lead.image ? `<img class="lead-image" src="${lead.image}" alt="">` : ''}
          <span class="lead-cat">${lead.category}</span>
          <h1>${escapeHtml(lead.title)}</h1>
          <p class="lead-excerpt">${escapeHtml(lead.excerpt || excerpt(lead.body, 160))}</p>
          <div class="byline">${escapeHtml(lead.author || 'Staff')} · ${timeAgo(lead.createdAt)}</div>
        </a>
        <div class="side-list">
          ${sideStories.map((a, i) => `
            <a class="side-item" href="article.html?id=${a.id}">
              <span class="side-num">0${i + 1}</span>
              <div>
                <h3>${escapeHtml(a.title)}</h3>
                <div class="byline">${a.category} · ${timeAgo(a.createdAt)}</div>
              </div>
            </a>`).join('')}
        </div>
      </div>

      ${riverStories.length ? `
      <div class="section-label">More stories</div>
      <div class="river">
        ${riverStories.map(a => `
          <a class="card" href="article.html?id=${a.id}">
            ${a.image ? `<img class="card-image" src="${a.image}" alt="">` : ''}
            <span class="lead-cat">${a.category}</span>
            <h3>${escapeHtml(a.title)}</h3>
            <p>${escapeHtml(a.excerpt || excerpt(a.body, 90))}</p>
            <div class="byline">${escapeHtml(a.author || 'Staff')} · ${timeAgo(a.createdAt)}</div>
          </a>`).join('')}
      </div>` : ''}
    </main>
    ${renderNewsletter()}
    ${renderFooter()}
  `;
  wireNewsletterForm();
}

function renderCategoryPage() {
  const cat = getQueryParam('cat') || CATS[0];
  const articles = seedIfEmpty();
  const items = publishedArticles(articles).filter(a => a.category === cat);
  const root = document.getElementById('page-root');

  document.title = `${cat} — Jicho`;

  root.innerHTML = `
    ${renderMasthead(cat, articles)}
    <main>
      <div class="section-label">${escapeHtml(cat)}</div>
      ${items.length === 0 ? `
        <div class="empty-state">
          <h2>Nothing in ${escapeHtml(cat)} yet</h2>
          <p>Check back soon, or publish the first ${escapeHtml(cat.toLowerCase())} story from the admin panel.</p>
        </div>
      ` : `
        <div class="river" style="margin-top:24px;">
          ${items.map(a => `
            <a class="card" href="article.html?id=${a.id}">
              ${a.image ? `<img class="card-image" src="${a.image}" alt="">` : ''}
              <span class="lead-cat">${a.category}</span>
              <h3>${escapeHtml(a.title)}</h3>
              <p>${escapeHtml(a.excerpt || excerpt(a.body, 90))}</p>
              <div class="byline">${escapeHtml(a.author || 'Staff')} · ${timeAgo(a.createdAt)}</div>
            </a>`).join('')}
        </div>
      `}
    </main>
    ${renderFooter()}
  `;
}

function renderArticlePage() {
  const id = getQueryParam('id');
  const articles = seedIfEmpty();
  const a = articles.find(x => x.id === id);
  const root = document.getElementById('page-root');

  if (!a) {
    root.innerHTML = `
      ${renderMasthead(null, articles)}
      <main>
        <div class="empty-state">
          <h2>Story not found</h2>
          <p>It may have been removed, or the link is incorrect.</p>
        </div>
      </main>
      ${renderFooter()}
    `;
    return;
  }

  document.title = `${a.title} — Jicho`;

  const paragraphs = (a.body || '')
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join('');

  root.innerHTML = `
    ${renderMasthead(a.category, articles)}
    <main>
      <div class="article-wrap">
        <a class="back-link" href="index.html">← Back to Jicho</a>
        <span class="article-cat">${a.category}</span>
        <h1>${escapeHtml(a.title)}</h1>
        <div class="article-meta">
          <span>${escapeHtml(a.author || 'Staff')}</span>
          <span>·</span>
          <span>${fmtDate(a.createdAt)}</span>
        </div>
        ${a.image ? `<img class="article-hero" src="${a.image}" alt="">` : ''}
        <div class="article-body">${paragraphs}</div>
      </div>
    </main>
    ${renderNewsletter()}
    ${renderFooter()}
  `;
  wireNewsletterForm();
}
