// ============================================================
// JICHO — shared data layer
// Used by: index.html, category.html, article.html, admin.html
// Persistence: browser localStorage (works once hosted for real;
// data lives per-browser, per-device — see README for upgrading
// to a real backend/database later).
// ============================================================

const STORAGE_KEY = 'jicho_articles';
const CATS = ['News', 'Technology', 'Business', 'Culture', 'Reviews'];

function uid() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return fmtDate(ts);
}

function excerpt(text, len) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trim() + '…' : clean;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---------- Storage ----------
function loadArticles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load articles', e);
    return [];
  }
}

function saveArticles(articles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    return true;
  } catch (e) {
    console.error('Failed to save articles', e);
    return false;
  }
}

function publishedArticles(articles) {
  return articles.filter(a => a.status === 'published').sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- Seed data (only used the very first time, when storage is empty) ----------
function seedIfEmpty() {
  let articles = loadArticles();
  if (articles.length > 0) return articles;

  const now = Date.now();
  articles = [
    {
      id: uid(),
      title: "Why Nairobi's matatu sector keeps reinventing itself faster than its regulators",
      category: 'Business',
      excerpt: "Every crackdown produces a workaround within weeks. A look at why informal transit innovation keeps outpacing formal reform.",
      body: "Nairobi's matatu industry has a peculiar talent: every time a new directive lands, an adaptation appears almost before the ink dries.\n\nThis is not chaos. It's a feedback loop. Operators run on thin margins and tight schedules, which means any rule that doesn't pencil out gets quietly bent, not broken outright but reshaped at the edges until it fits the economics of the route.\n\nRegulators, meanwhile, work in a different rhythm — public consultations, gazette notices, phased rollouts. By the time a rule is fully enforced, the informal sector has already absorbed its cost and moved on to the next adjustment.\n\nThe result is a strange kind of resilience. It's inefficient, sometimes unsafe, but it rarely actually stalls. Anyone hoping to reform the sector for good will need to design rules as fast-moving as the operators they're meant to govern.",
      author: 'Wanjiru M.',
      image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=80',
      status: 'published',
      createdAt: now - 1000 * 60 * 60 * 3,
      updatedAt: now - 1000 * 60 * 60 * 3,
    },
    {
      id: uid(),
      title: "The quiet rise of agri-fintech in the Rift Valley",
      category: 'Technology',
      excerpt: "A wave of small platforms is letting smallholder farmers borrow against future harvests. None of them call themselves fintechs.",
      body: "Drive through parts of the Rift Valley this season and you'll notice something: farmers checking phones for more than just M-Pesa balances.\n\nA handful of small platforms — most with unglamorous names, built by teams of four or five — have started letting smallholders borrow small amounts against an expected harvest, repayable in produce or cash once it's sold. None of the founders describe themselves as fintech entrepreneurs. They call it 'just helping people get through planting season.'\n\nThe lending logic is simple and local: a platform partners with a cooperative that already knows which farmers are reliable, then layers a thin software interface on top of relationships that predate any app. It's unglamorous, low-margin, and exactly the kind of infrastructure that's easy to overlook until you ask why default rates are lower than anyone expected.",
      author: 'D. Otieno',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
      status: 'published',
      createdAt: now - 1000 * 60 * 60 * 20,
      updatedAt: now - 1000 * 60 * 60 * 20,
    },
    {
      id: uid(),
      title: "What a decade of SGR data tells us about freight, not passengers",
      category: 'News',
      excerpt: "The Standard Gauge Railway was sold on passenger numbers. Its real impact has been quieter, and harder to put on a poster.",
      body: "Ten years on, the conversation around the Standard Gauge Railway still centers on ticket counts and platform photos. That's the easy story to tell. The more interesting one is in the freight manifests.\n\nFreight volumes between Mombasa and the interior have shifted in ways that don't make for dramatic headlines but matter enormously for the cost of nearly everything transported along that corridor — cement, grain, fuel, retail goods.\n\nThe honest assessment sits between the railway's loudest critics and its loudest boosters: a genuinely useful piece of freight infrastructure, oversold at launch as a passenger project, now quietly doing the less photogenic job it was probably always better suited for.",
      author: 'News Desk',
      image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200&q=80',
      status: 'published',
      createdAt: now - 1000 * 60 * 60 * 44,
      updatedAt: now - 1000 * 60 * 60 * 44,
    },
    {
      id: uid(),
      title: "Sheng is evolving faster than any dictionary can track — and that's the point",
      category: 'Culture',
      excerpt: "Linguists trying to document Sheng keep running into the same problem: the language is designed to outrun documentation.",
      body: "Ask three Nairobi neighborhoods for the current slang word for 'expensive' and you might get three different answers, none matching what was current two years ago.\n\nThis is by design, or at least by function. Sheng emerged partly as an in-group code, and in-group codes work best when they shift faster than outsiders — including, often, parents and authorities — can keep pace.\n\nLinguists studying the language have mostly given up on producing a stable dictionary and instead document it the way you'd track a weather system: snapshots, regional variation, rates of change. The language isn't failing to settle down. Not settling down is what it's for.",
      author: 'Achieng O.',
      image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80',
      status: 'published',
      createdAt: now - 1000 * 60 * 60 * 70,
      updatedAt: now - 1000 * 60 * 60 * 70,
    },
    {
      id: uid(),
      title: "Solar mini-grids are profitable now. So why are so few being built?",
      category: 'Business',
      excerpt: "The unit economics finally work. The bottleneck has moved from financing to something much more boring: paperwork.",
      body: "For years, the case against rural solar mini-grids was financial: too expensive to build, too long to break even, too risky for lenders. That argument has mostly collapsed as panel and battery costs have fallen.\n\nWhat hasn't collapsed is the permitting timeline. Developers report that the technical and financial pieces of a mini-grid project can now move in months, while licensing and land agreements still drag on for one to two years.\n\nIt's an unglamorous bottleneck — nobody writes investor decks about regulatory queues — but it's increasingly the actual constraint on how fast rural electrification can scale, more than financing or technology ever was.",
      author: 'News Desk',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
      status: 'published',
      createdAt: now - 1000 * 60 * 60 * 96,
      updatedAt: now - 1000 * 60 * 60 * 96,
    },
    {
      id: uid(),
      title: "Draft: County hospitals and the supply chain nobody audits",
      category: 'News',
      excerpt: "A working draft on cold-chain failures in county-level health facilities.",
      body: "This is a draft. Notes so far:\n\n- Cold chain breaks happen mostly at the county-to-facility leg, not national-to-county.\n- Need to verify numbers with at least two county health officers before publishing.\n- Consider FOI request for procurement records.",
      author: 'News Desk',
      image: '',
      status: 'draft',
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 30,
    },
  ];
  saveArticles(articles);
  return articles;
}

// ---------- Shared chrome: masthead, ticker, footer, newsletter ----------
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
