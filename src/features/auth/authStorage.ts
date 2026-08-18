import type { AuthSession } from './types';

const SESSION_KEY = 'gosuite.auth.session';

export function getAuthSession(): AuthSession | null {
  const storedSession = sessionStorage.getItem(SESSION_KEY);
  if (!storedSession) return null;

  try {
    return JSON.parse(storedSession) as AuthSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateAccessToken(accessToken: string, accessTokenExpiresIn: number) {
  const session = getAuthSession();
  if (!session) return;
  saveAuthSession({ ...session, accessToken, accessTokenExpiresIn });
}

export function clearAuthSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
