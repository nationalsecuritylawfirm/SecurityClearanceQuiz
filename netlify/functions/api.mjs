// The site's one API function: Google SSO auth (Plan 2), lead/response
// storage (Plan 1), and server-stored quizzes (Plan 3) — all in Netlify Blobs.
import { getStore } from '@netlify/blobs';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// jose caches the fetched keys and refreshes them as Google rotates.
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

// Public quiz reads are CDN-cached for a minute so quiz-taking traffic mostly
// doesn't hit the function, while builder edits still appear within a minute.
// Netlify-Vary keys the cache on the Authorization header, so an admin request
// for the same URL never gets served an anonymous visitor's cached response.
const CACHE_PUBLIC = {
  'cache-control': 'public, max-age=60',
  'netlify-vary': 'header=authorization',
};

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

// GET quiz endpoints serve both audiences: anonymous visitors get the public
// (published-only) view; a request carrying a Bearer token gets the admin view
// — but a *bad* token is a hard 401/403, not a silent fall-back to the public
// view, so the builder's token-refresh flow works.
async function maybeAdmin(req) {
  if (!req.headers.get('authorization')) return false;
  await requireGoogleAuth(req);
  return true;
}

// ── Responses (Plan 1) ─────────────────────────────────────────────
// One blob per response under responses/<id> — Blobs has no read-modify-write
// atomicity, so a single shared array would let concurrent submissions
// clobber each other.

const store = () => getStore('quiz-app');

// Quizzes live in the quizzes/ prefix. This set is a transition fallback so
// response submissions for the original quizzes keep working on a deploy where
// scripts/seed.mjs hasn't been run yet (or the store was wiped).
const SEED_QUIZ_IDS = new Set([
  'sf86-red-flags',
  'debt-taxes-clearance-risk',
  'self-reporting-checker',
  'content-removal-google',
  'military-discharge-upgrade',
]);

async function isKnownQuizId(id) {
  if (typeof id !== 'string' || !id) return false;
  if (SEED_QUIZ_IDS.has(id)) return true;
  return (await store().get(`quizzes/${id}`)) !== null;
}

const MAX_BODY_BYTES = 10_000;

async function createResponse(req) {
  if (!/^application\/json\b/i.test(req.headers.get('content-type') || '')) {
    throw new HttpError(415, 'Expected application/json');
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'Payload too large');
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Invalid payload');
  }

  const id = crypto.randomUUID();

  // Honeypot: bots that fill the hidden "website" field get a success-shaped
  // reply (so they don't adapt) but nothing is stored.
  if (body.website) return json(201, { id });

  if (!(await isKnownQuizId(body.quizId))) throw new HttpError(400, 'Unknown quiz');
  const email = body.leadCapture && body.leadCapture.email;
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new HttpError(400, 'A valid email address is required');
  }

  // Server assigns id + timestamp — the client's clock and ids aren't trusted.
  const { website, ...rest } = body;
  const response = { ...rest, id, timestamp: new Date().toISOString() };
  await store().setJSON(`responses/${id}`, response);
  return json(201, { id });
}

async function listResponses() {
  const s = store();
  const { blobs } = await s.list({ prefix: 'responses/' });
  const responses = (
    await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))
  ).filter(Boolean);
  responses.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return json(200, responses);
}

async function deleteResponse(id) {
  await store().delete(`responses/${id}`);
  return json(200, { ok: true });
}

async function clearResponses() {
  const s = store();
  const { blobs } = await s.list({ prefix: 'responses/' });
  await Promise.all(blobs.map((b) => s.delete(b.key)));
  return json(200, { ok: true, deleted: blobs.length });
}

// ── Quizzes (Plan 3) ───────────────────────────────────────────────
// One blob per quiz under quizzes/<id>, same shape as the old SEED_QUIZZES
// entries plus { published, version, updatedAt }. Drafts (published !== true)
// are invisible to anonymous requests.

// Ids become blob keys and URL paths — keep them to a safe character set.
const QUIZ_ID_RE = /^[A-Za-z0-9_-]+$/;
const MAX_QUIZ_BYTES = 400_000;

async function allQuizzes() {
  const s = store();
  const { blobs } = await s.list({ prefix: 'quizzes/' });
  const quizzes = (
    await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))
  ).filter(Boolean);
  quizzes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  return quizzes;
}

