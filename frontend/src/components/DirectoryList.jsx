import { useState } from 'react';
import MemberRow from './MemberRow.jsx';
import MemberModal from './MemberModal.jsx';

export default function DirectoryList({ members, query, skillFilters = [], helpFilters = [] }) {
  const [selected, setSelected] = useState(null);

  const normalized = query.trim().toLowerCase();
  const filtered = members.filter((member) => {
    if (normalized) {
      const name = member.name.toLowerCase();
      const skills = (member.skills || []).join(' ').toLowerCase();
      if (!name.includes(normalized) && !skills.includes(normalized)) return false;
    }
    if (skillFilters.length && !skillFilters.some((s) => (member.skills || []).includes(s))) {
      return false;
    }
    if (helpFilters.length && !helpFilters.some((h) => (member.helpOffered || []).includes(h))) {
      return false;
    }
    return true;
  });

  // "What's your name?" is one free-text field, so split on whitespace: first
  // token is the first name, the remainder is the last name.
  const sorted = [...filtered].sort((a, b) => {
    const [aFirst, ...aRest] = a.name.trim().split(/\s+/);
    const [bFirst, ...bRest] = b.name.trim().split(/\s+/);
    const opts = { sensitivity: 'base' };
    return (
      aFirst.localeCompare(bFirst, undefined, opts) ||
      aRest.join(' ').localeCompare(bRest.join(' '), undefined, opts)
    );
  });

  if (sorted.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-hch-muted-2">No members match your search or filters.</p>
    );
  }

  return (
    <>
      <div className="mt-2 overflow-hidden rounded-lg border border-hch-border bg-white">
        {sorted.map((member) => (
          <MemberRow key={member.email || member.name} member={member} onOpen={setSelected} />
        ))}
      </div>
      <MemberModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
