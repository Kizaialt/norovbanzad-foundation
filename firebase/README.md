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

## One-time setup

```bash
firebase login
firebase projects:create <project-id> --display-name "Norovbanzad Foundation"
firebase use <project-id>
firebase firestore:databases:create "(default)" --location asia-southeast1
python tools/set-passcode.py --deploy      # prints the edit link
```

Then put the project id in `assets/js/live-config.js` (`projectId`) and push.

## Day to day

| Job | How |
|---|---|
| Send the link to a member | `firebase/.edit-secret` holds the passcode; the link is `<site>/#edit=<passcode>` |
| Change the passcode (e.g. someone left) | `python tools/set-passcode.py --deploy`, send the new link |
| Make the edits permanent in the site files | `python tools/pull-edits.py`, review `git diff`, commit, push |
| Download a backup of all edits | the **Нөөц татах** button in the edit toolbar |
| Undo a bad edit | the previous wording is stored in the database as `prev`; or retype it in edit mode |

## Limits worth knowing

- Anyone holding the edit link can change any text (not the layout). Treat it like a password.
- Last save wins if two members change the same text at the same moment.
- Photos, the layout, and adding or removing timeline rows are not editable here.
- Free tier: 50,000 reads and 20,000 writes a day; a small site stays far below that.
