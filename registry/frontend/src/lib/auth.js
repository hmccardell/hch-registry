const KEY = 'hch_token';

export function getToken() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable — token stays in memory only for this session */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

// The /api/auth/callback redirect lands the browser on the app with either
// `#token=<session>` or `#error=link` in the URL fragment. Read it once, then
// scrub the fragment from the address bar (and history) so the token isn't
// left sitting in the URL. Returns { token } | { error } | {}.
export function takeAuthResultFromUrl() {
  try {
    const hash = window.location.hash || '';
    const token = hash.match(/[#&]token=([^&]+)/);
    const error = hash.match(/[#&]error=([^&]+)/);
    if (token || error) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (token) return { token: decodeURIComponent(token[1]) };
    if (error) return { error: decodeURIComponent(error[1]) };
    return {};
  } catch {
    return {};
  }
}
