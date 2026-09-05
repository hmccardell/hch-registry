import Chip from './Chip.jsx';
import ProjectStage from './ProjectStage.jsx';

function DetailLabel({ children }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-hch-muted-3">{children}</p>;
}

function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// The "LinkedIn / GitHub / Portfolio..." answer is free text, one entry per line.
function parseLinks(raw) {
  return (raw || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const SKILLS_PER_COLUMN = 4;

const byAlpha = (a, b) => a.localeCompare(b);

export default function MemberDetail({ member }) {
  const links = parseLinks(member.links);
  const skills = [...(member.skills || [])].sort(byAlpha);
  const helpOffered = [...(member.helpOffered || [])].sort(byAlpha);
  const needs = [...(member.needs || [])].sort(byAlpha);

  return (
    <div className="space-y-5 border-t border-hch-border bg-hch-cream px-4 py-5 sm:px-5">
      <div>
        <DetailLabel>Skills</DetailLabel>
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <DetailLabel>Links</DetailLabel>
          {links.length ? (
            <ul className="space-y-1.5 text-sm">
              {links.map((url) => (
                <li key={url}>
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

        {member.projectName && (
          <div>
            <DetailLabel>Project</DetailLabel>
            <div className="rounded-md border border-hch-border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-hch-ink">{member.projectName}</span>
                <ProjectStage stage={member.projectStage} />
              </div>
              {member.projectDescription && <p className="mt-1 text-xs text-hch-muted-1">{member.projectDescription}</p>}
              {member.projectLink && (
                <a
                  className="mt-2 inline-block text-xs text-hch-mint-dark hover:underline"
                  href={toHref(member.projectLink)}
                  target="_blank"
                  rel="noopener"
                >
                  {member.projectLink}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <DetailLabel>Can help with</DetailLabel>
          <div className="flex flex-wrap gap-1.5">
            {helpOffered.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
            {!helpOffered.length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
          </div>
        </div>

        <div>
          <DetailLabel>Looking for</DetailLabel>
          <div className="flex flex-wrap gap-1.5">
            {needs.map((t) => (
              <Chip key={t} tone="warm">
                {t}
              </Chip>
            ))}
            {!needs.length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
          </div>
        </div>
      </div>

      {member.needsDetail && (
        <div>
          <DetailLabel>Specific needs</DetailLabel>
          <p className="text-sm text-hch-muted-1">{member.needsDetail}</p>
        </div>
      )}

      {member.bio && (
        <div>
          <DetailLabel>Notes</DetailLabel>
          <p className="text-sm text-hch-muted-1">{member.bio}</p>
        </div>
      )}
    </div>
  );
}
