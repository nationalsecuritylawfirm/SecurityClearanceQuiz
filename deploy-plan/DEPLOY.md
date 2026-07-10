# Deploying to Netlify (manual, via CLI)

This site deploys manually with the Netlify CLI — no CI, no build step.
`netlify.toml` already defines everything structural: publish dir is the repo
root, functions live in `netlify/functions`, and `/api/*` redirects to the
function.

## One-time setup

### 1. Install the CLI and log in

```bash
npm i -g netlify-cli
netlify login   # interactive; opens a browser
```

### 2. Create the site in the org and link this directory

`sites:create` prompts you to pick a team — choose LightSight:

```bash
cd ~/repos/SecurityClearanceQuiz
netlify sites:create --name nslf-quiz
```

This links the directory to the site (written to `.netlify/state.json`,
which is gitignored), so later commands know where to deploy.

### 3. Set environment variables

The function (`netlify/functions/api.mjs`) reads two env vars for admin
auth. Neither is a secret (see `deploy-plan/02-auth.md`):

```bash
netlify env:set GOOGLE_CLIENT_ID "212015781920-vemlfdmo3jij6lioghreksbpkqngu7fo.apps.googleusercontent.com"
netlify env:set ALLOWED_EMAILS "beaudekker@lightsight.ai,katherine@nationalsecuritylawfirm.com,jacksonrudd@lightsight.ai"
```

### 4. Google OAuth origins (after the first deploy)

In Google Cloud Console, on the OAuth 2.0 client, add to **Authorized
JavaScript origins**:

- the production URL (e.g. `https://security-clearance-quiz.netlify.app`,
  and the custom domain if one is added later)
- `http://localhost:8888` (for `netlify dev`)

Until the production origin is added, admin/builder Google sign-in will
fail on the deployed site. No redirect URIs and no client secret are used.

## Deploying

```bash
npm install             # CLI bundles the function locally; needs node_modules
netlify deploy --alias staging # draft deploy to a preview URL — sanity-check first
netlify deploy --prod   # production
```

The CLI reads `netlify.toml`, so no `--dir`/`--functions` flags are needed.
Netlify Blobs (lead/quiz storage) works automatically on a deployed site —
no extra configuration.

## Seeding quizzes (`scripts/seed.mjs`)

`js/seed.js` is the canonical copy of the quiz content; `scripts/seed.mjs`
PUTs every quiz in it to the server as published, then reads each back and
verifies the round-trip. Run it once after the first deploy, or any time the
stored quizzes need to be restored from the repo copy.

The script authenticates the same way the builder does — with a Google ID
token from an allowed admin account:

1. Open `builder.html` on the target site and sign in with Google.
2. In devtools' Network tab, pick any `/api` request and copy the
   `Authorization` header value (the part after `Bearer `). Tokens live
   about an hour — plenty.
3. Run the script with that token:

```bash
# against production
SEED_TOKEN="<google-id-token>" node scripts/seed.mjs https://<site-name>.netlify.app

# against local netlify dev (the default base URL)
SEED_TOKEN="<google-id-token>" node scripts/seed.mjs
```

Each quiz prints `✓` with its new version number, or `✗` on a failed PUT or
a round-trip mismatch; the script exits non-zero if anything failed. It is
safe to re-run — quizzes are PUT by id, so reseeding overwrites rather than
duplicates. Note that reseeding replaces any edits made in the builder since
the seed file was last updated.

## Caveats

- **Deploys ship the working tree, not git.** `netlify deploy` uploads
  whatever is on disk, including uncommitted changes. Check `git status`
  before a prod deploy.
- **Google sign-in won't work on draft preview URLs.** Previews are a
  different origin than the one registered with Google — that's expected,
  not a bug. Public pages and quiz submission work fine on previews.
