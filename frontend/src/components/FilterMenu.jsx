import { useEffect, useRef, useState } from 'react';

function ChevronDownIcon(props) {
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
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export default function FilterMenu({ label, options, selected, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const count = selected.length;

  const toggle = (opt) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-sm transition-colors ${
          count
            ? 'border-hch-mint-dark bg-hch-mint-dark/10 text-hch-mint-dark'
            : 'border-hch-border bg-white text-hch-muted-1 hover:border-hch-mint-dark/40'
        }`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="rounded-full bg-hch-mint-dark px-1.5 text-[11px] font-semibold text-white">{count}</span>
        )}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-hch-border bg-white p-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-hch-muted-3">Nothing to filter yet</p>
          )}
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-hch-muted-1 hover:bg-hch-cream"
              >
                <span
                  className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${
                    active ? 'border-hch-mint-dark bg-hch-mint-dark text-white' : 'border-hch-border'
                  }`}
                >
                  {active && <CheckIcon className="h-3 w-3" />}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs text-hch-muted-2 hover:bg-hch-cream"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
