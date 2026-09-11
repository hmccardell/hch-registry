import { useEffect, useState } from 'react';
import { fetchMe, updateMe } from '../lib/api.js';
import MemberForm from '../components/MemberForm.jsx';
import { toFormState, toPatchBody, formHandlers } from '../lib/memberForm.js';

export default function ProfilePage({ token, onUnauthorized }) {
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { onFieldChange, onToggleList } = formHandlers(setForm, () => setMessage(''));

  useEffect(() => {
    fetchMe(token)
      .then((record) => {
        setForm(toFormState(record));
        setStatus('ready');
      })
      .catch((err) => {
        if (err.code === 'UNAUTHORIZED') onUnauthorized();
        else setStatus('error');
      });
  }, [token, onUnauthorized]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await updateMe(token, toPatchBody(form));
      setForm(toFormState(saved));
      setMessage('Saved.');
    } catch (err) {
      if (err.code === 'UNAUTHORIZED') return onUnauthorized();
      setMessage(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <p className="mt-8 font-sans text-sm text-hch-muted-2">Loading your profile…</p>;
  }
  if (status === 'error' || !form) {
    return (
      <p className="mt-8 font-sans text-sm text-hch-error">
        Couldn't load your profile. If you're new, ask an admin to double-check the email on your
        account.
      </p>
    );
  }

  const error = message && message !== 'Saved.' ? message : '';
  const successMessage = message === 'Saved.' ? message : '';

  return (
    <div className="hch-form mt-6 max-w-2xl pb-2 pr-1.5">
      <a href="#/" className="hch-form-btn-ghost">
        ← Back to directory
      </a>

      <h1 className="mt-5 text-3xl font-black tracking-tighter text-hch-mint sm:text-4xl">
        My profile
      </h1>
      <p className="mt-1 font-sans text-sm font-semibold text-hch-muted-1">
        Keep your details current — this is what the rest of the registry sees.
      </p>

      <MemberForm
        variant="profile"
        form={form}
        onFieldChange={onFieldChange}
        onToggleList={onToggleList}
        saving={saving}
        error={error}
        successMessage={successMessage}
        onSubmit={submit}
      />
    </div>
  );
}
