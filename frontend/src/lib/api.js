// Calls are relative: same-origin in production (the server serves this bundle)
// and through Vite's dev proxy locally. Set VITE_API_URL only to target a
// server on a different origin.
const API_URL = import.meta.env.VITE_API_URL || '';

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 401) {
    throw new Error('Invalid username or password');
  }
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Too many attempts. Please wait a few minutes.');
  }
  if (!res.ok) {
    throw new Error(`Login failed (${res.status})`);
  }
  const { token } = await res.json();
  return token;
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
