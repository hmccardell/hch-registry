export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by name or skill…"
      className="w-full rounded-md border border-hch-border px-3 py-2 text-sm text-hch-ink shadow-sm focus:border-hch-mint-dark focus:outline-none focus:ring-1 focus:ring-hch-mint-dark"
    />
  );
}
