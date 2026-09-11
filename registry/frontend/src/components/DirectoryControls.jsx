import SearchBar from './SearchBar.jsx';
import FilterMenu from './FilterMenu.jsx';

function FilterChip({ label, tone, onRemove }) {
  const toneClass =
    tone === 'mint'
      ? 'border-hch-mint-dark/50 bg-hch-mint-dark/5 text-hch-mint-dark'
      : 'border-hch-mint-dark/40 bg-hch-mint/5 text-hch-muted-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${toneClass}`}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="text-current/70 hover:text-current"
      >
        ×
      </button>
    </span>
  );
}

export default function DirectoryControls({
  query,
  onQueryChange,
  skillOptions,
  skillFilters,
  onSkillFiltersChange,
  helpOptions,
  helpFilters,
  onHelpFiltersChange,
  onReset,
}) {
  const hasFilters = skillFilters.length > 0 || helpFilters.length > 0;
  const dirty = query.trim().length > 0 || hasFilters;

  return (
    <div className="rounded-lg border border-hch-border bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={query} onChange={onQueryChange} />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterMenu
            label="Help"
            options={skillOptions}
            selected={skillFilters}
            onChange={onSkillFiltersChange}
          />
          <FilterMenu
            label="Offers"
            options={helpOptions}
            selected={helpFilters}
            onChange={onHelpFiltersChange}
            align="right"
          />
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty}
            className="whitespace-nowrap rounded-md border border-hch-border bg-white px-3 py-2 text-sm text-hch-muted-1 transition-colors hover:border-hch-mint-dark/40 hover:text-hch-mint-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hch-border disabled:hover:text-hch-muted-1"
          >
            Reset
          </button>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {[...skillFilters].sort((a, b) => a.localeCompare(b)).map((s) => (
            <FilterChip
              key={`skill-${s}`}
              label={s}
              onRemove={() => onSkillFiltersChange(skillFilters.filter((x) => x !== s))}
            />
          ))}
          {[...helpFilters].sort((a, b) => a.localeCompare(b)).map((h) => (
            <FilterChip
              key={`help-${h}`}
              label={h}
              tone="mint"
              onRemove={() => onHelpFiltersChange(helpFilters.filter((x) => x !== h))}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              onSkillFiltersChange([]);
              onHelpFiltersChange([]);
            }}
            className="ml-1 text-xs text-hch-muted-2 hover:text-hch-mint-dark hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
