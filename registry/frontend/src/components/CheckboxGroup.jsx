// A "check all that apply" group matching one of the original Google Form
// questions (see lib/formOptions.js), plus a free-text "Other" catch-all —
// the form always had one. `value` holds only the checked known options;
// the caller tracks free-text "Other" entries separately (see
// splitKnownAndOther in the pages that use this).
export default function CheckboxGroup({ label, options, value, onToggle, otherValue, onOtherChange }) {
  return (
    <div>
      <span className="hch-form-label">{label ? `${label} — check all that apply` : 'Check all that apply'}</span>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <label
              key={option}
              className={`hch-form-check ${checked ? 'is-checked' : ''}`}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(option)} />
              {option}
            </label>
          );
        })}
      </div>
      <label className="mt-2.5 block">
        <span className="hch-form-hint">Other (comma-separated)</span>
        <input type="text" value={otherValue} onChange={onOtherChange} className="hch-form-input mt-1" />
      </label>
    </div>
  );
}
