// Calls are relative and prefixed with the registry's base path: same-origin
// in production (the server serves this bundle and mounts its routes under the
// same prefix) and through Vite's dev proxy locally. Must match `base` in
// vite.config.js and BASE_PATH in the server. Set VITE_API_URL only to target
// a server on a different origin.
const API_URL = import.meta.env.VITE_API_URL || '/registry';

// Ask the server to email a one-time sign-in link. Resolves once the request is
// accepted — the response is deliberately the same whether or not the address is
// on the roster, so a `true` here does not mean an email was actually sent.
export async function requestLoginLink(email) {
  const res = await fetch(`${API_URL}/api/auth/request-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Too many attempts. Please wait a few minutes.');
  }
  if (res.status === 400 || res.status === 503) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Could not send the sign-in link.');
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return true;
}

export async function fetchDirectory(token) {
  const res = await fetch(`${API_URL}/api/directory`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    const err = new Error('Session expired — please sign in again');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to load directory (${res.status})`);
  }
  return res.json();
}
