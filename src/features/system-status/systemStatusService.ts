import { getAuthSession } from '../auth/authStorage';
import type { ActuatorHealthResponse } from './types';

const HEALTH_ENDPOINT = '/actuator/health';

export async function getSystemHealth(signal?: AbortSignal): Promise<ActuatorHealthResponse> {
  const session = getAuthSession();
  const response = await fetch(HEALTH_ENDPOINT, {
    headers: {
      Accept: 'application/json',
      ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<ActuatorHealthResponse>;
}
