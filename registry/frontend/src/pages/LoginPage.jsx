import { useState } from 'react';
import { requestLoginLink } from '../lib/api.js';

const FIELD_LABEL = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-hch-muted-3';
const FIELD_INPUT =
  'w-full rounded-md border border-hch-border px-3 py-2 text-sm text-hch-ink shadow-sm focus:border-hch-mint-dark focus:outline-none focus:ring-1 focus:ring-hch-mint-dark';

export default function LoginPage({ notice }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestLoginLink(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hch-cream px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-hch-ink">Hub City Hackers Registry</h1>
        <p className="mt-1 text-center text-sm text-hch-muted-1">
          Members only — sign in with your email.
        </p>

        {sent ? (
          <div className="mt-6 space-y-3 rounded-lg border border-hch-border bg-white p-4 text-sm shadow-sm">
            <p className="font-medium text-hch-ink">Check your inbox.</p>
            <p className="text-hch-muted-1">
              If <span className="font-medium text-hch-ink">{email.trim().toLowerCase()}</span> is on
              the member roster, a one-time sign-in link is on its way. It expires in 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="text-hch-mint-dark underline underline-offset-2 hover:no-underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-6 space-y-3 rounded-lg border border-hch-border bg-white p-4 shadow-sm"
          >
            {notice && <p className="text-sm text-red-600">{notice}</p>}

            <label className="block">
              <span className={FIELD_LABEL}>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              disabled={submitting || !email}
              className="w-full rounded-md bg-hch-mint-dark px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-hch-mint-dark/90 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
