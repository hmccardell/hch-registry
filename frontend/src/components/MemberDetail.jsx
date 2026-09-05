function DetailLabel({ children }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-hch-muted-3">{children}</p>;
}

function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function MemberDetail({ member }) {
  return (
    <div className="space-y-5 border-t border-hch-border bg-hch-cream px-5 py-5">
      <div>
        <DetailLabel>Skills</DetailLabel>
        <div className="flex flex-wrap gap-1.5">
          {(member.skills || []).map((skill) => (
            <span key={skill} className="rounded-full border border-hch-border bg-white px-2 py-0.5 text-[11px] text-hch-muted-1">
              {skill}
            </span>
          ))}
          {!(member.skills || []).length && <span className="text-xs text-hch-muted-3">None listed</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <DetailLabel>Contact</DetailLabel>
          <ul className="space-y-1.5 text-sm">
            <li>
              {member.email ? (
                <a className="text-hch-mint-dark hover:underline" href={`mailto:${member.email}`}>
                  {member.email}
                </a>
              ) : (
                <span className="text-hch-muted-3">Email not shared</span>
              )}
            </li>
            <li>
              {member.phone ? (
                <a className="text-hch-mint-dark hover:underline" href={`tel:${member.phone}`}>
                  {member.phone}
                </a>
              ) : (
                <span className="text-hch-muted-3">Phone not shared</span>
              )}
            </li>
            <li className="text-hch-muted-1">
              {member.discordHandle ? `@${member.discordHandle} on Discord` : <span className="text-hch-muted-3">No Discord handle</span>}
            </li>
            {member.links && (
              <li>
                <a className="text-hch-mint-dark hover:underline" href={toHref(member.links)} target="_blank" rel="noopener">
                  {member.links}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <DetailLabel>Project</DetailLabel>
          {member.projectName ? (
            <div className="rounded-md border border-hch-border bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-hch-ink">{member.projectName}</span>
                {member.projectStage && <span className="text-xs text-hch-muted-2">{member.projectStage}</span>}
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
          ) : (
            <p className="text-xs text-hch-muted-3">No active project</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <DetailLabel>Can help with</DetailLabel>
          <div className="flex flex-wrap gap-1.5">
            {(member.helpOffered || []).map((t) => (
              <span key={t} className="rounded-full border border-hch-mint-dark/30 bg-hch-mint-dark/10 px-2 py-0.5 text-[11px] text-hch-mint-dark">
                {t}
              </span>
            ))}
            {!(member.helpOffered || []).length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
          </div>
        </div>

        <div>
          <DetailLabel>Looking for</DetailLabel>
          <div className="flex flex-wrap gap-1.5">
            {(member.needs || []).map((t) => (
              <span key={t} className="rounded-full border border-hch-border bg-white px-2 py-0.5 text-[11px] text-hch-muted-1">
                {t}
              </span>
            ))}
            {!(member.needs || []).length && <span className="text-xs text-hch-muted-3">Nothing listed</span>}
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
