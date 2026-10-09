"""
Local server for the site editor (started by edit-site.bat).

Serves the website folder at http://127.0.0.1:<port>/ and lets the editor
save js/content.js and add files under assets/ -- in any browser.

Safety: it only listens on this computer (127.0.0.1), only answers requests
that come from the editor page itself, and only ever writes js/content.js
and new files inside assets/.

Usage: python editor/server.py [--port 8080] [--no-browser]
"""
import functools
import http.server
import json
import os
import re
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

print = functools.partial(print, flush=True)  # show messages immediately in the editor window

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "js", "content.js")
ASSETS = os.path.join(ROOT, "assets")
MAX_BYTES = 100 * 1024 * 1024  # GitHub rejects files over 100 MB
LOCAL_HOSTS = ("127.0.0.1", "localhost")

EXT_FOR_TYPE = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp",
    "image/avif": ".avif", "image/svg+xml": ".svg", "video/mp4": ".mp4", "video/webm": ".webm",
    "application/pdf": ".pdf",
}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")[:60]


def clean_name(name, content_type=""):
    base, ext = os.path.splitext(os.path.basename(str(name).replace("\\", "/")))
    ext = ext.lower()
    if not re.fullmatch(r"\.[a-z0-9]{2,5}", ext):
        ext = EXT_FOR_TYPE.get(content_type.split(";")[0].strip().lower(), "")
    return (slug(base) or "file") + ext


def clean_folder(folder):
    parts = [slug(p) for p in str(folder).replace("\\", "/").split("/")]
    return [p for p in parts if p] or ["files"]


def store(data, name, folder, content_type=""):
    """Write bytes to assets/<folder>/<name>, never overwriting. Returns the site-relative path."""
    target_dir = os.path.join(ASSETS, *clean_folder(folder))
    assets_real = os.path.realpath(ASSETS)
    if os.path.commonpath([assets_real, os.path.realpath(target_dir)]) != assets_real:
        raise ValueError("Bad folder")
    os.makedirs(target_dir, exist_ok=True)
    base, ext = os.path.splitext(clean_name(name, content_type))
    n = 1
    while True:
        path = os.path.join(target_dir, f"{base}{'' if n == 1 else f'-{n}'}{ext}")
        try:
            with open(path, "xb") as f:
                f.write(data)
            break
        except FileExistsError:
            n += 1
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows' registry can map .js to text/plain; pin the types the site uses.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json",
        ".mp4": "video/mp4", ".webm": "video/webm", ".webp": "image/webp", ".avif": "image/avif", ".pdf": "application/pdf",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # edits show up on a normal refresh
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the window quiet; saves and uploads are printed below

    # ------------------------------------------------------------ helpers

    def reply(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def from_editor(self):
        """Only the editor page on this computer may call the API (blocks other websites)."""
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0]
        ok = host in LOCAL_HOSTS and self.headers.get("X-Site-Editor") == "1"
        origin = self.headers.get("Origin")
        if origin is not None:
            o = urllib.parse.urlsplit(origin)
            ok = ok and o.hostname in LOCAL_HOSTS and o.port == self.server.server_port
        if not ok:
            self.reply(403, {"error": "Forbidden"})
        return ok

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BYTES:
            raise ValueError("File is over 100 MB - GitHub won't accept it. Use YouTube/Vimeo for long videos.")
        return self.rfile.read(length)

    # ------------------------------------------------------------ routes

    def do_GET(self):
        if urllib.parse.urlsplit(self.path).path == "/api/status":
            if self.from_editor():
                self.reply(200, {"ok": True, "folder": os.path.basename(ROOT)})
            return
        super().do_GET()

    def do_POST(self):
        if not self.from_editor():
            return
        url = urllib.parse.urlsplit(self.path)
        query = dict(urllib.parse.parse_qsl(url.query))
        try:
            if url.path == "/api/save-content":
                text = self.read_body().decode("utf-8")
                at = text.find("window.PORTFOLIO")
                if at < 0:
                    raise ValueError("Not a content file")
                json.loads(text[text.find("{", at): text.rfind("}") + 1])  # never write broken content
                tmp = CONTENT + ".tmp"
                with open(tmp, "w", encoding="utf-8", newline="\n") as f:
                    f.write(text)
                os.replace(tmp, CONTENT)
                print("  saved   js/content.js")
                self.reply(200, {"ok": True})

            elif url.path == "/api/upload":
                path = store(self.read_body(), query.get("name", "file"), query.get("folder", "files"), self.headers.get("Content-Type", ""))
                print("  added  ", path)
                self.reply(200, {"path": path})

            elif url.path == "/api/import":
                req = json.loads(self.read_body() or b"{}")
                src = str(req.get("url", ""))
                if urllib.parse.urlsplit(src).scheme not in ("http", "https"):
                    raise ValueError("Only http(s) links can be copied")
                fetch = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0 (site editor)"})
                with urllib.request.urlopen(fetch, timeout=60) as res:
                    data = res.read(MAX_BYTES + 1)
                    content_type = res.headers.get("Content-Type", "")
                if len(data) > MAX_BYTES:
                    raise ValueError("File is over 100 MB")
                name = urllib.parse.unquote(urllib.parse.urlsplit(src).path.rstrip("/").rsplit("/", 1)[-1]) or "file"
                path = store(data, name, req.get("folder", "files"), content_type)
                print("  copied ", path)
                self.reply(200, {"path": path})

            else:
                self.reply(404, {"error": "Unknown endpoint"})
        except Exception as e:  # report problems to the editor instead of crashing
            self.reply(400, {"error": str(e)})


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = False  # on Windows, reuse would let two servers share a port
    daemon_threads = True


def main():
    args = sys.argv[1:]
    start = int(args[args.index("--port") + 1]) if "--port" in args else 8080
    for port in range(start, start + 20):
        try:
            server = Server(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    else:
        sys.exit("Couldn't find a free port - close other copies of the editor and try again.")

    url = f"http://127.0.0.1:{port}/editor/"
    print()
    print("  Site editor is running:", url)
    print("  Website folder:", ROOT)
    print("  Keep this window open while you edit. Close it when you're done.")
    print()
    if "--no-browser" not in args:
        threading.Timer(0.4, webbrowser.open, [url]).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
