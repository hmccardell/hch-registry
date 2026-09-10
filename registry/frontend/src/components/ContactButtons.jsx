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

export function MailIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </svg>
  );
}

export function PhoneIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M7 3.5h3l1.3 4.2L9 9.5a10.5 10.5 0 0 0 5.5 5.5l1.8-2.3 4.2 1.3v3a1.8 1.8 0 0 1-1.9 1.8C10.7 18.3 5.7 13.3 5.2 5.9A1.8 1.8 0 0 1 7 3.5z" />
    </svg>
  );
}

export function DiscordIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M8 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      <path d="M14 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
      <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .667-1.667.5-5.833-1.5-11.5-1.457-1.015-3-1.34-4.5-1.5l-.972 1.923a11.913 11.913 0 0 0-4.053 0L7.5 4c-1.5.16-3.043.485-4.5 1.5-2 5.667-2.167 9.833-1.5 11.5.667 1.333 2 3 3.5 3 .5 0 2-2 2-3" />
      <path d="M7 16.5c3.5 1 6.5 1 10 0" />
    </svg>
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

function DisabledIcon({ label, children }) {
  return (
    <span className={`${ICON_BASE} text-hch-muted-3 opacity-60`} title={label}>
      {children}
    </span>
  );
}

// Icon-only button that copies `value` to the clipboard and shows transient feedback.
function IconCopyButton({ value, noun, icon, align = 'right' }) {
  const { copied, copy } = useCopyFeedback();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy(value);
        }}
        title={copied ? 'Copied to clipboard' : `Copy ${value}`}
        aria-label={copied ? `${noun} copied to clipboard` : `Copy ${noun.toLowerCase()} ${value}`}
        className={`${ICON_BASE} ${
          copied
            ? 'text-hch-mint-dark'
            : 'text-hch-muted-1 hover:border-hch-border hover:bg-hch-cream hover:text-hch-mint-dark'
        }`}
      >
        {icon}
      </button>
      {copied && <CopiedTip align={align} />}
    </div>
  );
}

export function CopyEmailButton({ email, align = 'right' }) {
  if (!email) {
    return (
      <DisabledIcon label="Email not shared">
        <MailIcon className="h-4 w-4" />
      </DisabledIcon>
    );
  }
  return (
    <IconCopyButton value={email} noun="Email address" align={align} icon={<MailIcon className="h-4 w-4" />} />
  );
}

// Phone: hover/title reveals the number, but there's no click action.
export function PhoneButton({ phone }) {
  if (!phone) {
    return (
      <DisabledIcon label="Phone not shared">
        <PhoneIcon className="h-4 w-4" />
      </DisabledIcon>
    );
  }
  return (
    <span
      title={phone}
      className={`${ICON_BASE} text-hch-muted-1 hover:border-hch-border hover:bg-hch-cream hover:text-hch-mint-dark`}
    >
      <PhoneIcon className="h-4 w-4" />
    </span>
  );
}

// Labeled chip: Discord icon on the left, handle text on the right. Click copies the handle.
function DiscordChip({ handle }) {
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

export function DiscordCopyButton({ handle, showHandle = true, align = 'right' }) {
  if (!handle) {
    if (showHandle) return null;
    return (
      <DisabledIcon label="No Discord handle">
        <DiscordIcon className="h-4 w-4" />
      </DisabledIcon>
    );
  }
  if (showHandle) return <DiscordChip handle={handle} />;
  return (
    <IconCopyButton
      value={handle}
      noun="Discord handle"
      align={align}
      icon={<DiscordIcon className="h-4 w-4" />}
    />
  );
}

// The email / phone / Discord trio as a single centered row (used in the details modal).
export function ContactActions({ member }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <DiscordCopyButton handle={member.discordHandle} showHandle={false} />
      <CopyEmailButton email={member.email} />
      <PhoneButton phone={member.phone} />
    </div>
  );
}
