"""Dependency-free static website checks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.references, self.images = set(), [], []
        self.h1 = 0
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, 'Duplicate ID: ' + attrs['id']
            self.ids.add(attrs['id'])
        self.h1 += tag == 'h1'
        for key in ('href', 'src'):
            if key in attrs:
                self.references.append(attrs[key])
        if tag == 'img':
            assert 'alt' in attrs, 'Image missing alternative text'
            assert 'width' in attrs and 'height' in attrs, 'Image dimensions missing'

pages = {p.name: Page(p.read_text(encoding='utf-8')) for p in ROOT.glob('*.html')}
for name, page in pages.items():
    assert page.h1 == 1, f'{name}: expected one h1'
    for ref in page.references:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        path = unquote(url.path)
        target = (ROOT / path).resolve() if path else ROOT / name
        if target.is_dir():
            target /= 'index.html'
        assert target.is_relative_to(ROOT), f'Outside site: {ref}'
        assert target.exists(), f'Missing local reference: {ref}'
        if url.fragment and target.name in pages:
            assert url.fragment in pages[target.name].ids, f'Missing anchor: {ref}'
ET.parse(ROOT / 'sitemap.xml')
assert (ROOT / 'CNAME').read_text().strip() == 'unclebearstudios.com'
print(f'Passed: {len(pages)} page(s), local references, anchors, image attributes, sitemap, domain.')
