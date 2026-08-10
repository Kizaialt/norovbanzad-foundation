# Images

## Expected files

| Path | Used by | Notes |
|---|---|---|
| `norovbanzad-portrait.jpg` | Branch One | Portrait of Namjilyn Norovbanzad. 4:5 crop, ≥800px wide. |
| `banzragch-portrait.jpg`   | Branch Two | Portrait of Namsrain Banzragch. 4:5 crop, ≥800px wide. |

While a file is absent the page shows a dashed frame naming the expected path, so a missing
image is obvious rather than silently collapsing the layout.

## When adding a photo

1. Drop the file at the path above.
2. In `index.html`, remove `portrait--empty` from that `<figure>`'s class list.
3. Fill in the `alt` attribute with a real description (not "photo of X" — describe what is
   happening in the image).
4. Replace `[CREDIT]` with the attribution, and the caption placeholder with real text
   (Mongolian in `index.html`, English in `assets/js/i18n.js`).

## Rights

Archival photographs of both figures are likely to carry attribution or licensing conditions.
Confirm the Foundation holds the right to publish each image before it goes live — a portrait
of a national figure is exactly the kind of asset a rights-holder will notice.

## Optimisation

Keep files under ~300KB. Export at 2x the display size (roughly 800×1000 for the portraits),
save as JPEG at quality ~80, or supply WebP with a JPEG fallback if you add a `<picture>`.
`width`/`height` are already set in the markup to prevent layout shift while loading.
