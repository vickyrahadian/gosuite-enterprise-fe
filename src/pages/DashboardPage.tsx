import { StatCard } from '../components/StatCard';
import { SystemStatusCard } from '../features/system-status/SystemStatusCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function DashboardPage() {
  useDocumentTitle('Dashboard | BNI');

  return (
    <>
      <header className="page-header">
        <p>Overview</p>
        <h1>Dashboard</h1>
      </header>
      <section className="stats" aria-label="Dashboard statistics">
        <StatCard label="Active users" value="—" />
        <StatCard label="Pending tasks" value="—" />
        <SystemStatusCard />
      </section>
    </>
  );
}
