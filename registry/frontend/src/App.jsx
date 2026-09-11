import { useEffect, useState } from 'react';
import { fetchDirectory, fetchMe } from './lib/api.js';
import { getToken, setToken, clearToken, takeAuthResultFromUrl } from './lib/auth.js';
import LoginPage from './pages/LoginPage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';
import NeedsPage from './pages/NeedsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';

// Read the sign-in redirect (`#token=` / `#error=link`) exactly once, before the
// component mounts, since it also scrubs the URL fragment as a side effect.
const authResult = takeAuthResultFromUrl();
if (authResult.token) setToken(authResult.token);

const LINK_ERROR = 'That sign-in link was invalid or expired — request a new one.';

function currentRoute() {
  if (window.location.hash === '#/needs') return 'needs';
  if (window.location.hash === '#/profile') return 'profile';
  return 'directory';
}

export default function App() {
  const [token, setTokenState] = useState(authResult.token || getToken());
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [route, setRoute] = useState(currentRoute());
  const [loginNotice] = useState(authResult.error === 'link' ? LINK_ERROR : '');

  // 'checking' | 'onboarding' | 'done' | 'error' — gates the rest of the app
  // until a member with no name yet (their first ever sign-in) fills one in.
  const [profileStatus, setProfileStatus] = useState('checking');
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!token) return;
    setProfileStatus('checking');
    fetchMe(token)
      .then((record) => {
        setMe(record);
        setProfileStatus(record.name?.trim() ? 'done' : 'onboarding');
      })
      .catch((err) => {
        if (err.code === 'UNAUTHORIZED') {
          clearToken();
          setTokenState('');
        } else {
          setProfileStatus('error');
        }
      });
  }, [token]);

  useEffect(() => {
    if (!token || profileStatus !== 'done') return;
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
  }, [token, profileStatus]);

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
    setMe(null);
    setProfileStatus('checking');
  };

  if (!token) {
    return <LoginPage notice={loginNotice} />;
  }

  if (profileStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hch-cream">
        <p className="text-sm text-hch-muted-2">Loading…</p>
      </div>
    );
  }

  if (profileStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hch-cream px-4">
        <p className="text-sm text-red-600">Couldn't load your profile. Try refreshing.</p>
      </div>
    );
  }

  if (profileStatus === 'onboarding') {
    return (
      <WelcomePage
        token={token}
        record={me}
        onUnauthorized={signOut}
        onComplete={(saved) => {
          setMe(saved);
          setProfileStatus('done');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-hch-cream">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-hch-ink sm:text-2xl">
            Hub City Hackers Registry
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {route === 'directory' && (
              <a
                href="#/needs"
                className="whitespace-nowrap rounded-lg bg-gradient-to-b from-hch-mint-dark to-[#005a3d] px-3 py-2 text-sm font-semibold text-white transition-all duration-150 hch-shadow-btn hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                Browse hacker needs
              </a>
            )}
            {route !== 'profile' && (
              <a
                href="#/profile"
                className="whitespace-nowrap rounded-lg border border-hch-border bg-white px-3 py-2 text-sm text-hch-muted-1 shadow-sm transition-colors hover:border-hch-mint-dark/40 hover:text-hch-mint-dark"
              >
                My profile
              </a>
            )}
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap rounded-lg border border-hch-border bg-white px-3 py-2 text-sm text-hch-muted-1 shadow-sm transition-colors hover:border-hch-mint-dark/40 hover:text-hch-mint-dark"
            >
              Sign out
            </button>
          </div>
        </div>

        {route === 'needs' && <NeedsPage members={members} status={status} />}
        {route === 'profile' && <ProfilePage token={token} onUnauthorized={signOut} />}
        {route === 'directory' && <DirectoryPage members={members} status={status} />}
      </div>
    </div>
  );
}
