import { useEffect, useState } from 'react';
import { fetchDirectory } from './lib/api.js';
import SearchBar from './components/SearchBar.jsx';
import DirectoryList from './components/DirectoryList.jsx';

export default function App() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetchDirectory()
      .then((data) => {
        setMembers(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-hch-cream">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-bold text-hch-ink">Hub City Hackers</h1>
        <p className="mt-1 text-hch-muted-1">Member directory</p>

        <div className="mt-6">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {status === 'loading' && <p className="mt-8 text-sm text-hch-muted-2">Loading directory…</p>}
        {status === 'error' && (
          <p className="mt-8 text-sm text-red-600">
            Couldn't load the directory. Is the server running and configured?
          </p>
        )}
        {status === 'ready' && <DirectoryList members={members} query={query} />}
      </div>
    </div>
  );
}
