import { useEffect } from 'react';
import MemberDetail from './MemberDetail.jsx';

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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-hch-ink/40 px-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name}'s profile`}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-hch-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hch-mint bg-hch-ink text-xs font-semibold text-hch-mint">
            {initials(member.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-hch-ink">{member.name}</div>
            {member.discordHandle && (
              <div className="truncate text-xs text-hch-muted-2">@{member.discordHandle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-hch-muted-2 transition-colors hover:bg-hch-cream"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <MemberDetail member={member} />
      </div>
    </div>
  );
}
