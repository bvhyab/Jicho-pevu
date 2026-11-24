# Jicho — a Kenyan-style news/blog demo site

A static news site with an admin panel for posting articles. Built as
plain HTML/CSS/JS — no build tools, no framework, no server required to try
it out locally. Designed for **GitHub Pages** deployment.

## Structure

```
jicho-site/
├── index.html          Homepage (lead story + grid of more stories)
├── category.html       One template for all categories (?cat=Technology etc.)
├── article.html        Single article view (?id=...)
├── admin.html          Admin panel: list, create, edit, delete, publish
├── css/
│   └── style.css       All styling for every page
└── js/
    ├── data.js         Shared: storage, seed data, masthead/footer/ticker HTML
    ├── main.js         Rendering logic for index/category/article pages
    └── admin.js        Rendering + logic for the admin panel
```

## Running it locally

Opening `index.html` directly by double-clicking will mostly work, but some
browsers restrict `localStorage` on `file://` URLs. The reliable way:

```bash
cd jicho-site
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

(Any static server works — `npx serve`, VS Code's "Live Server" extension, etc.)

## How articles are stored

This demo uses the browser's **localStorage**, so:
- Articles you create persist across reloads, but only in that one browser,
  on that one device.
- Clearing browser data / using a different browser or incognito window will
  reset it to the seed articles.
- There's no real login on `/admin.html` — anyone with the URL can edit or
  delete articles. Fine for a personal demo, **not safe to deploy publicly
  as-is**.

## Deploying to GitHub Pages

1. **Push this repo to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial Jicho site"
   # create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/jicho-site.git
   git push -u origin main
   ```

2. **Enable GitHub Pages in repo settings:**
   - Go to **Settings → Pages** (in your new repo)
   - Set **Source** to `Deploy from a branch`
   - Choose `main` branch, root folder `/`
   - Click **Save**

3. **Your site will be live at:**
   ```
   https://YOUR_USERNAME.github.io/jicho-site/
   ```

> Note: because articles are stored in `localStorage`, each visitor's browser
> only shows articles they (or anyone who visited the same browser) created.
> For a multi-user site (everyone sees the same articles, real login), you'd
> need a backend — see the "Turning this into a real, deployable site" section
> below.

## Next steps (for a real, multi-user deployment)

1. **A real backend + database** — a small Node/Express or Python (FastAPI/
   Django) API backed by Postgres or SQLite, replacing the `localStorage`
   calls in `data.js` with `fetch()` calls to that API.
2. **Authentication on admin routes** — a login page + sessions or JWTs so
   only you can publish/edit/delete.
3. **Hosting** — the static pages can go on Netlify/Vercel/GitHub Pages; the
   backend would need somewhere that runs server code (Render, Railway,
   Fly.io, a VPS, etc.) plus a real domain pointed at it.

Happy to help build any of those pieces — e.g. converting `data.js` to call
a real API, or scaffolding a minimal backend — whenever you're ready to take
this past the demo stage.
