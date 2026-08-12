# Editing the site

Everything on this site is plain text files. There is no database, no login, no build step.
You edit a file, save it, and the change is live the next time the site is uploaded.

Use any plain-text editor. [VS Code](https://code.visualstudio.com/) is free and will colour the
code so it is easier to see what you are doing. **Do not use Microsoft Word** — it inserts
invisible formatting that breaks the files.

---

## The one rule

Every piece of text lives in **one of two files**:

| Language | File | Why there |
|---|---|---|
| **Mongolian** | `index.html` | Mongolian is the site's real content — it is what Google indexes and what shows even if the page's scripts fail to load. |
| **English** | `assets/js/i18n.js` | English is a translation layer applied on top. |

They are linked by a short **key** such as `hero.title` or `a.1946`. The same key appears in both
files, so once you know the key you know exactly which two lines to edit.

---

## Changing a piece of text — worked example

Say you want to change the hero sentence.

### 1. Find it in Mongolian

Open `index.html`, search (`Ctrl+F`) for a few words you can see on the page:

```
Нэг гэр бүлийн хоёр амьдрал
```

You will land on this:

```html
<p class="hero__lede" data-i18n="hero.lede">
  Нэг гэр бүлийн хоёр амьдрал, Монголын хоёр их урлаг — ...
</p>
```

**Edit only the text between `>` and `</p>`.** Leave everything else exactly as it is.

Note the key: `data-i18n="hero.lede"`.

### 2. Change the English to match

Open `assets/js/i18n.js`, search for that key:

```js
'hero.lede': 'Two lives in one household, and two of Mongolia\'s great arts — ...',
```

Edit only the text **between the quotes**. Keep the quotes, keep the comma at the end.

### 3. Check it

Open `index.html` in a browser and use the **МН / EN** switch at the top right to see both.

---

## Things that will break the page

These are the only real ways to go wrong:

- **Deleting a `<` or `>`.** Text lives *between* tags, never inside them.
- **Removing `data-i18n="..."`.** That is the link to the English version. If it disappears, the
  English translation stops working for that line.
- **Forgetting a quote or comma in `i18n.js`.** Every line there ends `',` — if you delete one,
  every language switch on the site stops working. This file is stricter than the HTML.
- **An apostrophe inside English text.** In `i18n.js` the text is wrapped in `'single quotes'`,
  so a bare apostrophe ends the text early. Write `\'` instead — for example
  `'Mongolia\'s great arts'`. (Mongolian text in `index.html` has no such restriction.)

If something breaks, undo your change (`Ctrl+Z`) — or, if the site is in Git, `git checkout` the
file to restore it.

---

## Finding which key you need

Run this to produce a searchable list of every editable string with its key, its Mongolian and its
English side by side:

```bash
python tools/copy-deck.py
```

It writes `copy-deck.html`. Open it in a browser and type any word to filter. It is generated from
the real files, so it is never out of date. It is a *reference* — you still make edits in
`index.html` and `i18n.js`.

---

## What still needs filling in

The site ships with bracketed placeholders wherever a fact was not publicly available. Search
`index.html` for `[` to find them all. As of now:

| Marker | Count | What it wants |
|---|---|---|
| `[БАЙРШУУЛАХ: ...]` | 28 | A sentence or paragraph — the bracket says what belongs there |
| `[ТОО]` | 4 | The numbers in the statistics row |
| `[ҮНЭ]` | 4 | Shop prices |
| `[ОН]` | 3 | Years missing from Banzragch's timeline |
| `[ОГНОО]` / `[САР]` | 5 | News and event dates |
| `[IMAGE]` | 7 | Image slots (see `assets/img/README.md`) |
| `[SKU]` | 4 | Product codes, only needed when the shop goes live |
| `[CREDIT]` | 2 | Photo attribution |
| `[PLACEHOLDER-EMAIL]` | 1 | The Foundation's email address |

**Every placeholder must be gone before launch.** They are written in brackets specifically so
that anything missed is obvious on the page rather than quietly wrong.

### Still unverified

Three facts I could not confirm from published sources — please check them against your own
records:

1. **Their children.** Mongolian Wikipedia says three sons; a detailed *24tsag* article says three
   daughters and names the youngest as Delgerma. I left this off the site entirely rather than
   guess.
2. **Hero of Labour year.** Mongolian Wikipedia says 1999; *24tsag* says 1997. Currently omitted.
3. **Banzragch's undated milestones** — his years at the Gorky Institute, the year of the
   D. Natsagdorj Prize, and the year of *Хошуу цагаан нутаг*.

### The Mongolian needs a native review

The Mongolian copy was drafted from published sources and has **not** been reviewed by a native
speaker. It carries the names of two national figures. Please read it through and make the
phrasing yours before the site goes public.

---

## Common jobs

### Add a news item or event

In `index.html`, find `<!-- ============ NEWS & EVENTS ============ -->`. Copy an entire existing
`<article class="post">` or `<article class="event">` block, paste it below, and edit the text.

Two things to keep correct:

- `datetime="2026-01-01"` must be a real date in `YYYY-MM-DD` form. This is what machines read;
  the visible date is the separate text next to it.
- If you copy a block, its `data-i18n` keys are duplicated. Either give the copy new keys and add
  them to `i18n.js`, or delete the `data-i18n` attributes from the copy — in which case that item
  shows the same text in both languages.

Delete any placeholder items you do not use. **An empty or stale news section makes a foundation
look closed** — this is the part of the site most worth keeping current.

### Add a photograph

See `assets/img/README.md` for file names, sizes, and the exact steps.

### Change contact details

`index.html`, search for `contact-details`. Also update the `mailto:` address, which appears twice
on the same line:

```html
<a href="mailto:info@example.mn" data-i18n="ct.v.email">info@example.mn</a>
```

### Turn on the contact form

The form currently tells visitors it is not connected. To activate it, sign up with a form service
(such as Formspree or Netlify Forms), then paste the address they give you into the empty
`data-endpoint`:

```html
<form class="contact-form" id="contact-form" data-endpoint="https://formspree.io/f/xxxxxxx">
```

That is the whole change — no code edit needed.

### Open the shop

Deliberately left inactive. See the `STORE INTEGRATION NOTE` comment in `index.html` above the
shop section. **Do not add prices or a buy button until the payment backend actually works** — a
shop that looks open but cannot take an order is worse than one honestly marked closed.

---

## Previewing before you publish

Double-clicking `index.html` works for checking text. For the language switch and everything else
to behave exactly as it will live, run a local server from the project folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. Press `Ctrl+C` in the terminal to stop it.

---

## Do not edit these

Unless you are changing the design:

- `assets/css/*.css` — colours, spacing, layout
- `assets/js/main.js` — the language switch, menu, and form logic

---

## If this feels too fiddly

Editing HTML by hand is reasonable for occasional corrections but is not a good long-term answer
if several people will be updating the site, or if news is posted often. The usual next step is a
small CMS (Decap and Sanity both have free tiers) which gives you a login and a form-based editor
while keeping these same files underneath. Worth doing if the news section is going to be genuinely
active. Ask and it can be set up.
