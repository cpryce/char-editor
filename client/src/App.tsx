import { useEffect, useState } from 'react';

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: User | null) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  if (loading) return null;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
        char-editor
      </h1>
      {user ? (
        <div className="mt-4 flex items-center gap-3">
          {user.avatar && (
            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" referrerPolicy="no-referrer" />
          )}
          <span style={{ color: 'var(--color-fg-default)' }}>{user.name ?? user.email}</span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1 rounded cursor-pointer"
            style={{
              background: 'var(--color-btn-bg)',
              color: 'var(--color-btn-text)',
              border: '1px solid var(--color-btn-border)',
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <a
          href="/auth/google"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Sign in with Google
        </a>
      )}
    </main>
  );
}

export default App;

