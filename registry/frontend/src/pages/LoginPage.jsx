import { useState } from 'react';
import { requestLoginLink } from '../lib/api.js';

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
      const result = await requestLoginLink(email.trim().toLowerCase());
      if (result.loginUrl) {
        window.location.assign(result.loginUrl);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hch-grid-page hch-form flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm pb-2 pr-1.5">
        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-hch-mint-dark">
          Members only
        </p>
        <h1 className="mt-1.5 text-center text-3xl font-black tracking-tighter text-hch-mint">
          Hub City Hackers Registry
        </h1>
        <p className="mt-1.5 text-center font-sans text-sm font-semibold text-hch-muted-1">
          Sign in with your email.
        </p>

        {sent ? (
          <div className="hch-form-card mt-6 space-y-3 text-sm">
            <p className="font-black text-hch-ink">Check your inbox.</p>
            <p className="font-sans font-semibold text-hch-muted-1">
              If <span className="font-bold text-hch-ink">{email.trim().toLowerCase()}</span> is on
              the member roster, a one-time sign-in link is on its way. It expires in 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="font-black text-hch-ink underline underline-offset-4 hover:text-hch-mint-dark hover:no-underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="hch-form-card mt-6 space-y-3">
            {notice && <p className="text-sm font-black text-hch-error">{notice}</p>}

            <label className="block">
              <span className="hch-form-label">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hch-form-input"
              />
            </label>

            {error && <p className="text-sm font-black text-hch-error">{error}</p>}

            {submitting && (
              <div className="space-y-1.5" role="status" aria-live="polite">
                <div className="retro-progress">
                  <div className="retro-progress__track">
                    <div className="retro-progress__fill" />
                  </div>
                </div>
                <p className="hch-form-hint">
                  Waking up the service. When sleepy, it can take up to a minute.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="hch-form-btn"
            >
              {submitting ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
