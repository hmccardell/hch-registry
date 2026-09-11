import Chip from './Chip.jsx';
import { CopyEmailButton, DiscordCopyButton, PhoneButton } from './ContactButtons.jsx';

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
      className="flex cursor-pointer flex-col gap-3 border-t border-hch-border px-4 py-3.5 transition-colors first:border-t-0 hover:bg-hch-cream sm:flex-row sm:items-center sm:gap-4 sm:px-5"
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
      {/* Identity + contact: one row on mobile; `sm:contents` dissolves the
          wrapper on desktop so its children lay out inline with the rest. */}
      <div className="flex items-center gap-3 sm:contents">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hch-mint bg-hch-ink text-xs font-semibold text-hch-mint">
          {initials(member.name)}
        </div>

        <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <div className="truncate text-sm font-semibold text-hch-ink">{member.name}</div>
          {member.discordHandle && <DiscordCopyButton handle={member.discordHandle} />}
        </div>

        <div className="flex flex-none items-center gap-1">
          <CopyEmailButton email={member.email} />
          <PhoneButton phone={member.phone} />
        </div>
      </div>

      <div className="hidden w-px self-stretch bg-hch-border sm:block" />

      <div
        className={`flex min-w-0 flex-wrap gap-1.5 sm:flex-1 ${skills.length ? '' : 'hidden sm:flex'}`}
      >
        {skills.map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </div>
    </div>
  );
}
