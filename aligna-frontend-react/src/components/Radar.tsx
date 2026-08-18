const labels = [
  "Chest",
  "Shoulders",
  "Back",
  "Arms",
  "Core",
  "Quads",
  "Hamstrings",
  "Calves"
];

const values = [84, 78, 55, 70, 48, 61, 81, 50];

function point(index: number, radius: number) {
  const angle =
    -Math.PI / 2 +
    index * ((Math.PI * 2) / labels.length);

  return {
    x: 160 + Math.cos(angle) * radius,
    y: 160 + Math.sin(angle) * radius
  };
}

export function Radar() {
  const data = labels
    .map((_, i) => {
      const p = point(i, 100 * (values[i] / 100));
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg className="radar" viewBox="0 0 320 320">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          className="radar-grid"
          points={labels
            .map((_, i) => {
              const p = point(i, 100 * scale);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
        />
      ))}

      {labels.map((label, i) => {
        const end = point(i, 100);
        const text = point(i, 127);

        return (
          <g key={label}>
            <line
              x1="160"
              y1="160"
              x2={end.x}
              y2={end.y}
              className="radar-axis"
            />
            <text
              x={text.x}
              y={text.y}
              className="radar-label"
            >
              {label}
            </text>
          </g>
        );
      })}

      <polygon className="radar-data" points={data} />
    </svg>
  );
}
