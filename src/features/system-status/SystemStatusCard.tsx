import { useSystemHealth } from './useSystemHealth';

export function SystemStatusCard() {
  const health = useSystemHealth();

  const display = health.state === 'loading'
    ? { label: 'Checking...', tone: 'pending' }
    : health.state === 'unavailable'
      ? { label: 'Unavailable', tone: 'error' }
      : {
          label: health.status,
          tone: health.isHealthy ? 'success' : 'error',
        };

  return (
    <article className="stat-card">
      <span className="stat-card__label">System status</span>
      <strong className={`status status--${display.tone}`} aria-live="polite">
        <span className="status__indicator" aria-hidden="true" />
        {display.label}
      </strong>
    </article>
  );
}
