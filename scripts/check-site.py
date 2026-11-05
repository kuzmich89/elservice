"""Validate local references in the staged public HTML and Netlify rewrites."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import tomllib

root = Path(__file__).resolve().parents[1]
public = root / 'dist'
routes = {r['from']: r['to'] for r in tomllib.loads((root / 'netlify.toml').read_text())['redirects']}
missing = set()

class Check(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href', 'data-original'):
            value = attrs.get(key, '')
            if not value or value.startswith('#'):
                continue
            url = urlsplit(urljoin('http://site/' + str(current.relative_to(public)), value))
            if url.scheme != 'http' or url.netloc != 'site':
                continue
            path = unquote(url.path)
            resolved = public / routes.get(path, path).lstrip('/')
            if not resolved.exists():
                missing.add((str(current.relative_to(public)), value))

for current in [*public.glob('*.html'), *public.glob('en/*.html')]:
    Check().feed(current.read_text())
for path in routes.values():
    assert (public / path.lstrip('/')).is_file(), path
assert not missing, f'Missing local references: {sorted(missing)}'
for private in ('node_modules', 'tests', 'scripts', 'elservice.zip', 'artifacts'):
    assert not (public / private).exists(), private
print('PASS: all staged HTML references and rewrites resolve; development files excluded')
