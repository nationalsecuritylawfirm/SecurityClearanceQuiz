// The site's one API function. Plan 2 (Google SSO auth) is implemented here;
// the data endpoints from Plans 1/3 are registered behind auth but return 501
// until those plans land, so every admin route is born protected.
import { createRemoteJWKSet, jwtVerify } from 'jose';

// jose caches the fetched keys and refreshes them as Google rotates.
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function allowedEmails() {
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Verifies the Google ID token on the request and returns { email }.
// Throws 401 for a missing/invalid/expired token (client may silently retry),
// 403 for a valid Google account that isn't on the admin list (client must not).
async function requireGoogleAuth(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(500, 'Server misconfigured: GOOGLE_CLIENT_ID is not set');

  const match = (req.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'Sign-in required');

  let payload;
  try {
    // Checks signature (against Google's JWKS), expiry, issuer, and audience —
    // aud must be OUR client ID or a token minted for any other Google app
    // would pass.
    ({ payload } = await jwtVerify(match[1], GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    }));
  } catch {
    throw new HttpError(401, 'Invalid or expired sign-in token');
  }

  if (payload.email_verified !== true) {
    throw new HttpError(401, 'Google account email is not verified');
  }
  const email = String(payload.email || '').toLowerCase();
  // Exact-match, not domain-match: the admins span two domains and not
  // everyone at either domain should have access.
  if (!allowedEmails().includes(email)) {
    throw new HttpError(403, `${payload.email} is not an authorized admin`);
  }
  return { email };
}

const notImplemented = () => json(501, { error: 'Not implemented yet (deploy-plan 01/03)' });

export default async (req) => {
  const url = new URL(req.url);
  const path =
    url.pathname
      .replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '')
      .replace(/^\/api(?=\/|$)/, '') || '/';
  const method = req.method.toUpperCase();

  try {
    // ── Public ─────────────────────────────────────
    if (method === 'GET' && path === '/auth/config') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) return json(500, { error: 'GOOGLE_CLIENT_ID is not set' });
      return json(200, { clientId });
    }

    // ── Admin (Google-authenticated) ───────────────
    if (method === 'GET' && path === '/auth/me') {
      const { email } = await requireGoogleAuth(req);
      return json(200, { email });
    }

    if (path === '/responses' && (method === 'GET' || method === 'DELETE')) {
      await requireGoogleAuth(req);
      return notImplemented(); // Plan 1: list / clear responses
    }
    if (path.startsWith('/responses/') && method === 'DELETE') {
      await requireGoogleAuth(req);
      return notImplemented(); // Plan 1: delete one response
    }
    if (path.startsWith('/quizzes/') && (method === 'PUT' || method === 'DELETE')) {
      await requireGoogleAuth(req);
      return notImplemented(); // Plan 3: upsert / delete quiz
    }

    return json(404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error(err);
    return json(500, { error: 'Internal error' });
  }
};
