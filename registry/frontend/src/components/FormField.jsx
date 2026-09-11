export default function FormField({ label, value, onChange, required, textarea }) {
  return (
    <label className="block">
      <span className="hch-form-label">{label}</span>
      {textarea ? (
        <textarea rows={3} required={required} value={value || ''} onChange={onChange} className="hch-form-input" />
      ) : (
        <input type="text" required={required} value={value || ''} onChange={onChange} className="hch-form-input" />
      )}
    </label>
  );
}
