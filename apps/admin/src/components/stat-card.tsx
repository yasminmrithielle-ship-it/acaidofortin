type Props = {
  title: string;
  value: string;
  helper: string;
};

export function StatCard({ title, value, helper }: Props) {
  return (
    <article className="panel-card stat-card">
      <span className="eyebrow">{title}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

