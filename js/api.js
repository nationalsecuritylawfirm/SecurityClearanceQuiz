// Google SSO auth core for the internal pages (deploy-plan/02-auth.md).
// The Google ID token lives only in this closure — never in localStorage,
// sessionStorage, or a cookie. Plan 1 adds the data methods on top of
// Api.authFetch.
const Api = (() => {
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

  // Every credential lands here: button click, auto sign-in at page load, and
  // silent re-acquisition after a 401.
  function handleCredential(response) {
    idToken = response.credential;
    const waiters = tokenWaiters;
    tokenWaiters = [];
    for (const resolve of waiters) resolve(idToken);
    if (!authorized) verifySignIn();
  }

  // Confirm the signed-in account against the server-side allow-list, so an
  // unlisted account gets a clear rejection instead of a broken dashboard.
  async function verifySignIn() {
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
        setMessage(body.error || 'Sign-in failed. Please try again.');
      }
    } catch {
      setMessage('Could not reach the server. Please try again.');
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
    // Attempt a silent sign-in for returning admins (refresh, new tab); if it
    // can't complete, the rendered button is already the fallback.
    google.accounts.id.prompt();
  }

  return {
    initAuth,
    authFetch,
    getEmail: () => userEmail,
  };
})();
