// Calls are relative and prefixed with the registry's base path: same-origin
// in production (the server serves this bundle and mounts its routes under the
// same prefix) and through Vite's dev proxy locally. Must match `base` in
// vite.config.js and BASE_PATH in the server. Set VITE_API_URL only to target
// a server on a different origin.
const API_URL = import.meta.env.VITE_API_URL || '/registry';

// Ask the server to email a one-time sign-in link. Resolves once the request is
// accepted. Production responses are the same whether or not the address is on
// the roster. Local console-mode may include `loginUrl` so the login page can
// follow the callback without copying a link from the server terminal.
export async function requestLoginLink(email) {
  const res = await fetch(`${API_URL}/api/auth/request-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 429) {
    throw new Error(body.error || 'Too many attempts. Please wait a few minutes.');
  }
  if (res.status === 400 || res.status === 503) {
    throw new Error(body.error || 'Could not send the sign-in link.');
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return body;
}

function unauthorized() {
  const err = new Error('Session expired — please sign in again');
  err.code = 'UNAUTHORIZED';
  return err;
}

export async function fetchDirectory(token) {
  const res = await fetch(`${API_URL}/api/directory`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) throw unauthorized();
  if (!res.ok) {
    throw new Error(`Failed to load directory (${res.status})`);
  }
  return res.json();
}

// The signed-in member's own record, unredacted — same shape the profile form
// edits and PATCH /api/me accepts back.
export async function fetchMe(token) {
  const res = await fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw unauthorized();
  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status})`);
  }
  return res.json();
}

export async function updateMe(token, patch) {
  const res = await fetch(`${API_URL}/api/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
  if (res.status === 401) throw unauthorized();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to save profile (${res.status})`);
  }
  return res.json();
}
