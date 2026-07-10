# Plan 1: Lead & Response Backend (Netlify Function + Netlify Blobs)

## Problem

Quiz responses — including captured name/email/phone — are saved only to the
visitor's own browser localStorage (`ql_responses`). In production the admin
dashboard reads the *admin's* localStorage and will always be empty. Leads are
silently lost.

## Goal

Every completed quiz submission is persisted server-side and visible in
`admin.html` from any browser. Visitor-side behavior is unchanged (same form,
same result screen).

## Design

One Netlify Function acting as a small JSON API, backed by a Netlify Blobs
store. Sized for one admin + low traffic — no database, no third-party account.

**New repo scaffolding** (this repo gains npm, but still no build step for the
site itself — Netlify bundles functions automatically):

```
package.json                     # dependency: @netlify/blobs
netlify.toml                     # functions dir, redirects /api/* → function
netlify/functions/api.mjs        # the API (shared with Plan 3)
js/api.js                        # browser-side client, replaces Storage's localStorage calls
```

**Blobs layout** — store `quiz-app`:

| Key | Value |
|---|---|
| `responses/<id>` | one response JSON per submission |

One blob per response (not one big array) so concurrent submissions can't
clobber each other; Blobs has no read-modify-write atomicity.

**Endpoints (response-related):**

- `POST /api/responses` — public. Body: `{quizId, answers, lead: {name, email, phone}, result}`. Server assigns id + timestamp (don't trust client). Validates: known quizId, email present/shaped, payload size cap (~10 KB). Returns `201 {id}`.
- `GET /api/responses` — Google-authenticated admins only (see Plan 2). Lists all responses, newest first, for the dashboard.
- `DELETE /api/responses/:id` and `DELETE /api/responses` — Google-authenticated admins only. Powers the existing delete/clear buttons.

**Spam control** (public POST endpoint, low stakes at this traffic level):

- Honeypot field in the lead form (hidden input; reject if filled).
- Reject non-JSON / oversized bodies.
- That's enough for now; add per-IP rate limiting later only if junk shows up.

## Steps

1. `npm init -y`, add `@netlify/blobs`; create `netlify.toml` with `[functions] directory = "netlify/functions"` and a redirect from `/api/*` to `/.netlify/functions/api/:splat`.
2. Write `netlify/functions/api.mjs` with the three response endpoints above (quiz endpoints come from Plan 3 into the same file).
3. Write `js/api.js` exposing the same method names the pages already call (`saveResponse`, `getResponses`, `deleteResponse`, `clearResponses`) but backed by `fetch()`. Admin methods attach the in-memory Google ID token as a bearer header; on 401 they silently re-acquire and retry once, else surface the sign-in button (Plan 2).
4. In `quiz.html`: on lead-form submit, `await Api.saveResponse(...)`; show the existing success state on 201, and an inline "something went wrong, try again" state on failure (today failure is impossible, so no such state exists).
5. In `admin.html`: dashboard loads via `await Api.getResponses()`; add a simple loading/empty/error state.
6. Test locally with `netlify dev` (serves functions + Blobs emulation), then deploy.

Depends on Plan 4 (dedup) being done first, so `Storage` is swapped in one
place instead of four.

## Acceptance criteria

- Submit a quiz in an incognito window → response appears in admin.html in a normal window (different browser profile = proof it's server-side).
- Lead form failure (kill network) shows an error, doesn't fake success.
- `GET /api/responses` without a valid Google ID token returns 401.
- Honeypot-filled submission returns 200-shaped success to the bot but stores nothing.

## Risks / notes

- Netlify Blobs free tier is fine for this volume; listing all responses on every dashboard load is O(n) blob reads — acceptable for hundreds of leads, revisit if it grows.
- localStorage responses from the pre-production era won't migrate; if any matter, export them manually from the browser before cutover.
- PII now lives in Netlify Blobs — note it in whatever privacy policy the firm ships.
