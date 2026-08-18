type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
