#!/usr/bin/env python3
"""
Jicho — Full-Stack News Site Backend

Two roles:
  1. Serve static files (jicho-site/*) for the public site and admin panel
  2. Provide a REST API for articles + admin auth (SQLite database)

Run: python3 server.py
Then open http://localhost:8000 in your browser.
"""

import json
import os
import re
import sqlite3
import hashlib
import secrets
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# ── Configuration ────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# server.py is in the jicho-site folder; public files are in the same directory
PUBLIC_DIR = BASE_DIR

DB_PATH = os.path.join(BASE_DIR, "jicho.db")
ADMIN_PASSWORD = "demo"          # Admin panel password (change in server.py)
PORT = 8000
HOST = "127.0.0.1"

# ── Database helpers ─────────────────────────────────────────────
def get_db():
    """Create connection and ensure schema exists."""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create the articles table if it doesn't exist."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id           TEXT PRIMARY KEY,
            title        TEXT NOT NULL,
            category     TEXT NOT NULL,
            excerpt      TEXT,
            body         TEXT NOT NULL,
            author       TEXT NOT NULL DEFAULT 'Staff',
            image        TEXT,
            status       TEXT NOT NULL DEFAULT 'draft',
            created_at   REAL NOT NULL,
            updated_at   REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def seed_if_empty():
    """Insert seed articles if the database is empty."""
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) AS n FROM articles").fetchone()["n"]
    if count > 0:
        conn.close()
        return

    now = __import__("time").time()
    seed = [
        {
            "id": "a1", "title": "Why Nairobi's matatu sector keeps reinventing itself faster than its regulators",
            "category": "Business", "excerpt": "Every crackdown produces a workaround within weeks. A look at why informal transit innovation keeps outpacing formal reform.",
            "body": "Nairobi's matatu industry has a peculiar talent: every time a new directive lands, an adaptation appears almost before the ink dries.\n\nThis is not chaos. It's a feedback loop. Operators run on thin margins and tight schedules, which means any rule that doesn't pencil out gets quietly bent, not broken outright but reshaped at the edges until it fits the economics of the route.\n\nRegulators, meanwhile, work in a different rhythm — public consultations, gazette notices, phased rollouts. By the time a rule is fully enforced, the informal sector has already absorbed its cost and moved on to the next adjustment.\n\nThe result is a strange kind of resilience. It's inefficient, sometimes unsafe, but it rarely actually stalls. Anyone hoping to reform the sector for good will need to design rules as fast-moving as the operators they're meant to govern.",
            "author": "Wanjiru M.",
            "image": "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&q=80",
            "status": "published", "created_at": now - 3 * 3600, "updated_at": now - 3 * 3600,
        },
        {
            "id": "a2", "title": "The quiet rise of agri-fintech in the Rift Valley",
            "category": "Technology", "excerpt": "A wave of small platforms is letting smallholder farmers borrow against future harvests. None of them call themselves fintechs.",
            "body": "Drive through parts of the Rift Valley this season and you'll notice something: farmers checking phones for more than just M-Pesa balances.\n\nA handful of small platforms — most with unglamorous names, built by teams of four or five — have started letting smallholders borrow small amounts against an expected harvest, repayable in produce or cash once it's sold. None of the founders describe themselves as fintech entrepreneurs. They call it 'just helping people get through planting season.'\n\nThe lending logic is simple and local: a platform partners with a cooperative that already knows which farmers are reliable, then layers a thin software interface on top of relationships that predate any app. It's unglamorous, low-margin, and exactly the kind of infrastructure that's easy to overlook until you ask why default rates are lower than anyone expected.",
            "author": "D. Otieno",
            "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
            "status": "published", "created_at": now - 20 * 3600, "updated_at": now - 20 * 3600,
        },
        {
            "id": "a3", "title": "What a decade of SGR data tells us about freight, not passengers",
            "category": "News", "excerpt": "The Standard Gauge Railway was sold on passenger numbers. Its real impact has been quieter, and harder to put on a poster.",
            "body": "Ten years on, the conversation around the Standard Gauge Railway still centers on ticket counts and platform photos. That's the easy story to tell. The more interesting one is in the freight manifests.\n\nFreight volumes between Mombasa and the interior have shifted in ways that don't make for dramatic headlines but matter enormously for the cost of nearly everything transported along that corridor — cement, grain, fuel, retail goods.\n\nThe honest assessment sits between the railway's loudest critics and its loudest boosters: a genuinely useful piece of freight infrastructure, oversold at launch as a passenger project, now quietly doing the less photogenic job it was probably always better suited for.",
            "author": "News Desk",
            "image": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200&q=80",
            "status": "published", "created_at": now - 44 * 3600, "updated_at": now - 44 * 3600,
        },
        {
            "id": "a4", "title": "Sheng is evolving faster than any dictionary can track — and that's the point",
            "category": "Culture", "excerpt": "Linguists trying to document Sheng keep running into the same problem: the language is designed to outrun documentation.",
            "body": "Ask three Nairobi neighborhoods for the current slang word for 'expensive' and you might get three different answers, none matching what was current two years ago.\n\nThis is by design, or at least by function. Sheng emerged partly as an in-group code, and in-group codes work best when they shift faster than outsiders — including, often, parents and authorities — can keep pace.\n\nLinguists studying the language have mostly given up on producing a stable dictionary and instead document it the way you'd track a weather system: snapshots, regional variation, rates of change. The language isn't failing to settle down. Not settling down is what it's for.",
            "author": "Achieng O.",
            "image": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80",
            "status": "published", "created_at": now - 70 * 3600, "updated_at": now - 70 * 3600,
        },
        {
            "id": "a5", "title": "Solar mini-grids are profitable now. So why are so few being built?",
            "category": "Business", "excerpt": "The unit economics finally work. The bottleneck has moved from financing to something much more boring: paperwork.",
            "body": "For years, the case against rural solar mini-grids was financial: too expensive to build, too long to break even, too risky for lenders. That argument has mostly collapsed as panel and battery costs have fallen.\n\nWhat hasn't collapsed is the permitting timeline. Developers report that the technical and financial pieces of a mini-grid project can now move in months, while licensing and land agreements still drag on for one to two years.\n\nIt's an unglamorous bottleneck — nobody writes investor decks about regulatory queues — but it's increasingly the actual constraint on how fast rural electrification can scale, more than financing or technology ever was.",
            "author": "News Desk",
            "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80",
            "status": "published", "created_at": now - 96 * 3600, "updated_at": now - 96 * 3600,
        },
        {
            "id": "a6", "title": "Draft: County hospitals and the supply chain nobody audits",
            "category": "News", "excerpt": "A working draft on cold-chain failures in county-level health facilities.",
            "body": "This is a draft.\n\n- Cold chain breaks happen mostly at the county-to-facility leg, not national-to-county.\n- Need to verify numbers with at least two county health officers before publishing.\n- Consider FOI request for procurement records.",
            "author": "News Desk",
            "image": "", "status": "draft", "created_at": now - 30 * 3600, "updated_at": now - 30 * 3600,
        },
    ]
    conn.executemany(
        "INSERT INTO articles (id, title, category, excerpt, body, author, image, status, created_at, updated_at) "
        "VALUES (:id, :title, :category, :excerpt, :body, :author, :image, :status, :created_at, :updated_at)",
        seed,
    )
    conn.commit()
    conn.close()

