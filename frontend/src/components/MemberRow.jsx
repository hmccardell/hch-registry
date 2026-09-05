import Chip from './Chip.jsx';
import ProjectStage from './ProjectStage.jsx';
import { CopyEmailButton, DiscordCopyButton, PhoneButton } from './ContactButtons.jsx';

function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function ArrowIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function MemberRow({ member, onOpen }) {
  const open = () => onOpen(member);

  const skills = [...(member.skills || [])].sort((a, b) => a.localeCompare(b));

  return (
    <div
      className="flex cursor-pointer items-center gap-4 border-t border-hch-border px-5 py-3.5 transition-colors first:border-t-0 hover:bg-hch-cream"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hch-mint bg-hch-ink text-xs font-semibold text-hch-mint">
        {initials(member.name)}
      </div>

      <div className="w-44 flex-none">
        <div className="truncate text-sm font-semibold text-hch-ink">{member.name}</div>
        {member.discordHandle && <DiscordCopyButton handle={member.discordHandle} />}
      </div>

      <div className="flex flex-none items-center gap-1">
        <CopyEmailButton email={member.email} />
        <PhoneButton phone={member.phone} />
      </div>

      <div className="w-px self-stretch bg-hch-border" />

      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {skills.map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </div>

      {member.projectName && (
        <>
          <div className="w-px self-stretch bg-hch-border" />
          <div className="flex w-52 flex-none items-center gap-2">
            <ProjectStage stage={member.projectStage} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-hch-muted-1">{member.projectName}</span>
            {member.projectLink && (
              <a
                href={toHref(member.projectLink)}
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                title={`Open ${member.projectName}`}
                aria-label={`Open ${member.projectName} in a new tab`}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-hch-muted-2 transition-colors hover:bg-hch-border/40 hover:text-hch-mint-dark"
              >
                <ArrowIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
