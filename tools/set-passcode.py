"""Set (or change) the passcode that lets Foundation members edit the site's text.

Run from the project root:

    python tools/set-passcode.py            # new random passcode
    python tools/set-passcode.py my-phrase  # or choose your own (letters, digits, - . _ only)

It writes firebase/firestore.rules (never committed), saves the passcode to
firebase/.edit-secret (never committed), and prints the edit link to send to members.
Add --deploy to publish the new rules straight away (needs `firebase login` first).

Changing the passcode locks out anyone holding the old link: send them the new one.
"""

import os
import re
import secrets
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, "firebase", "firestore.rules.template")
RULES = os.path.join(ROOT, "firebase", "firestore.rules")
SECRET = os.path.join(ROOT, "firebase", ".edit-secret")
SITE = "https://kizaialt.github.io/norovbanzad-foundation/"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    deploy = "--deploy" in sys.argv

    if args:
        passcode = args[0]
        if not re.fullmatch(r"[A-Za-z0-9._-]{8,60}", passcode):
            sys.exit("Passcode must be 8-60 characters: letters, digits, - . _ only.")
    else:
        alphabet = "abcdefghjkmnpqrstuvwxyz23456789"          # no look-alikes (l, 1, o, 0, i)
        parts = ["".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(5)]
        passcode = "-".join(parts)

    with open(TEMPLATE, encoding="utf-8") as f:
        rules = f.read().replace("__PASSCODE__", passcode)
    with open(RULES, "w", encoding="utf-8", newline="\n") as f:
        f.write(rules)
    with open(SECRET, "w", encoding="utf-8", newline="\n") as f:
        f.write(passcode + "\n")

    print("Passcode written to firebase/firestore.rules and firebase/.edit-secret")
    print()
    print("Edit link (send this to members):")
    print("  %s#edit=%s" % (SITE, passcode))
    print()

    if deploy:
        subprocess.check_call(["firebase", "deploy", "--only", "firestore:rules"], cwd=ROOT, shell=(os.name == "nt"))
    else:
        print("Not published yet. Run:  firebase deploy --only firestore:rules")


if __name__ == "__main__":
    main()
