export type ActuatorHealthResponse = {
  status: string;
  components?: Record<string, unknown>;
};

export type SystemHealthState =
  | { state: 'loading' }
  | { state: 'available'; status: string; isHealthy: boolean }
  | { state: 'unavailable' };
