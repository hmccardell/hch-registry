import { useEffect } from 'react';
import MemberDetail from './MemberDetail.jsx';
import { ContactActions } from './ContactButtons.jsx';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function CloseIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function MemberModal({ member, onClose }) {
  useEffect(() => {
    if (!member) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [member, onClose]);

  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-hch-ink/40 px-3 py-6 sm:px-4 sm:py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name}'s profile`}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-hch-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hch-mint bg-hch-ink text-xs font-semibold text-hch-mint">
              {initials(member.name)}
            </div>
            <div className="min-w-0 truncate text-sm font-semibold text-hch-ink">{member.name}</div>
          </div>
          <ContactActions member={member} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-hch-muted-2 transition-colors hover:bg-hch-cream sm:justify-self-end"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <MemberDetail member={member} />
      </div>
    </div>
  );
}
