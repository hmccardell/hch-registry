const TONES = {
  // Green outline, washed-out fill — skills, "can help with", filter tags.
  neutral: 'border-hch-mint-dark/40 bg-hch-mint/5 text-hch-muted-1',
  // Orange outline, washed-out fill (same intensity as neutral) — "looking for".
  warm: 'border-hch-orange/40 bg-hch-orange/5 text-hch-muted-1',
};

export default function Chip({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
