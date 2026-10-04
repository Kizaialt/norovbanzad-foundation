"""Save a copy of every text members have edited, as one JSON file.

    python tools/backup-texts.py [output.json]        (default: backups/texts.json)

Reads the live database (public read, no passcode) and writes the result with sorted keys, so
successive backups only differ where texts changed. Run on a schedule by
.github/workflows/backup-texts.yml, which keeps every version in git. Safe to run by hand.

Exits with an error, and writes nothing, if the database could not be read: a failed read must
never overwrite a good backup with an empty one.
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def project_id():
    with open(os.path.join(ROOT, "assets", "js", "live-config.js"), encoding="utf-8") as f:
        m = re.search(r"projectId\s*:\s*'([^']+)'", f.read())
    if not m:
        sys.exit("No projectId in assets/js/live-config.js")
    return m.group(1)


def fetch_page(url):
    # Right after a rules change the database can refuse a read now and then; try a few times.
    for attempt in range(6):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return json.load(r)
        except Exception as e:                      # noqa: BLE001 - any failure is retried
            last = e
            time.sleep(2 * (attempt + 1))
    sys.exit("Could not read the database: %s" % last)


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "backups", "texts.json")
    base = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/texts" % project_id()
    texts, token = {}, None
    while True:
        q = {"pageSize": "300"}
        if token:
            q["pageToken"] = token
        data = fetch_page(base + "?" + urllib.parse.urlencode(q))
        for d in data.get("documents", []):
            doc_id = urllib.parse.unquote(d["name"].rsplit("/", 1)[-1])
            if doc_id == "all__ping":
                continue
            f = d.get("fields", {})
            texts[doc_id] = {k: f[k]["stringValue"] for k in ("html", "by", "at", "prev") if k in f and "stringValue" in f[k]}
        token = data.get("nextPageToken")
        if not token:
            break

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(texts, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print("Backed up %d texts to %s" % (len(texts), out_path))


if __name__ == "__main__":
    main()
