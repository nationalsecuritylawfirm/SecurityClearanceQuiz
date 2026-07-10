// Google SSO auth core for the internal pages (deploy-plan/02-auth.md) plus
// the response data methods (deploy-plan/01-leads-backend.md).
// The Google ID token is kept in this closure and mirrored to sessionStorage
// (per-tab, gone when the tab closes) so refreshes and admin↔builder
// navigation don't re-prompt on browsers without silent re-auth (Firefox/
// Safari block the third-party cookie GIS needs). Never localStorage.
const Api = (() => {
  const TOKEN_KEY = 'ql_id_token';
  let idToken = null;
  let userEmail = null;
  let authorized = false;
  let ui = {}; // { buttonEl, messageEl, onAuthorized, onSignedOut }
  let tokenWaiters = []; // resolvers awaiting a silent re-acquisition

  function setMessage(text) {
    if (ui.messageEl) ui.messageEl.textContent = text || '';
  }

  // The GIS script is loaded async; wait for it to define google.accounts.id.
  function gisReady(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      (function poll() {
        if (window.google && google.accounts && google.accounts.id) return resolve();
        if (Date.now() - started > timeoutMs) return reject(new Error('gis-load-failed'));
        setTimeout(poll, 50);
      })();
    });
  }

  function storeToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch { /* storage may be unavailable; in-memory still works */ }
  }

  // Every credential lands here: button click, auto sign-in at page load, and
  // silent re-acquisition after a 401.
  function handleCredential(response) {
    idToken = response.credential;
    storeToken(idToken);
    const waiters = tokenWaiters;
    tokenWaiters = [];
    for (const resolve of waiters) resolve(idToken);
    if (!authorized) verifySignIn();
  }

  // Confirm the signed-in account against the server-side allow-list, so an
  // unlisted account gets a clear rejection instead of a broken dashboard.
  // quiet = don't surface errors (used for the stored token from a previous
  // page load, where "expired" is normal and the gate is the right response).
  async function verifySignIn(quiet = false) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + idToken },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        authorized = true;
        userEmail = body.email;
        setMessage('');
        if (ui.onAuthorized) ui.onAuthorized(userEmail);
      } else {
        idToken = null;
        storeToken(null);
        if (!quiet) setMessage(body.error || 'Sign-in failed. Please try again.');
      }
    } catch {
      if (!quiet) setMessage('Could not reach the server. Please try again.');
    }
  }

  // Best-effort silent token re-acquisition via GIS. Resolves with a fresh
  // token, or null when Google needs user interaction (session lapsed,
  // consent revoked, One Tap cooldown, FedCM/third-party-cookie settings) —
  // callers then fall back to the visible sign-in button.
  function acquireTokenSilently(timeoutMs = 8000) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (token) => {
        if (!settled) {
          settled = true;
          resolve(token);
        }
      };
      tokenWaiters.push(finish);
      setTimeout(() => finish(null), timeoutMs);
      try {
        google.accounts.id.prompt((moment) => {
          // Fail fast when GIS reports it won't show; under FedCM these
          // moment methods may be unavailable — the timeout is the backstop.
          try {
            if ((moment.isNotDisplayed && moment.isNotDisplayed()) ||
                (moment.isSkippedMoment && moment.isSkippedMoment())) {
              finish(null);
            }
          } catch { /* deprecated under FedCM */ }
        });
      } catch {
        finish(null);
      }
    });
  }

  function signedOut() {
    idToken = null;
    storeToken(null);
    authorized = false;
    setMessage('Your session ended. Please sign in again.');
    if (ui.onSignedOut) ui.onSignedOut();
  }

  // fetch() wrapper for admin endpoints: attaches the bearer token; on a 401
  // silently re-acquires and retries once, else surfaces the sign-in gate.
  async function authFetch(path, opts = {}) {
    const send = () =>
      fetch(path, {
        ...opts,
        headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + idToken },
      });

    if (!idToken) {
      idToken = await acquireTokenSilently();
      if (!idToken) return authRequired();
    }
    let res = await send();
    if (res.status !== 401) return res;

    const fresh = await acquireTokenSilently();
    if (!fresh) return authRequired();
    res = await send();
    if (res.status === 401) return authRequired();
    return res;
  }

  function authRequired() {
    signedOut();
    throw new Error('Sign-in required');
  }

  async function initAuth(opts) {
    ui = opts;

    // A token from a previous page load in this tab lets refreshes and
    // admin↔builder navigation skip the sign-in UI entirely (the server still
    // verifies it on every request). If it's expired, fall through to GIS.
    const stored = (() => {
      try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
    })();
    if (stored) {
      idToken = stored;
      await verifySignIn(true);
    }

    let clientId;
    try {
      const res = await fetch('/api/auth/config');
      if (!res.ok) throw new Error('config-failed');
      clientId = (await res.json()).clientId;
      await gisReady();
    } catch {
      setMessage('Sign-in is unavailable: could not load the auth configuration. (Local dev: run `netlify dev`, not a plain file server.)');
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: true,
      use_fedcm_for_prompt: true,
    });
    if (ui.buttonEl) {
      google.accounts.id.renderButton(ui.buttonEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      });
    }
    // Attempt a silent sign-in for returning admins (new tab, expired stored
    // token); if it can't complete, the rendered button is already the
    // fallback. Skipped when the stored token already authorized us.
    if (!authorized) google.accounts.id.prompt();
  }

  // ── Data methods (deploy-plan/01) ──────────────────────────────

  async function expectJson(res, okStatus) {
    const body = await res.json().catch(() => ({}));
    if (res.status !== okStatus) {
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return body;
  }

  // Public — called from quiz.html by anonymous visitors, no auth involved.
  async function saveResponse(response) {
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(response),
    });
    return expectJson(res, 201);
  }

  // Public — quiz listing/loading for index.html and quiz.html (deploy-plan/03).
  // Published quizzes only; the thrown error carries .status so quiz.html can
  // tell "no such quiz" (404) from "network/server trouble".
  async function getQuizzes() {
    return expectJson(await fetch('/api/quizzes'), 200);
  }

  async function getQuiz(idOrSlug) {
    const res = await fetch('/api/quizzes/' + encodeURIComponent(idOrSlug));
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  // Admin — full quiz JSON including drafts (builder.html, admin.html).
  async function getQuizzesAdmin() {
    return expectJson(await authFetch('/api/quizzes'), 200);
  }

  async function saveQuiz(quiz) {
    return expectJson(
      await authFetch('/api/quizzes/' + encodeURIComponent(quiz.id), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(quiz),
      }),
      200
    );
  }

  async function deleteQuiz(id) {
    return expectJson(
      await authFetch('/api/quizzes/' + encodeURIComponent(id), { method: 'DELETE' }),
      200
    );
  }

  async function getResponses() {
    return expectJson(await authFetch('/api/responses'), 200);
  }

  async function deleteResponse(id) {
    return expectJson(
      await authFetch('/api/responses/' + encodeURIComponent(id), { method: 'DELETE' }),
      200
    );
  }

  async function clearResponses() {
    return expectJson(await authFetch('/api/responses', { method: 'DELETE' }), 200);
  }

  return {
    initAuth,
    authFetch,
    getEmail: () => userEmail,
    getQuizzes,
    getQuiz,
    getQuizzesAdmin,
    saveQuiz,
    deleteQuiz,
    saveResponse,
    getResponses,
    deleteResponse,
    clearResponses,
  };
})();
