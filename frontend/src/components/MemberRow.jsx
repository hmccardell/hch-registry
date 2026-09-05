import { useEffect, useRef, useState } from 'react';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICON_BASE =
  'flex h-8 w-8 flex-none items-center justify-center rounded-md border border-transparent transition-colors';

function MailIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M7 3.5h3l1.3 4.2L9 9.5a10.5 10.5 0 0 0 5.5 5.5l1.8-2.3 4.2 1.3v3a1.8 1.8 0 0 1-1.9 1.8C10.7 18.3 5.7 13.3 5.2 5.9A1.8 1.8 0 0 1 7 3.5z" />
    </svg>
  );
}

function DiscordIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M8 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      <path d="M14 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .667-1.667.5-5.833-1.5-11.5-1.457-1.015-3-1.34-4.5-1.5l-.972 1.923a11.913 11.913 0 0 0-4.053 0L7.5 4c-1.5.16-3.043.485-4.5 1.5-2 5.667-2.167 9.833-1.5 11.5.667 1.333 2 3 3.5 3 .5 0 2-2 2-3" />
      <path d="M7 16.5c3.5 1 6.5 1 10 0" />
    </svg>
  );
}

const STAGE_DOT = {
  Idea: 'bg-hch-muted-3',
  Building: 'bg-hch-mint',
  Launched: 'bg-hch-mint-dark',
  Fundraising: 'bg-hch-mint',
};

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Non-interactive icon: shows the value on hover/title, but clicking does nothing.
function HoverIcon({ available, label, children }) {
  if (!available) {
    return (
      <span className={`${ICON_BASE} text-hch-muted-3 opacity-60`} title={label}>
        {children}
      </span>
    );
  }
  return (
    <span
      title={label}
      className={`${ICON_BASE} text-hch-muted-1 hover:border-hch-border hover:bg-hch-cream hover:text-hch-mint-dark`}
    >
      {children}
    </span>
  );
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text) => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return { copied, copy };
}

function CopiedTip({ align = 'right' }) {
  return (
    <span
      role="status"
      className={`pointer-events-none absolute bottom-full ${
        align === 'left' ? 'left-0' : 'right-0'
      } mb-1 whitespace-nowrap rounded-md bg-hch-ink px-2 py-1 text-[11px] font-medium text-hch-mint shadow-sm`}
    >
      Copied to clipboard
    </span>
  );
}

function CopyEmailButton({ email }) {
  const { copied, copy } = useCopyFeedback();

  if (!email) {
    return (
      <span className={`${ICON_BASE} text-hch-muted-3 opacity-60`} title="Email not shared">
        <MailIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy(email);
        }}
        title={copied ? 'Copied to clipboard' : `Copy ${email}`}
        aria-label={copied ? 'Email copied to clipboard' : `Copy email address ${email}`}
        className={`${ICON_BASE} ${
          copied
            ? 'text-hch-mint-dark'
            : 'text-hch-muted-1 hover:border-hch-border hover:bg-hch-cream hover:text-hch-mint-dark'
        }`}
      >
        <MailIcon className="h-4 w-4" />
      </button>
      {copied && <CopiedTip align="right" />}
    </div>
  );
}

function DiscordCopyButton({ handle }) {
  const { copied, copy } = useCopyFeedback();

  return (
    <span className="relative mt-1 inline-block max-w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy(handle);
        }}
        title={copied ? 'Copied to clipboard' : `Copy ${handle}`}
        aria-label={copied ? 'Discord handle copied to clipboard' : `Copy Discord handle ${handle}`}
        className={`inline-flex max-w-full items-center gap-1.5 rounded-md border bg-white px-1.5 py-0.5 text-xs leading-none transition-colors ${
          copied
            ? 'border-hch-mint-dark/40 text-hch-mint-dark'
            : 'border-hch-border text-hch-muted-1 hover:border-hch-mint-dark/40 hover:text-hch-mint-dark'
        }`}
      >
        <DiscordIcon className="h-3.5 w-3.5 flex-none" />
        <span className="truncate">{handle}</span>
      </button>
      {copied && <CopiedTip align="left" />}
    </span>
  );
}

export default function MemberRow({ member, onOpen }) {
  const open = () => onOpen(member);

  const visibleSkills = (member.skills || []).slice(0, 3);
  const extraSkills = (member.skills || []).length - visibleSkills.length;

  return (
    <div
      className="flex cursor-pointer items-center gap-4 border-t border-hch-border px-5 py-3.5 transition-colors first:border-t-0 hover:bg-hch-cream"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hch-mint bg-hch-ink text-xs font-semibold text-hch-mint">
          {initials(member.name)}
        </div>

        <div className="w-44 flex-none">
          <div className="truncate text-sm font-semibold text-hch-ink">{member.name}</div>
          {member.discordHandle && <DiscordCopyButton handle={member.discordHandle} />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-hch-border px-2 py-0.5 text-[11px] text-hch-muted-1"
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && <span className="px-1 py-0.5 text-[11px] text-hch-muted-3">+{extraSkills}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-hch-muted-2">
            {member.projectName ? (
              <>
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${STAGE_DOT[member.projectStage] || 'bg-hch-muted-3'}`} />
                <span>{member.projectStage}</span>
                <span className="font-medium text-hch-muted-1">{member.projectName}</span>
              </>
            ) : (
              <span>No active project</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-px self-stretch bg-hch-border" />

      <div className="flex flex-none items-center gap-1">
        <CopyEmailButton email={member.email} />
        <HoverIcon available={!!member.phone} label={member.phone || 'Phone not shared'}>
          <PhoneIcon className="h-4 w-4" />
        </HoverIcon>
      </div>
    </div>
  );
}