async function listQuizzes(isAdmin) {
  const quizzes = await allQuizzes();
  // Admins get the full quiz JSON (the builder edits from this list and the
  // analytics page needs tag/flag libraries); the public gets a trimmed
  // listing of published quizzes only.
  if (isAdmin) return json(200, quizzes, { 'cache-control': 'no-store' });
  const listing = quizzes
    .filter((q) => q.published === true)
    .map((q) => ({
      id: q.id,
      slug: q.slug || q.id,
      title: q.title,
      subtitle: q.subtitle || '',
      questionCount: (q.questions || []).length,
    }));
  return json(200, listing, CACHE_PUBLIC);
}

async function getQuiz(idOrSlug, isAdmin) {
  let quiz = await store().get(`quizzes/${idOrSlug}`, { type: 'json' });
  if (!quiz) quiz = (await allQuizzes()).find((q) => q.slug === idOrSlug) || null;
  // A draft 404s (not 403) for anonymous requests: don't reveal it exists.
  if (!quiz || (!isAdmin && quiz.published !== true)) {
    throw new HttpError(404, 'Quiz not found');
  }
  return isAdmin
    ? json(200, quiz, { 'cache-control': 'no-store' })
    : json(200, quiz, CACHE_PUBLIC);
}

async function putQuiz(req, id) {
  if (!QUIZ_ID_RE.test(id)) {
    throw new HttpError(400, 'Quiz id may only contain letters, numbers, hyphens, and underscores');
  }
  if (!/^application\/json\b/i.test(req.headers.get('content-type') || '')) {
    throw new HttpError(415, 'Expected application/json');
  }
  const raw = await req.text();
  if (raw.length > MAX_QUIZ_BYTES) throw new HttpError(413, 'Quiz too large');
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Invalid payload');
  }
  if (body.id !== id) throw new HttpError(400, 'Quiz id in body must match the URL');
  if (typeof body.title !== 'string' || !body.title.trim()) {
    throw new HttpError(400, 'Quiz title is required');
  }
  if (!Array.isArray(body.questions)) throw new HttpError(400, 'questions must be an array');

  const key = `quizzes/${id}`;
  const existing = await store().get(key, { type: 'json' });
  const quiz = {
    ...body,
    slug: typeof body.slug === 'string' && body.slug ? body.slug : id,
    published: body.published === true,
    // Server owns version/updatedAt. A first-time import keeps the incoming
    // version so seeding reproduces js/seed.js exactly (deploy-plan/03).
    version: existing ? (Number(existing.version) || 0) + 1 : Number(body.version) || 1,
    updatedAt: new Date().toISOString(),
  };
  await store().setJSON(key, quiz);
  return json(200, quiz);
}

async function deleteQuiz(id) {
  if (!QUIZ_ID_RE.test(id)) throw new HttpError(400, 'Invalid quiz id');
  await store().delete(`quizzes/${id}`);
  return json(200, { ok: true });
}

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

    if (method === 'POST' && path === '/responses') {
      // `await` matters: without it a rejection escapes this try/catch and
      // surfaces as a raw 500 instead of the HttpError's status.
      return await createResponse(req);
    }

    // ── Public + admin (view depends on token) ─────
    if (method === 'GET' && path === '/quizzes') {
      return await listQuizzes(await maybeAdmin(req));
    }
    if (method === 'GET' && path.startsWith('/quizzes/')) {
      const idOrSlug = decodeURIComponent(path.slice('/quizzes/'.length));
      return await getQuiz(idOrSlug, await maybeAdmin(req));
    }

    // ── Admin (Google-authenticated) ───────────────
    if (method === 'GET' && path === '/auth/me') {
      const { email } = await requireGoogleAuth(req);
      return json(200, { email });
    }

    if (method === 'GET' && path === '/responses') {
      await requireGoogleAuth(req);
      return await listResponses();
    }
    if (method === 'DELETE' && path === '/responses') {
      await requireGoogleAuth(req);
      return await clearResponses();
    }
    if (method === 'DELETE' && path.startsWith('/responses/')) {
      await requireGoogleAuth(req);
      return await deleteResponse(decodeURIComponent(path.slice('/responses/'.length)));
    }
    if (path.startsWith('/quizzes/') && (method === 'PUT' || method === 'DELETE')) {
      await requireGoogleAuth(req);
      const id = decodeURIComponent(path.slice('/quizzes/'.length));
      return method === 'PUT' ? await putQuiz(req, id) : await deleteQuiz(id);
    }

    return json(404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error(err);
    return json(500, { error: 'Internal error' });
  }
};
