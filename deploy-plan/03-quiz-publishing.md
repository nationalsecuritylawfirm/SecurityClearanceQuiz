# Plan 3: Server-Stored Quizzes (live publish from the builder)

## Problem

Quizzes "saved" in builder.html exist only in that browser's localStorage.
Visitors never see edits; the only real publish path today is editing the
inlined seed data in four HTML files and redeploying.

## Goal

The builder saves quizzes to the server; `index.html` and `quiz.html` fetch
them at runtime. Editing → publishing is immediate, no redeploy.

## Design

Same Function + Blobs store as Plan 1 (one API, one store — these two plans
are built together).

**Blobs layout additions:**

| Key | Value |
|---|---|
| `quizzes/<id>` | one quiz JSON per quiz (same shape as today's `SEED_QUIZZES` entries) |

**Quiz shape addition:** a `published: boolean` field. The builder can hold
drafts server-side without exposing them; public endpoints only return
published quizzes.

**Endpoints:**

- `GET /api/quizzes` — public. Published quizzes only, trimmed for listing (id, slug, title, subtitle, question count).
- `GET /api/quizzes/:idOrSlug` — public for published quizzes (404 for drafts without admin auth); full quiz including drafts with a valid admin token.
- `PUT /api/quizzes/:id` — admin auth. Upsert full quiz JSON. Server bumps `version` and `updatedAt`.
- `DELETE /api/quizzes/:id` — admin auth.

**Seeding & the fate of `js/seed.js`:** the existing seed data becomes
one-time import material, not runtime data.

- Add a small script `scripts/seed.mjs` that reads `SEED_QUIZZES` and PUTs each quiz via the API. It authenticates with a Google ID token pasted from the browser's devtools (network tab, any admin API request) into an env var after signing in (Plan 2) — tokens live ~1 hour, plenty for a seed run. Run once against production, and any time against `netlify dev` for local resets.
- Remove the inlined `SEED_QUIZZES` and the version-merge `init()` logic from all four pages (~70 KB per page gone). Keep `js/seed.js` in the repo as the canonical import source / disaster-recovery copy.

**Page changes:**

- `index.html`: render quiz cards from `GET /api/quizzes`; loading + "no quizzes" states.
- `quiz.html`: fetch quiz by slug from the URL param; 404 state for unknown/unpublished slugs.
- `builder.html`: load/save via API instead of localStorage; add a publish/draft toggle; unsaved-changes warning stays purely client-side.
- Scoring (`scoreAnswers`) stays client-side — it's pure logic over the fetched quiz; no reason to move it.

**Caching:** serve `GET /api/quizzes*` with `Cache-Control: public, max-age=60`
so quiz-taking traffic mostly doesn't hit the function, while builder edits
still appear within a minute.

## Steps

1. Extend `netlify/functions/api.mjs` with the four quiz endpoints (shared `requireGoogleAuth()` helper from Plan 2).
2. Add `published` handling to builder save/list UI.
3. Write `scripts/seed.mjs`; run against `netlify dev`, verify all 5 seed quizzes round-trip.
4. Convert the three consumer pages to fetch-based loading with loading/error/404 states.
5. Strip inlined seed data + merge logic from all pages (coordinates with Plan 4).
6. After production deploy: run the seed script once, spot-check every quiz end-to-end.

## Acceptance criteria

- Edit a quiz title in the builder → refresh index.html in another browser → new title appears (within cache window).
- A quiz toggled to draft disappears from the public list and its direct URL 404s, but remains editable in the builder.
- Fresh deploy + seed script reproduces all current quizzes exactly (diff the JSON).
- Quiz pages work with JavaScript network failures degraded gracefully (error message, not a blank page).

## Risks / notes

- Quiz content now lives outside git — no history, no review, and a bad builder save is live immediately. Mitigation for one admin: the builder's existing export button becomes "export backup JSON"; export before big edits. If this ever feels risky, the fallback posture is Plan 3-alt (git-as-CMS), which the seed script keeps viable.
- Two sources of truth during transition (localStorage vs server): the cutover in step 5 must remove all localStorage quiz reads in the same deploy that pages go fetch-based, or stale browsers will show ghost quizzes.
