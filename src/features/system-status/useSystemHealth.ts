import { useEffect, useState } from 'react';
import { getSystemHealth } from './systemStatusService';
import type { SystemHealthState } from './types';

const HEALTHY_STATUS = 'UP';

export function useSystemHealth(): SystemHealthState {
  const [health, setHealth] = useState<SystemHealthState>({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    getSystemHealth(controller.signal)
      .then(({ status }) => {
        const normalizedStatus = status.toUpperCase();
        setHealth({
          state: 'available',
          status: normalizedStatus,
          isHealthy: normalizedStatus === HEALTHY_STATUS,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHealth({ state: 'unavailable' });
      });

    return () => controller.abort();
  }, []);

  return health;
}
