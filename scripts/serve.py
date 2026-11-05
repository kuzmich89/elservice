import argparse
import http.server
from pathlib import Path
import tomllib
from urllib.parse import urlsplit, unquote

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8000)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
config = tomllib.loads((root / 'netlify.toml').read_text())
routes = {r['from']: r['to'] for r in config.get('redirects', []) if r['status'] == 200}

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        self.path = routes.get(unquote(urlsplit(self.path).path), self.path)
        super().do_GET()

    def do_HEAD(self):
        self.path = routes.get(unquote(urlsplit(self.path).path), self.path)
        super().do_HEAD()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            body = (root / '404.html').read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
        else:
            super().send_error(code, message, explain)

    def end_headers(self):
        from fnmatch import fnmatch
        path = urlsplit(self.path).path
        for rule in config.get('headers', []):
            if fnmatch(path, rule['for']):
                for name, value in rule['values'].items():
                    self.send_header(name, value)
        super().end_headers()

http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
