import { useState } from 'react';
import Chip from '../components/Chip.jsx';
import FilterMenu from '../components/FilterMenu.jsx';
import MemberModal from '../components/MemberModal.jsx';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function CardLabel({ children }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-hch-muted-3">{children}</p>
  );
}

function BackIcon(props) {
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
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export default function NeedsPage({ members, status }) {
  const [selected, setSelected] = useState(null);
  const [needFilters, setNeedFilters] = useState([]);

  const withNeeds = members.filter((m) => (m.needs || []).length > 0 || m.needsDetail);
  const needOptions = uniqueSorted(withNeeds.flatMap((m) => m.needs || []));
  const visible = needFilters.length
    ? withNeeds.filter((m) => needFilters.some((n) => (m.needs || []).includes(n)))
    : withNeeds;

  return (
    <div className="mt-6">
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 rounded-md border border-hch-border bg-white px-3 py-2 text-sm text-hch-muted-1 transition-colors hover:border-hch-mint-dark/40 hover:text-hch-mint-dark"
      >
        <BackIcon className="h-4 w-4" />
        Back to directory
      </a>

      <div className="sticky top-0 z-20 -mx-4 mt-4 bg-hch-cream px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-hch-border bg-white p-3 shadow-sm">
          <h2 className="text-lg font-bold text-hch-ink">
            Assisting your fellow Hackers? A noble pursuit.
          </h2>
          {status === 'ready' && (
            <FilterMenu
              label="General needs"
              options={needOptions}
              selected={needFilters}
              onChange={setNeedFilters}
              align="right"
            />
          )}
        </div>
      </div>

      {status === 'loading' && <p className="mt-8 text-sm text-hch-muted-2">Loading directory…</p>}
      {status === 'error' && (
        <p className="mt-8 text-sm text-red-600">
          Couldn't load the directory. Is the server running and configured?
        </p>
      )}

      {status === 'ready' && (
        <>
          <p className="mt-3 text-sm text-hch-muted-2">
            {visible.length} {visible.length === 1 ? 'member' : 'members'}
          </p>

          <div className="mt-4 space-y-4">
            {visible.length === 0 && (
              <p className="text-sm text-hch-muted-3">
                {withNeeds.length === 0
                  ? 'No one has listed a need yet.'
                  : 'No one matches those needs.'}
              </p>
            )}
            {visible.map((m) => (
              <button
                key={m.email || m.name}
                type="button"
                onClick={() => setSelected(m)}
                className="block w-full rounded-lg border border-hch-border bg-white p-4 text-left transition-colors hover:border-hch-mint-dark/40 hover:bg-hch-cream"
              >
                <div className="text-sm font-semibold text-hch-ink">{m.name}</div>
                {(m.needs || []).length > 0 && (
                  <div className="mt-3">
                    <CardLabel>Generally</CardLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {[...m.needs].sort((a, b) => a.localeCompare(b)).map((t) => (
                        <Chip key={t} tone="warm">
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {m.needsDetail && (
                  <div className="mt-3">
                    <CardLabel>Specifically</CardLabel>
                    <p className="text-sm text-hch-muted-1">{m.needsDetail}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <MemberModal member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
