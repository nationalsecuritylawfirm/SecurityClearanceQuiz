# Plan 4: De-duplicate the 4× inlined code — DO THIS FIRST

## Problem

Each of the four HTML pages inlines its own full copy of (a) the CSS theme,
(b) the `Storage` object, and (c) the entire `SEED_QUIZZES` dataset — which is
why `index.html` is 89 KB at 228 lines. The standalone `js/storage.js`,
`js/seed.js`, and `css/app.css` files are referenced by **no page**, and
`js/storage.js` is stale (it lacks the version-aware seed merge the inlined
copies have). Every change to storage or content currently means editing four
files in sync — and Plans 1–3 all change storage.

## Goal

Shared code lives in exactly one file per concern; pages reference it via
`<link>`/`<script src>`. Zero behavior change — this is a pure refactor that
makes Plans 1–3 four-times cheaper.

## Sequencing

This plan runs **before** Plans 1–3. Order overall:
**4 (dedup) → 1+3 (API, built together) → 2 (auth) → deploy.**

## Design

Target layout:

```
css/app.css       # the one true stylesheet (base theme from the inlined copy,
                  #   merged with page-specific sections)
js/storage.js     # the one true Storage object — the CURRENT inlined version
                  #   (version-aware seed merge), replacing the stale file
js/seed.js        # already canonical; pages load it via <script src>
```

Notes:

- **Which copy wins:** the inlined copies in the HTML pages are the live code; the `js/` files are the stale ones. Diff each inlined copy against its siblings first — if the four inlined Storage copies have drifted from *each other*, reconcile intentionally and note what differed.
- **CSS:** the base theme (~200 lines) is identical across pages; each page also has a small page-specific block (e.g. `.lead-capture` in quiz.html). Move the shared base into `css/app.css`; keep genuinely page-specific rules in a small inline `<style>` per page — don't force everything into one file.
- **Page-specific app logic** (quiz flow, builder UI, dashboard rendering) stays inline in its page — it isn't duplicated, so extracting it buys nothing.
- No bundler, no modules, no build step — plain `<script src>` in dependency order (`seed.js` before `storage.js` before page logic), same as the code is written today.

## Steps

1. `diff` the four inlined Storage copies against each other; reconcile into one canonical version.
2. Overwrite `js/storage.js` with the canonical version; delete the four inlined copies; add `<script src="js/seed.js">` + `<script src="js/storage.js">` to each page.
3. Extract the shared CSS base into `css/app.css` (overwriting the current unused file after diffing it too); replace inlined base styles with `<link rel="stylesheet">`; leave page-specific styles inline.
4. Remove the inlined `SEED_QUIZZES` from all pages (they now load `js/seed.js`).
5. Verify each page over `python3 -m http.server 3400` (the existing launch config): take a quiz end-to-end, check admin renders responses, builder loads/saves, index lists quizzes. Clear localStorage and confirm seeding still works.
6. Commit as a standalone no-behavior-change commit before starting Plan 1.

## Acceptance criteria

- `grep -c 'const Storage' *.html` → 0; `grep -c 'SEED_QUIZZES = \[' *.html` → 0.
- All four pages function identically to before (manual pass per step 5).
- `index.html` drops from ~89 KB to a few KB.
- One place to edit for Plans 1–3's storage swap.

## Risks / notes

- If the inlined copies have silently drifted (e.g. builder's Storage differs from quiz's), reconciliation is a behavior decision, not a mechanical merge — surface any diffs before choosing.
- Multi-file static sites need no special Netlify config; relative paths keep local `http.server` testing working.
