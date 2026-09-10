import { useState } from 'react';
import { login } from '../lib/api.js';

const FIELD_LABEL = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-hch-muted-3';
const FIELD_INPUT =
  'w-full rounded-md border border-hch-border px-3 py-2 text-sm text-hch-ink shadow-sm focus:border-hch-mint-dark focus:outline-none focus:ring-1 focus:ring-hch-mint-dark';

export default function LoginPage({ onAuthed }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = await login(username.trim(), password);
      onAuthed(token);
    } catch (err) {
      setError(err.message || 'Login failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hch-cream px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-hch-ink">Hub City Hackers Registry</h1>
        <p className="mt-1 text-center text-sm text-hch-muted-1">Members only — please sign in.</p>

        <form
          onSubmit={submit}
          className="mt-6 space-y-3 rounded-lg border border-hch-border bg-white p-4 shadow-sm"
        >
          <label className="block">
            <span className={FIELD_LABEL}>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={FIELD_INPUT}
            />
          </label>

          <label className="block">
            <span className={FIELD_LABEL}>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD_INPUT}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {submitting && (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="retro-progress">
                <div className="retro-progress__track">
                  <div className="retro-progress__fill" />
                </div>
              </div>
              <p className="text-xs text-hch-muted-1">
                Waking up the service. When sleepy, it can take up to a minute.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="w-full rounded-md bg-hch-mint-dark px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-hch-mint-dark/90 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
