"""Bake the Foundation members' saved edits into the site's own files.

Run from the project root:

    python tools/pull-edits.py              # fetch the saved edits and write them into the files
    python tools/pull-edits.py --dry-run    # show what would change, write nothing

Members' edits live in an online database and are laid over the page when it loads. This copies
them into index.html (Mongolian), assets/js/i18n.js (English) and the editable values (years,
prices, dates) so the text is part of the site itself: it then shows without JavaScript, is seen by
search engines, and no longer depends on the database. Review with `git diff`, then commit.

Standard library only; no packages to install.
"""

import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
I18N = os.path.join(ROOT, "assets", "js", "i18n.js")
CONFIG = os.path.join(ROOT, "assets", "js", "live-config.js")

ALLOWED_HREF = re.compile(r"^(#|mailto:|https?://)", re.I)
DROP = {"script", "style", "template", "iframe", "object", "embed", "noscript"}


class Clean(HTMLParser):
    """Same rule as sanitize() in main.js: keep <em>, <br>, safe <a>, the film's alt-title <span>;
    unwrap everything else; escape all text."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.skip = [], [], 0

    def handle_starttag(self, tag, attrs):
        if tag in DROP:
            self.skip += 1
            return
        if self.skip:
            return
        a = dict(attrs)
        if tag == "br":
            self.out.append("<br>")
        elif tag in ("em", "i"):
            self.out.append("<em>")
            self.stack.append("em")
        elif tag == "a" and ALLOWED_HREF.match(a.get("href") or ""):
            rel = ' rel="noopener"' if re.match(r"https?:", a["href"], re.I) else ""
            self.out.append('<a href="%s"%s>' % (html.escape(a["href"], quote=True), rel))
            self.stack.append("a")
        elif tag == "span" and a.get("class") == "product__title-alt":
            self.out.append('<span class="product__title-alt">')
            self.stack.append("span")
        else:
            self.stack.append(None)

    def handle_endtag(self, tag):
        if tag in DROP:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip or tag == "br":
            return
        if self.stack:
            t = self.stack.pop()
            if t:
                self.out.append("</%s>" % t)

    def handle_data(self, data):
        if not self.skip:
            self.out.append(html.escape(data.replace("\u00a0", " "), quote=False))


def clean_html(value):
    p = Clean()
    p.feed(value)
    p.close()
    return "".join(p.out).strip()


def read_config():
    with open(CONFIG, encoding="utf-8") as f:
        src = f.read()
    def grab(name):
        m = re.search(r"%s\s*:\s*'([^']*)'" % name, src)
        return m.group(1) if m else ""
    return grab("projectId"), grab("apiKey"), grab("endpoint")


def fetch_all(project, api_key, endpoint):
    base = (endpoint or "https://firestore.googleapis.com").rstrip("/")
    url = "%s/v1/projects/%s/databases/(default)/documents/texts" % (base, project)
    out, token = {}, None
    while True:
        q = {"pageSize": "300"}
        if token:
            q["pageToken"] = token
        if api_key:
            q["key"] = api_key
        with urllib.request.urlopen(url + "?" + urllib.parse.urlencode(q), timeout=30) as r:
            data = json.load(r)
        for d in data.get("documents", []):
            doc_id = urllib.parse.unquote(d["name"].rsplit("/", 1)[-1])
            f = d.get("fields", {}).get("html", {})
            if doc_id != "all__ping" and "stringValue" in f:
                out[doc_id] = f["stringValue"]
        token = data.get("nextPageToken")
        if not token:
            return out


def replace_element(src, attr, key, new_inner, is_year=False):
    """Replace the inner HTML of every element carrying attr="key". Returns (src, count)."""
    pat = re.compile(
        r'(<(?P<tag>[A-Za-z0-9]+)\b[^>]*?\b%s="%s"[^>]*>)(?P<inner>.*?)(</(?P=tag)>)' % (attr, re.escape(key)),
        re.S,
    )
    n = 0

    def sub(m):
        nonlocal n
        n += 1
        opening = m.group(1)
        if is_year and re.fullmatch(r"\d{4}", new_inner):
            opening = re.sub(r'datetime="[^"]*"', 'datetime="%s"' % new_inner, opening)
        return opening + new_inner + m.group(4)

    return pat.sub(sub, src), n


def js_quote(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\r", " ").replace("\n", " ") + "'"


def set_english(src, key, value):
    """Set 'key': 'value' in i18n.js, adding the line if the key is new. Returns (src, 'changed'|'added'|'same')."""
    line = re.compile(
        r"^(\s*)'%s'(\s*:\s*)(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")(\s*,?)[ \t]*$" % re.escape(key),
        re.M,
    )
    m = line.search(src)
    new_line = lambda indent, sep, tail: "%s'%s'%s%s%s" % (indent, key, sep, js_quote(value), tail)
    if m:
        replaced = new_line(m.group(1), m.group(2), m.group(3))
        if replaced == m.group(0):
            return src, "same"
        return src[: m.start()] + replaced + src[m.end():], "changed"

    end = src.rindex("};")
    head = src[:end].rstrip()
    if not head.endswith(",") and not head.endswith("{"):
        head += ","
    return head + "\n  " + new_line("", ": ", ",").lstrip() + "\n" + src[end:], "added"


def main():
    dry = "--dry-run" in sys.argv
    project, api_key, endpoint = read_config()
    for i, a in enumerate(sys.argv):
        if a == "--endpoint":
            endpoint = sys.argv[i + 1]
        if a == "--project":
            project = sys.argv[i + 1]
    if not project:
        sys.exit("No projectId in assets/js/live-config.js -- the shared editor is not set up yet.")

    edits = fetch_all(project, api_key, endpoint)
    if not edits:
        print("No saved edits on the server. Nothing to do.")
        return

    with open(INDEX, encoding="utf-8", newline="") as f:
        page = f.read()
    with open(I18N, encoding="utf-8", newline="") as f:
        eng = f.read()
    page0, eng0 = page, eng

    done, missing = {"mn": 0, "en": 0, "all": 0}, []
    for doc_id in sorted(edits):
        scope, _, key = doc_id.partition("__")
        raw = edits[doc_id]
        if scope == "mn":
            page, n = replace_element(page, "data-i18n", key, clean_html(raw))
        elif scope == "all":
            page, n = replace_element(page, "data-edit", key, html.escape(raw.strip(), quote=False), is_year=key.endswith(".y"))
        elif scope == "en":
            eng, state = set_english(eng, key, clean_html(raw))
            n = 0 if state == "same" else 1
            if state == "same":
                continue
        else:
            continue
        if n:
            done[scope] += 1
        else:
            missing.append(doc_id)

    print("Applied: %d Mongolian, %d English, %d shared values" % (done["mn"], done["en"], done["all"]))
    if missing:
        print("Not found in the page (ignored): " + ", ".join(missing))

    if dry:
        print("Dry run: nothing written.")
        return
    if page != page0:
        with open(INDEX, "w", encoding="utf-8", newline="") as f:
            f.write(page)
    if eng != eng0:
        with open(I18N, "w", encoding="utf-8", newline="") as f:
            f.write(eng)
    print("Done. Review with `git diff`, then commit.")


if __name__ == "__main__":
    main()
