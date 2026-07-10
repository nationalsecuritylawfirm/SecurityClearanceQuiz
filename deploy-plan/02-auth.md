# Plan 2: Protect admin.html and builder.html (Google SSO, zero secrets)

## Problem

`admin.html` (lead PII) and `builder.html` (content editing) are plain static
pages, linked from the public navbar, reachable by anyone who finds the URL.

## Goal

Only authorized staff can view leads or edit quizzes, signing in with their
Google accounts — no shared password, no server-held secrets of any kind,
revocation is removing an email from one env var. Three admins:

- `beaudekker@lightsight.ai`
- `katherine@nationalsecuritylawfirm.com`
- `jacksonrudd@lightsight.ai`

## Design

Google Identity Services (GIS) sign-in on the two internal pages; every admin
API call carries a Google **ID token** which the Function verifies statelessly
against Google's public keys. There is no session of our own — no cookie, no
`SESSION_SECRET`, no server-side session state, and nothing persisted in the
browser. The two env vars this needs (`GOOGLE_CLIENT_ID`, `ALLOWED_EMAILS`)
are not secrets.

**Sign-in flow:**

1. `admin.html` / `builder.html` load the GIS script (`https://accounts.google.com/gsi/client`) — the one external script the site ships, internal pages only — initialized with `auto_select: true`, and render a "Sign in with Google" button.
2. On sign-in, GIS hands the page a Google ID token (a JWT, ~1 h lifetime). It is held in a **plain JS variable only** — never written to localStorage, sessionStorage, or a cookie.
3. `js/api.js` attaches it to admin calls as `Authorization: Bearer <token>`.
4. The Function verifies it with `jose` against Google's published keys (JWKS at `https://www.googleapis.com/oauth2/v3/certs`; `jose` caches the keys), checking: signature, `iss` is Google, `aud` equals our `GOOGLE_CLIENT_ID`, not expired, `email_verified`, and `email` is in the `ALLOWED_EMAILS` list (case-insensitive, exact-match — deliberately not domain-wide, since the admins span two domains and not everyone at either domain should have access).

**Token expiry — silent re-acquisition, not sessions:** Google maintains the
consent grant per user + client ID, so after the first sign-in, a fresh ID
token can be re-acquired without interaction while the user still has an
active Google session. The pattern:

- **Reactively on a 401** (not on a timer — tokens can be invalidated early): `js/api.js` calls `google.accounts.id.prompt()`; with `auto_select: true` and an existing grant this resolves silently with a new token, and the failed request is retried **once**.
- If silent re-auth can't complete (Google session lapsed, consent revoked, One Tap cooldown, restrictive third-party-cookie/FedCM settings), fall back to showing the sign-in button again. Silent is best-effort by design — the fallback path is part of the implementation, not an edge case to skip.

Net effect: sign in roughly once per browser session; page refreshes and new
tabs re-acquire silently; nothing to store means nothing to steal at rest.

**Environment variables (Netlify UI — neither is secret):**

| Var | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `ALLOWED_EMAILS` | `beaudekker@lightsight.ai,katherine@nationalsecuritylawfirm.com,jacksonrudd@lightsight.ai` |

**Google Cloud Console setup (~10 min, one-time):** create an OAuth 2.0
Client ID (type "Web application"); authorized JavaScript origins = the
production domain **and** `http://localhost:8888` (for `netlify dev`). No
redirect URIs, no client secret used anywhere. (Aside: this is also why we're
not using an Authorization-Code+PKCE flow — Google requires a client secret
for web-app clients even with PKCE; GIS is Google's sanctioned public-client
path, and for pure sign-in it lands in the same place.)

**Protected endpoints:** `GET/DELETE /api/responses*`, `PUT/DELETE
/api/quizzes/*`, and draft quiz reads (Plan 3) — all via a shared
`requireGoogleAuth()` helper. "Logout" is closing the tab; there is nothing
server-side or persisted to clear.

**Public surface stays public:** `index.html`, `quiz.html`, `GET /api/quizzes`
(published only), `POST /api/responses`.

**Page exposure posture:** the admin/builder HTML ships as public shells —
anyone can fetch the markup, but every byte of data sits behind token
verification, so strangers see an empty page with a Google button. Works on
**any Netlify plan**. If shell exposure ever bothers you, the later hardening
step is a Netlify Edge Function gating those two paths.

**Navbar:** remove Admin/Builder links from `index.html` and `quiz.html` —
no reason to advertise the URLs to visitors.

## Steps

1. Create the OAuth client in Google Cloud Console; set the two env vars in Netlify (and a local `.env` for `netlify dev`).
2. Add `jose` to package.json. In `netlify/functions/api.mjs`: implement the `requireGoogleAuth()` helper (JWKS verify + claim checks above); apply it to all admin endpoints.
3. Add the GIS script + sign-in button to `admin.html` and `builder.html`; wire `js/api.js` to attach the bearer token, and on 401: silent `prompt()` → retry once → else surface the sign-in button.
4. Remove Admin/Builder from the public navbar (the two internal pages remain linked to each other).
5. Verify locally with `netlify dev` (localhost:8888 must be an authorized origin), then in production.

## Acceptance criteria

- All admin endpoints return 401 without a valid, unexpired Google ID token; a token with the wrong `aud` (issued to some other app) also 401s.
- admin.html in a fresh browser shows only the Google sign-in button and no data.
- Signing in with any Google account not in `ALLOWED_EMAILS` is rejected with a clear message — test with a same-domain but unlisted account to prove it's exact-match, not domain-match.
- Each of the three admins can sign in with their own account; after the first sign-in, a page refresh or a >1 h-old tab recovers **without a visible prompt** (while the Google session is live).
- With the Google session signed out, the silent path fails over to the visible sign-in button, not a broken dashboard.
- Public quiz-taking flow never touches Google or prompts for anything.

## Risks / notes

- The claim checks are each load-bearing — especially `aud` (without it, an ID token issued to any other Google-integrated app would be accepted) and `email_verified`. `jose`'s `jwtVerify` + `createRemoteJWKSet` covers signature/expiry/issuer in one call.
- Silent re-auth is best-effort: One Tap has dismissal cooldowns, and browser FedCM/third-party-cookie policies vary. The 401→silent→button fallback chain must be tested in at least Chrome and Safari.
- The token is readable by page JavaScript (that's inherent to browser-held tokens). Exposure is minimized by memory-only handling, the ≤1 h lifetime, and the pages shipping no third-party scripts besides GIS itself.
- Google Cloud Console is a new operational dependency: the OAuth client's authorized origins must track any domain change (e.g. moving to a custom domain).
- On/offboarding staff is editing `ALLOWED_EMAILS`. The list must use each person's actual Google sign-in address; aliases that aren't the account's primary/verified email will fail the exact-match check.
- All three admins have identical, full access — no roles. If that ever needs to change, it's a small per-email role map in the Function.
