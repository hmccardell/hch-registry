import { useEffect, useState } from 'react';
import { fetchDirectory } from './lib/api.js';
import { getToken, setToken, clearToken, takeAuthResultFromUrl } from './lib/auth.js';
import LoginPage from './pages/LoginPage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';
import NeedsPage from './pages/NeedsPage.jsx';

// Read the sign-in redirect (`#token=` / `#error=link`) exactly once, before the
// component mounts, since it also scrubs the URL fragment as a side effect.
const authResult = takeAuthResultFromUrl();
if (authResult.token) setToken(authResult.token);

const LINK_ERROR = 'That sign-in link was invalid or expired — request a new one.';

function currentRoute() {
  return window.location.hash === '#/needs' ? 'needs' : 'directory';
}

export default function App() {
  const [token, setTokenState] = useState(authResult.token || getToken());
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [route, setRoute] = useState(currentRoute());
  const [loginNotice] = useState(authResult.error === 'link' ? LINK_ERROR : '');

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

  const signOut = () => {
    clearToken();
    setTokenState('');
    setMembers([]);
    setStatus('loading');
  };

  if (!token) {
    return <LoginPage notice={loginNotice} />;
  }

  return (
    <div className="min-h-screen bg-hch-cream">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-hch-ink sm:text-2xl">Hub City Hackers Registry</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
