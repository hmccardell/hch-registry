import { useState } from 'react';
import MemberRow from './MemberRow.jsx';
import MemberModal from './MemberModal.jsx';

export default function DirectoryList({ members, query }) {
  const [selected, setSelected] = useState(null);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? members.filter((member) => {
        const name = member.name.toLowerCase();
        const skills = (member.skills || []).join(' ').toLowerCase();
        return name.includes(normalized) || skills.includes(normalized);
      })
    : members;

  if (filtered.length === 0) {
    return <p className="mt-8 text-center text-sm text-hch-muted-2">No members match that search.</p>;
  }

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-lg border border-hch-border bg-white">
        {filtered.map((member) => (
          <MemberRow key={member.email || member.name} member={member} onOpen={setSelected} />
        ))}
      </div>
      <MemberModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
