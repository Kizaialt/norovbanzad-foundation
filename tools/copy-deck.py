"""Generate copy-deck.html: every editable string on the site, Mongolian and English side by side.

Run from the project root:

    python tools/copy-deck.py

The output is a searchable reference, generated from the real files so it cannot drift out of
date. Edits still go into index.html (Mongolian) and assets/js/i18n.js (English) -- see EDITING.md.

Standard library only; no packages to install.
"""

import html
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
I18N = os.path.join(ROOT, "assets", "js", "i18n.js")
OUT = os.path.join(ROOT, "copy-deck.html")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class Extractor(HTMLParser):
    """Collect the inner text of every element carrying data-i18n, in document order.

    Tracks nesting depth so a keyed element containing other tags (<em>, <br>) is captured whole
    rather than truncated at the first child.

    Also records keys used for translatable ATTRIBUTES (data-i18n-aria-label and friends). Those
    have no element text, but they are live keys -- counting them as unused would invite someone
    to delete a translation that is actually in use.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found = []          # (key, text)
        self.attr_keys = set()   # keys referenced by data-i18n-<attr>
        self._stack = []         # open tags, for depth tracking
        self._capture = None     # {'key', 'depth', 'parts'}

    def _scan_attrs(self, attrs):
        for name, value in attrs:
            if name.startswith("data-i18n-") and value:
                self.attr_keys.add(value)

    def handle_starttag(self, tag, attrs):
        self._scan_attrs(attrs)
        if tag in VOID:
            return
        self._stack.append(tag)
        if self._capture is None:
            for name, value in attrs:
                if name == "data-i18n" and value:
                    self._capture = {"key": value, "depth": len(self._stack), "parts": []}
                    break

    def handle_startendtag(self, tag, attrs):
        # e.g. <br />; contributes a space so words either side do not run together.
        self._scan_attrs(attrs)
        if self._capture:
            self._capture["parts"].append(" ")

    def handle_endtag(self, tag):
        if self._capture and len(self._stack) == self._capture["depth"]:
            text = " ".join("".join(self._capture["parts"]).split())
            self.found.append((self._capture["key"], text))
            self._capture = None
        if self._stack and self._stack[-1] == tag:
            self._stack.pop()
        elif tag in self._stack:            # tolerate stray/unmatched close tags
            while self._stack and self._stack.pop() != tag:
                pass

    def handle_data(self, data):
        if self._capture:
            self._capture["parts"].append(data)


def read(path):
    if not os.path.exists(path):
        sys.exit("copy-deck.py: cannot find %s -- run this from the project root." % path)
    with open(path, encoding="utf-8") as f:
        return f.read()


def parse_english(src):
    """Pull 'key': 'value' pairs out of i18n.js.

    Values may be single- or double-quoted and may contain escaped quotes, so the closing quote is
    matched only when not preceded by a backslash.
    """
    out = {}
    pattern = re.compile(
        r"^\s*'([^']+)'\s*:\s*"          # 'key':
        r"(?:'((?:\\.|[^'\\])*)'"        #   '...'
        r"|\"((?:\\.|[^\"\\])*)\")"      #   or "..."
        r"\s*,?\s*$",
        re.MULTILINE,
    )
    for m in pattern.finditer(src):
        raw = m.group(2) if m.group(2) is not None else m.group(3)
        out[m.group(1)] = raw.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")
    return out


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s)


def main():
    parser = Extractor()
    parser.feed(read(INDEX))
    mn_pairs = parser.found
    en = parse_english(read(I18N))

    seen = set()
    rows = []
    for key, mn in mn_pairs:
        if key in seen:              # a key reused in nav and footer: list it once
            continue
        seen.add(key)
        rows.append((key, mn, en.get(key)))

    # A key can be live in three ways: as element text (data-i18n), as an attribute
    # (data-i18n-aria-label), or referenced from JS -- main.js pulls the form's error strings
    # through t('key', ...). Only a key in none of those is genuinely unused.
    js_src = ""
    js_path = os.path.join(ROOT, "assets", "js", "main.js")
    if os.path.exists(js_path):
        with open(js_path, encoding="utf-8") as f:
            js_src = f.read()
    js_keys = set(re.findall(r"t\(\s*'([^']+)'", js_src))

    referenced = seen | parser.attr_keys | js_keys
    missing_en = [k for k, _, e in rows if e is None]
    orphan_en = [k for k in en if k not in referenced]
    placeholders = sum(1 for _, mn, e in rows
                       if "[" in mn or (e and "[" in e))

    tr = []
    for key, mn, e in rows:
        flag = "" if e is not None else ' <span class="warn">no English</span>'
        ph = ' <span class="ph">placeholder</span>' if ("[" in mn or (e and "[" in e)) else ""
        tr.append(
            '<tr><td class="k"><code>%s</code>%s%s</td><td lang="mn">%s</td><td lang="en">%s</td></tr>'
            % (html.escape(key), flag, ph,
               html.escape(strip_tags(mn)),
               html.escape(strip_tags(e)) if e else "&mdash;")
        )

    page = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Copy deck — Norovbanzad Foundation</title>
<style>
 body{margin:0;background:#faf7f2;color:#1b1b22;font:15px/1.55 -apple-system,"Segoe UI",sans-serif}
 .wrap{max-width:1100px;margin:0 auto;padding:32px 24px 64px}
 h1{font-family:Georgia,serif;font-size:1.7rem;margin:0 0 6px}
 p.sub{color:#4a4a55;margin:0 0 20px}
 .stats{display:flex;gap:22px;flex-wrap:wrap;margin:0 0 20px;font-size:.85rem;color:#4a4a55}
 .stats b{color:#1b1b22}
 input{width:100%;padding:11px 14px;font-size:1rem;border:1px solid rgba(27,27,34,.25);
       border-radius:3px;background:#fff;margin-bottom:18px}
 table{width:100%;border-collapse:collapse;font-size:.86rem}
 th{text-align:left;border-bottom:1px solid rgba(27,27,34,.25);padding:8px 10px;
    position:sticky;top:0;background:#faf7f2}
 td{border-bottom:1px solid rgba(27,27,34,.10);padding:9px 10px;vertical-align:top}
 td.k{white-space:nowrap;width:1%}
 code{background:#f1ebe1;padding:1px 5px;border-radius:2px;font-size:.85em}
 .warn{color:#7a2e2e;font-size:.78em;margin-left:5px}
 .ph{color:#8f7328;font-size:.78em;margin-left:5px}
 tr:target,tr.hit{background:#fffbef}
 .note{margin-top:26px;padding:14px 16px;background:#f1ebe1;border-radius:3px;
       font-size:.85rem;color:#4a4a55}
</style></head><body><div class="wrap">
<h1>Copy deck</h1>
<p class="sub">Every editable string on the site. Mongolian is edited in <code>index.html</code>;
English in <code>assets/js/i18n.js</code>. This page is generated — do not edit it.</p>
<div class="stats">
  <span><b>__N__</b> strings</span>
  <span><b>__PH__</b> containing placeholders</span>
  <span><b>__MISS__</b> missing English</span>
  <span><b>__ORPH__</b> unused English keys</span>
</div>
<input id="q" placeholder="Filter — type any Mongolian or English word, or a key…" autofocus>
<table><thead><tr><th>Key</th><th>Mongolian (index.html)</th><th>English (i18n.js)</th></tr></thead>
<tbody id="tb">
__ROWS__
</tbody></table>
<div class="note">To change a line: find its key here, then edit that key in
<code>index.html</code> for Mongolian and <code>assets/js/i18n.js</code> for English.
Full instructions in <code>EDITING.md</code>.</div>
</div>
<script>
var q=document.getElementById('q'),rows=[].slice.call(document.querySelectorAll('#tb tr'));
q.addEventListener('input',function(){
  var t=q.value.trim().toLowerCase();
  rows.forEach(function(r){
    r.style.display=(!t||r.textContent.toLowerCase().indexOf(t)>-1)?'':'none';
  });
});
</script>
</body></html>"""

    page = (page.replace("__ROWS__", "\n".join(tr))
                .replace("__N__", str(len(rows)))
                .replace("__PH__", str(placeholders))
                .replace("__MISS__", str(len(missing_en)))
                .replace("__ORPH__", str(len(orphan_en))))

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)

    print("Wrote %s" % os.path.relpath(OUT, ROOT))
    print("  %d strings, %d with placeholders" % (len(rows), placeholders))
    if missing_en:
        print("  %d missing English: %s" % (len(missing_en), ", ".join(missing_en[:8])))
    if orphan_en:
        print("  %d unused English keys: %s" % (len(orphan_en), ", ".join(sorted(orphan_en)[:8])))


if __name__ == "__main__":
    main()
