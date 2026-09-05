const STAGE_DOT = {
  Idea: 'bg-hch-muted-3',
  Building: 'bg-hch-mint',
  Launched: 'bg-hch-mint-dark',
  Fundraising: 'bg-hch-mint',
};

export default function ProjectStage({ stage, className = '' }) {
  if (!stage) return null;
  return (
    <span className={`flex items-center gap-2 text-xs text-hch-muted-2 ${className}`}>
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${STAGE_DOT[stage] || 'bg-hch-muted-3'}`} />
      {stage}
    </span>
  );
}
