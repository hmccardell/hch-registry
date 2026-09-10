import { useMemo, useState } from 'react';
import DirectoryControls from '../components/DirectoryControls.jsx';
import DirectoryList from '../components/DirectoryList.jsx';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export default function DirectoryPage({ members, status }) {
  const [query, setQuery] = useState('');
  const [skillFilters, setSkillFilters] = useState([]);
  const [helpFilters, setHelpFilters] = useState([]);

  const skillOptions = useMemo(
    () => uniqueSorted(members.flatMap((m) => m.skills || [])),
    [members],
  );
  const helpOptions = useMemo(
    () => uniqueSorted(members.flatMap((m) => m.helpOffered || [])),
    [members],
  );

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mt-2 bg-hch-cream px-4 pb-3 pt-3">
        <DirectoryControls
          query={query}
          onQueryChange={setQuery}
          skillOptions={skillOptions}
          skillFilters={skillFilters}
          onSkillFiltersChange={setSkillFilters}
          helpOptions={helpOptions}
          helpFilters={helpFilters}
          onHelpFiltersChange={setHelpFilters}
          onReset={() => {
            setQuery('');
            setSkillFilters([]);
            setHelpFilters([]);
          }}
        />
      </div>

      {status === 'loading' && <p className="mt-8 text-sm text-hch-muted-2">Loading directory…</p>}
      {status === 'error' && (
        <p className="mt-8 text-sm text-red-600">
          Couldn't load the directory. Is the server running and configured?
        </p>
      )}
      {status === 'ready' && (
        <DirectoryList
          members={members}
          query={query}
          skillFilters={skillFilters}
          helpFilters={helpFilters}
        />
      )}
    </>
  );
}
