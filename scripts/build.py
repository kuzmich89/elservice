"""Render and stage only the public website."""
from pathlib import Path
from shutil import copy2, copytree, rmtree
from generate import generate

root = Path(__file__).resolve().parents[1]
output = root / 'dist'
if output.exists():
    rmtree(output)
output.mkdir()
generate(output)
copytree(root / 'assets', output / 'assets')
for name in ('404.html', 'robots.txt', 'sitemap.xml'):
    copy2(root / name, output / name)
print(f'Built static site in {output}')
