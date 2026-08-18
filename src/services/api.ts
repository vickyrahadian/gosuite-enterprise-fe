import { API_BASE_URL } from '../config/api';
import { clearAuthSession, getAuthSession, updateAccessToken } from '../features/auth/authStorage';
import type { RefreshTokenResponse } from '../features/auth/types';

type ErrorResponse = {
  code?: string;
  message?: string;
  error?: string;
  validationErrors?: Record<string, string>;
};

const PUBLIC_AUTH_PATHS = new Set(['/auth/login', '/auth/refresh']);
let refreshRequest: Promise<string> | null = null;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly validationErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function refreshAccessToken(): Promise<string> {
  const session = getAuthSession();
  if (!session) throw new Error('No refresh token is available');

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  if (!response.ok) throw new Error('Unable to refresh the access token');
  const refreshed = await response.json() as RefreshTokenResponse;
  updateAccessToken(refreshed.accessToken, refreshed.accessTokenExpiresIn);
  return refreshed.accessToken;
}

async function getRefreshedAccessToken() {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken()
      .catch((error: unknown) => {
        clearAuthSession();
        window.dispatchEvent(new Event('auth:session-expired'));
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

async function executeRequest<T>(path: string, init: RequestInit | undefined, canRetry: boolean): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const session = getAuthSession();
  if (session && !headers.has('Authorization')) {
    headers.set('Authorization', `${session.tokenType} ${session.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && canRetry && session && !PUBLIC_AUTH_PATHS.has(path)) {
    const accessToken = await getRefreshedAccessToken();
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${accessToken}`);
    if (init?.body && !retryHeaders.has('Content-Type')) retryHeaders.set('Content-Type', 'application/json');
    return executeRequest<T>(path, { ...init, headers: retryHeaders }, false);
  }

  if (response.status === 401 && !PUBLIC_AUTH_PATHS.has(path)) {
    clearAuthSession();
    window.dispatchEvent(new Event('auth:session-expired'));
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as ErrorResponse | null;
    const message = body?.message ?? body?.error ?? `Request failed (${response.status})`;
    throw new ApiRequestError(message, response.status, body?.code, body?.validationErrors);
  }

  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  if (!responseText.trim()) return undefined as T;
  return JSON.parse(responseText) as T;
}

export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return executeRequest<T>(path, init, true);
}
