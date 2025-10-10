import { useState, useEffect } from 'react';
import type { Session } from 'next-auth';

export function useExtensionSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    fetch('http://localhost:3000/api/session')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(sessionData => {
        setSession(sessionData);
        setStatus(sessionData ? 'authenticated' : 'unauthenticated');
      });
  }, []);
  return { session, status };
}

export function AuthStatus() {
  const { session, status } = useExtensionSession();

  const handleSignIn = () => {
    chrome.tabs.create({ url: 'http://localhost:3000/api/auth/signin' });
  };
  const handleSignOut = async () => {
    try {
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      if (csrfToken) {
        await fetch('http://localhost:3000/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ csrfToken, callbackUrl: '/' }),
        });
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      chrome.runtime.reload();
    }
  };

  if (status === 'loading') {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-background-alt" />;
  }

  if (status === 'unauthenticated') {
    return (
      <button
        onClick={handleSignIn}
        className="text-sm font-semibold text-foreground-strong hover:text-primary transition-colors"
      >
        Iniciar Sesión
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <img
        src={session?.user?.image ?? ''}
        alt={session?.user?.name ?? 'Avatar'}
        className="h-7 w-7 rounded-full"
      />
      <button
        onClick={handleSignOut}
        className="text-sm text-foreground hover:text-danger transition-colors"
      >
        Salir
      </button>
    </div>
  );
}