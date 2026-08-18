import { ChevronRight, Play, Sparkles } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export function TrainPage() {
  const moves = [
    ["01", "Pull-ups", "4 × 6–8", "Lats · upper back · biceps"],
    ["02", "Lat pulldown", "4 × 10", "Lats · biceps"],
    ["03", "Seated cable row", "4 × 10", "Mid back · rear delts"],
    ["04", "Incline curl", "3 × 12", "Biceps"]
  ];

  return (
    <div className="page">
      <section className="hero-copy compact">
        <p className="kicker">TRAINING</p>
        <h1>Back + biceps</h1>
        <p>Balanced pulling volume based on your recovery map.</p>
      </section>

      <GlassCard className="training-overview">
        <div>
          <span className="pill">AI adjusted</span>
          <h2>48 min</h2>
          <p>16 working sets · moderate intensity</p>
        </div>

        <div className="readiness">
          <strong>86</strong>
          <small>ready</small>
        </div>
      </GlassCard>

      <section className="exercise-list">
        {moves.map(([number, name, scheme, muscles], index) => (
          <GlassCard
            className={index === 0 ? "exercise featured" : "exercise"}
            key={name}
          >
            <span className="exercise-number">{number}</span>
            <div>
              <h3>{name}</h3>
              <p>{muscles}</p>
              <strong>{scheme}</strong>
            </div>
            {index === 0 ? (
              <button className="play">
                <Play size={16} fill="currentColor" />
              </button>
            ) : (
              <ChevronRight size={17} className="muted-icon" />
            )}
          </GlassCard>
        ))}
      </section>

      <GlassCard className="insight">
        <div className="insight-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="kicker">WHY THIS SESSION</p>
          <h3>Posterior-chain volume is lower this month.</h3>
          <p>
            Aligna reduced chest work and brought pulling volume forward.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
