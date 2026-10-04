# Shared editing: how it is set up

Members edit the site's text in the browser through an **edit link**. The edits are stored in a
free Firebase (Firestore) database and laid over the page when it loads. The site itself stays
static files on GitHub Pages.

## How it works

- `assets/js/live.js` loads every saved edit on each page view (public read) and applies it.
- Opening the site with `#edit=<passcode>` switches on edit mode (toolbar, click-to-edit,
  auto-save). Normal visitors never get the editor.
- A text can only be saved if the database rules see the passcode in the same commit
  (`firestore.rules.template`). The passcode lives only in the deployed rules and in the link.
- Everything read back from the database is sanitised before it reaches the page, so a leaked
  passcode can change wording but cannot inject script.
- Each saved text records who changed it, when, and what it replaced (`by`, `at`, `prev`).

## What exists

- Google Cloud project `norovbanzad-fnd-9x3rc` (owner: the account that signed in with
  `firebase login`), with a Firestore database `(default)` in `asia-southeast1` on the free tier.
- It is a plain Google Cloud project, not yet a "Firebase project": the Firebase console would ask
  for its terms to be accepted, which is not needed for any of this. The access rules are published
  straight to Google's rules API by `tools/deploy-rules.js`.
- `assets/js/live-config.js` holds the project id. Public reads need no API key.

To rebuild from nothing: create a Google Cloud project, enable the Firestore and Firebase Rules
APIs, create a Firestore database, put the project id in `live-config.js`, then run
`python tools/set-passcode.py --deploy`.

## Day to day

| Job | How |
|---|---|
| Send the link to a member | `firebase/.edit-secret` holds the passcode; the link is `<site>/#edit=<passcode>` |
| Change the passcode (e.g. someone left) | `python tools/set-passcode.py --deploy`, then send the new link (rules take a minute or two to reach every server) |
| Make the edits permanent in the site files | `python tools/pull-edits.py`, review `git diff`, commit, push |
| Download a backup of all edits | the **Нөөц татах** button in the edit toolbar |
| Undo a bad edit | the previous wording is stored in the database as `prev`; or retype it in edit mode |

## Limits worth knowing

- Anyone holding the edit link can change any text (not the layout). Treat it like a password.
- Last save wins if two members change the same text at the same moment.
- Photos, the layout, and adding or removing timeline rows are not editable here.
- Free tier: 50,000 reads and 20,000 writes a day; a small site stays far below that.
