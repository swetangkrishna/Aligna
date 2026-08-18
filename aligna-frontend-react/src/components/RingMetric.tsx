type Props = {
  value: number;
  label: string;
  tone?: "mint" | "blue" | "violet";
  icon?: string;
};

export function RingMetric({
  value,
  label,
  tone = "mint",
  icon = "●"
}: Props) {
  return (
    <div className="ring-metric">
      <div
        className={`ring tone-${tone}`}
        style={{ "--pct": value } as React.CSSProperties}
      >
        <span>{icon}</span>
      </div>
      <strong>{label}</strong>
      <small>{value}%</small>
    </div>
  );
}
