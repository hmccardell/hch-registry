import { useState } from 'react';
import { updateMe } from '../lib/api.js';
import MemberForm from '../components/MemberForm.jsx';
import { toFormState, toPatchBody, formHandlers } from '../lib/memberForm.js';

// Shown once, the first time a member signs in (their row has no name yet).
// Blocks the rest of the app until first/last name are saved; every other
// field can be filled in now or later from the regular profile page.
export default function WelcomePage({ token, record, onUnauthorized, onComplete }) {
  const [form, setForm] = useState(() => toFormState(record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { onFieldChange, onToggleList } = formHandlers(setForm, () => setError(''));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const saved = await updateMe(token, toPatchBody(form));
      onComplete(saved);
    } catch (err) {
      if (err.code === 'UNAUTHORIZED') return onUnauthorized();
      setError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hch-grid-page hch-form flex min-h-screen justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-2xl pb-2 pr-1.5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-hch-mint-dark">
          Hub City Hackers
        </p>
        <h1 className="mt-1.5 text-3xl font-black tracking-tighter text-hch-mint sm:text-4xl">
          Welcome to the registry
        </h1>
        <p className="mt-2 max-w-lg font-sans text-sm font-semibold text-hch-muted-1">
          Tell us who you are before you browse the registry. The optional fields below can be
          filled in now or later from your profile.
        </p>

        <MemberForm
          variant="welcome"
          form={form}
          onFieldChange={onFieldChange}
          onToggleList={onToggleList}
          saving={saving}
          error={error}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
