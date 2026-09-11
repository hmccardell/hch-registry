import Chip from './Chip.jsx';

function DetailLabel({ children }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-hch-muted-3">{children}</p>;
}

function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const LINK_FIELDS = [
  ['website', 'Website'],
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
];

const SKILLS_PER_COLUMN = 4;

const byAlpha = (a, b) => a.localeCompare(b);

export default function MemberDetail({ member }) {
  const links = LINK_FIELDS.map(([key, label]) => ({
    key,
    label,
    url: (member[key] || '').trim(),
  })).filter((item) => item.url);
  const skills = [...(member.skills || [])].sort(byAlpha);
  const helpOffered = [...(member.helpOffered || [])].sort(byAlpha);
  const needs = [...(member.needs || [])].sort(byAlpha);

  return (
    <div className="space-y-5 border-t border-hch-border bg-hch-cream px-4 py-5 sm:px-5">
      <div>
        <DetailLabel>Contact</DetailLabel>
        {links.length ? (
          <ul className="space-y-1.5 text-sm">
            {links.map(({ key, label, url }) => (
              <li key={key}>
                <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-hch-muted-3">
                  {label}
                </span>
                <a
                  className="break-all text-hch-mint-dark hover:underline"
                  href={toHref(url)}
                  target="_blank"
                  rel="noopener"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-hch-muted-3">None shared</span>
        )}
      </div>

      <div>
        <DetailLabel>Help</DetailLabel>
        {skills.length ? (
          <ul
            className="flex flex-col gap-y-1 text-sm text-hch-muted-1 marker:text-hch-mint-dark sm:grid sm:grid-flow-col sm:justify-start sm:gap-x-8"
            style={{
              gridTemplateRows: `repeat(${Math.min(skills.length, SKILLS_PER_COLUMN)}, auto)`,
              gridAutoColumns: 'max-content',
            }}
          >
            {skills.map((skill) => (
              <li key={skill} className="ml-4 list-disc py-0.5">
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-hch-muted-3">None listed</span>
        )}
      </div>

      <div>
        <DetailLabel>Offers</DetailLabel>
        <div className="flex flex-wrap gap-1.5">
          {helpOffered.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          {!helpOffered.length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
        </div>
      </div>

      <div>
        <DetailLabel>Needs</DetailLabel>
        <div className="flex flex-wrap gap-1.5">
          {needs.map((t) => (
            <Chip key={t} tone="warm">
              {t}
            </Chip>
          ))}
          {!needs.length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
        </div>
        {member.needsDetail && <p className="mt-2 text-sm text-hch-muted-1">{member.needsDetail}</p>}
      </div>

      {member.bio && (
        <div>
          <DetailLabel>Notes</DetailLabel>
          <p className="text-sm text-hch-muted-1">{member.bio}</p>
        </div>
      )}
    </div>
  );
}
