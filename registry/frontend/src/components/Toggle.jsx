export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="text-sm font-bold text-hch-ink">{label}</span>
      <span className={`hch-form-toggle ${checked ? 'is-on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span className="hch-form-toggle__knob" />
      </span>
    </label>
  );
}
