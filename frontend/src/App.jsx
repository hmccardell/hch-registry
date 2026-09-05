import { useEffect, useState } from 'react';
import { fetchDirectory } from './lib/api.js';
import { getToken, setToken, clearToken } from './lib/auth.js';
import LoginPage from './pages/LoginPage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';
import NeedsPage from './pages/NeedsPage.jsx';

function currentRoute() {
  return window.location.hash === '#/needs' ? 'needs' : 'directory';
}

export default function App() {
  const [token, setTokenState] = useState(getToken());
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [route, setRoute] = useState(currentRoute());

  useEffect(() => {
    if (!token) return;
    setStatus('loading');
    fetchDirectory(token)
      .then((data) => {
        setMembers(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.code === 'UNAUTHORIZED') {
          clearToken();
          setTokenState('');
        } else {
          setStatus('error');
        }
      });
  }, [token]);

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleAuthed = (t) => {
    // Always land on the member list, regardless of which route the hash points at.
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setRoute('directory');
    setToken(t);
    setTokenState(t);
  };

  const signOut = () => {
    clearToken();
    setTokenState('');
    setMembers([]);
    setStatus('loading');
  };

  if (!token) {
    return <LoginPage onAuthed={handleAuthed} />;
  }

  return (
    <div className="min-h-screen bg-hch-cream">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-hch-ink">Hub City Hackers Registry</h1>
          <div className="flex items-center gap-3">
            {route === 'directory' && (
              <a
                href="#/needs"
                className="whitespace-nowrap rounded-md bg-hch-mint-dark px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-hch-mint-dark/90"
              >
                Browse hacker needs
              </a>
            )}
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap rounded-md border border-hch-border bg-white px-3 py-2 text-sm text-hch-muted-1 transition-colors hover:border-hch-mint-dark/40 hover:text-hch-mint-dark"
            >
              Sign out
            </button>
          </div>
        </div>

        {route === 'needs' ? (
          <NeedsPage members={members} status={status} />
        ) : (
          <DirectoryPage members={members} status={status} />
        )}
      </div>
    </div>
  );
}
