# SecurityClearanceQuiz

## Running Locally

```bash
netlify dev
```

## Deploying to Netlify (manual, via CLI)

### Initial Setup: Install the CLI and log in

```bash
npm i -g netlify-cli
netlify login   # interactive; opens a browser. Select LightSight Team
```

### Deploy

```bash
npm install             # CLI bundles the function locally; needs node_modules
netlify deploy --alias staging # draft deploy to a preview URL — sanity-check first
netlify deploy --prod   # production
```


### Set Authorized users

```bash
netlify env:set ALLOWED_EMAILS "beaudekker@lightsight.ai,katherine@nationalsecuritylawfirm.com,jacksonrudd@lightsight.ai"
```