# ── Auth helpers ─────────────────────────────────────────────────
def hash_password(password):
    """Hash the admin password for comparison."""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)

def verify_token(token):
    """Validate an admin login token."""
    if not token:
        return False
    # Tokens are stored in a file; this is a simple check for demo
    token_file = os.path.join(BASE_DIR, "admin_token.txt")
    if os.path.exists(token_file):
        with open(token_file) as f:
            return token == f.read().strip()
    return False

def save_token(token):
    """Save the admin token to a file."""
    token_file = os.path.join(BASE_DIR, "admin_token.txt")
    with open(token_file, "w") as f:
        f.write(token)
    os.chmod(token_file, 0o600)

# ── API helpers ──────────────────────────────────────────────────
def json_response(handler, data, status=200):
    """Send a JSON response."""
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
    handler.wfile.write(json.dumps(data).encode("utf-8"))

def error_response(handler, message, status=400):
    """Send an error response."""
    json_response(handler, {"error": message}, status)

def get_request_body(handler):
    """Read the request body."""
    content_length = int(handler.headers.get("Content-Length", 0))
    if content_length == 0:
        return {}
    body = handler.rfile.read(content_length)
    try:
        return json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}

# ── Handler ──────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Suppress default log output — we use our own."""
        pass

    # ── CORS preflight ─────────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    # ── Static file serving ────────────────────────────────────
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        # Pass the FULL path including query string so API handlers can
        # read query parameters (e.g. ?status=draft)
        if path.startswith("/api/"):
            self.handle_api_GET(self.path)
            return

        # ── Serve static files ───────────────────────────────────
        # Default index.html for directory requests
        if path.endswith("/") or path == "":
            path = "/index.html"
        elif not path.startswith("/api/"):
            pass  # already handled

        # Map URL path to file
        file_path = path.lstrip("/")
        file_path = os.path.normpath(file_path)
        if file_path.startswith("..") or file_path.startswith("/"):
            error_response(self, "Not found", 404)
            return

        full_path = os.path.join(PUBLIC_DIR, file_path)
        if not full_path.startswith(PUBLIC_DIR):
            error_response(self, "Not found", 404)
            return

        if not os.path.exists(full_path):
            error_response(self, "Not found", 404)
            return

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if mime_type is None:
            mime_type = "application/octet-stream"

        with open(full_path, "rb") as f:
            content = f.read()

        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", len(content))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)

    # ── API GET ────────────────────────────────────────────────
    def handle_api_GET(self, path):
        parsed = urlparse(path)
        parts = parsed.path.split("/")
        if len(parts) < 3:
            error_response(self, "Invalid endpoint", 400)
            return

        resource = parts[2]  # e.g., "articles"

        if resource == "articles":
            # GET /api/articles — list all or published
            # GET /api/articles/:id — get single article
            if len(parts) == 3:
                # List articles
                published_only = False
                draft_only = False
                query = parse_qs(parsed.query)
                if "status" in query:
                    status = query["status"][0]
                    if status == "published":
                        published_only = True
                    elif status == "draft":
                        draft_only = True

                conn = get_db()
                if published_only:
                    rows = conn.execute(
                        "SELECT id, title, category, excerpt, body, author, image, status, created_at, updated_at FROM articles WHERE status = 'published' ORDER BY created_at DESC"
                    ).fetchall()
                elif draft_only:
                    rows = conn.execute(
                        "SELECT id, title, category, excerpt, body, author, image, status, created_at, updated_at FROM articles WHERE status = 'draft' ORDER BY created_at DESC"
                    ).fetchall()
                else:
                    rows = conn.execute(
                        "SELECT id, title, category, excerpt, body, author, image, status, created_at, updated_at FROM articles ORDER BY created_at DESC"
                    ).fetchall()
                conn.close()
                data = [dict(r) for r in rows]
                json_response(self, data)
                return
            else:
                # Get single article
                article_id = parts[3]
                conn = get_db()
                row = conn.execute(
                    "SELECT id, title, category, excerpt, body, author, image, status, created_at, updated_at FROM articles WHERE id = ?",
                    (article_id,),
                ).fetchone()
                conn.close()
                if row is None:
                    error_response(self, "Article not found", 404)
                    return
                json_response(self, dict(row))

        else:
            error_response(self, "Endpoint not found", 404)

    # ── API POST ─────────────────────────────────────────────────
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # ── API routes ───────────────────────────────────────────
        if path.startswith("/api/"):
            self.handle_api_POST(path)
            return

        # ── Static file serving ───────────────────────────────────
        self.do_GET()

    def handle_api_POST(self, path):
        parts = path.split("/")
        if len(parts) < 3:
            error_response(self, "Invalid endpoint", 400)
            return

        resource = parts[2]

        if resource == "articles":
            self.handle_api_create_article()
        elif resource == "login":
            self.handle_api_login()
        else:
            error_response(self, "Endpoint not found", 404)

    def handle_api_create_article(self):
        body = get_request_body(self)

        required = ["title", "category", "body", "excerpt"]
        for field in required:
            if field not in body or not body[field]:
                error_response(self, f"Missing required field: {field}", 400)
                return

        # Validate status
        status = body.get("status", "draft")
        if status not in ("draft", "published"):
            error_response(self, "Invalid status", 400)
            return

        # Generate ID
        import time
        article_id = f"a{int(time.time() * 1000)}"

        article = {
            "id": article_id,
            "title": body["title"],
            "category": body["category"],
            "excerpt": body.get("excerpt", ""),
            "body": body["body"],
            "author": body.get("author", "Staff"),
            "image": body.get("image", ""),
            "status": status,
            "created_at": time.time(),
            "updated_at": time.time(),
        }

        conn = get_db()
        conn.execute(
            """INSERT INTO articles (id, title, category, excerpt, body, author, image, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (article_id, article["title"], article["category"], article["excerpt"],
             article["body"], article["author"], article["image"], article["status"],
             article["created_at"], article["updated_at"]),
        )
        conn.commit()
        conn.close()

        json_response(self, article, 201)

    def handle_api_login(self):
        body = get_request_body(self)
        password = body.get("password", "")

        if hash_password(password) == hash_password(ADMIN_PASSWORD):
            token = generate_token()
            save_token(token)
            json_response(self, {
                "token": token,
                "message": "Login successful",
                "token_expires_in": 86400,  # 24 hours
            }, 200)
        else:
            error_response(self, "Invalid password", 401)

    # ── API PUT ──────────────────────────────────────────────────
    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_PUT(path)
            return
        self.do_GET()

    def handle_api_PUT(self, path):
        parsed = urlparse(path)
        parts = parsed.path.split("/")
        if len(parts) < 4:
            error_response(self, "Invalid endpoint", 400)
            return

        if parts[2] == "articles":
            self.handle_api_update_article(parts[3] if len(parts) > 3 else None)
        else:
            error_response(self, "Endpoint not found", 404)

    def handle_api_update_article(self, article_id):
        body = get_request_body(self)
        if not article_id:
            error_response(self, "Missing article ID", 400)
            return

        required = ["title", "category", "body", "excerpt"]
        for field in required:
            if field not in body:
                error_response(self, f"Missing required field: {field}", 400)
                return

        status = body.get("status", "draft")
        if status not in ("draft", "published"):
            error_response(self, "Invalid status", 400)
            return

        conn = get_db()
        existing = conn.execute(
            "SELECT id FROM articles WHERE id = ?", (article_id,)
        ).fetchone()
        if existing is None:
            conn.close()
            error_response(self, "Article not found", 404)
            return

        conn.execute(
            """UPDATE articles SET
               title = ?, category = ?, excerpt = ?, body = ?, author = ?, image = ?,
               status = ?, updated_at = ?
               WHERE id = ?""",
            (body["title"], body["category"], body.get("excerpt", ""),
             body["body"], body.get("author", "Staff"), body.get("image", ""),
             status, time.time(), article_id),
        )
        conn.commit()
        conn.close()

        json_response(self, {"message": "Article updated", "id": article_id}, 200)

    # ── API DELETE ───────────────────────────────────────────────
    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_DELETE(path)
            return
        self.do_GET()

    def handle_api_DELETE(self, path):
        parsed = urlparse(path)
        parts = parsed.path.split("/")
        if len(parts) < 4:
            error_response(self, "Invalid endpoint", 400)
            return

        if parts[2] == "articles":
            self.handle_api_delete_article(parts[3] if len(parts) > 3 else None)
        else:
            error_response(self, "Endpoint not found", 404)

    def handle_api_delete_article(self, article_id):
        if not article_id:
            error_response(self, "Missing article ID", 400)
            return

        conn = get_db()
        cur = conn.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        conn.commit()
        deleted = cur.rowcount
        conn.close()

        if deleted == 0:
            error_response(self, "Article not found", 404)
            return

        json_response(self, {"message": "Article deleted", "id": article_id}, 200)

    # ── Do not support PUT/DELETE without path ──────────────────
    def do_PUT(self):
        self.do_GET()

    def do_DELETE(self):
        self.do_GET()

    # ── Default 404 ─────────────────────────────────────────────
    def do_HEAD(self):
        self.do_GET()


# ── Main ─────────────────────────────────────────────────────────
def main():
    init_db()
    seed_if_empty()

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Jicho news site running at http://{HOST}:{PORT}")
    print(f"  Public site: http://{HOST}:{PORT}/")
    print(f"  Admin panel: http://{HOST}:{PORT}/admin.html")
    print(f"  Database:    {DB_PATH}")
    print(f"  Admin password: {ADMIN_PASSWORD}")
    print(f"  Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()

if __name__ == "__main__":
    main()
