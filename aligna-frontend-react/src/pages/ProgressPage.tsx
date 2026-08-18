import { Camera, Flame, Rotate3D } from "lucide-react";
import { BodyScene } from "../components/BodyScene";
import { GlassCard } from "../components/GlassCard";
import { Radar } from "../components/Radar";

export function ProgressPage() {
  return (
    <div className="page">
      <section className="hero-copy split">
        <div>
          <p className="kicker">PROGRESS</p>
          <h1>Your body</h1>
          <p>Recovery, training balance and nutrition trend.</p>
        </div>

        <div className="overall">
          <strong>82</strong>
          <small>aligned</small>
        </div>
      </section>

      <section className="body-panel">
        <div className="row-between">
          <div>
            <span className="pill">Recovery map</span>
            <h2>Muscle readiness</h2>
          </div>
          <span className="drag-hint">
            <Rotate3D size={15} />
            Drag
          </span>
        </div>

        <div className="hologram-wrap">
          <div className="scan-line" />
          <div className="orbit orbit-1" />
          <div className="orbit orbit-2" />
          <BodyScene />
        </div>

        <div className="legend">
          <span><i className="ready" /> Ready</span>
          <span><i className="recovering" /> Recovering</span>
          <span><i className="trained" /> Recently trained</span>
        </div>

        <button
          className="scan-cta"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("aligna-open-body-scan")
            )
          }
        >
          <Camera size={17} />
          Scan / update my body
          <span>›</span>
        </button>
      </section>

      <section className="metric-grid">
        <GlassCard>
          <div className="row-between">
            <p className="kicker">NUTRITION</p>
            <Flame size={18} />
          </div>
          <strong className="large-number">1,180</strong>
          <small>/ 2,340 kcal</small>
          <div className="progress"><i style={{ width: "51%" }} /></div>
        </GlassCard>

        <GlassCard>
          <p className="kicker">7 DAYS</p>
          <strong className="large-number">4</strong>
          <small>workouts completed</small>
        </GlassCard>
      </section>

      <GlassCard className="radar-card">
        <p className="kicker">30 DAY BALANCE</p>
        <h2>Training focus</h2>
        <Radar />
      </GlassCard>

      <GlassCard>
        <div className="row-between">
          <div>
            <p className="kicker">CONSISTENCY</p>
            <h2>This month</h2>
          </div>
          <strong className="accent-number">18</strong>
        </div>

        <div className="heatmap">
          {Array.from({ length: 35 }).map((_, index) => (
            <span
              key={index}
              className={
                [1,2,5,8,9,12,15,19,20,23,26,29,30,33].includes(index)
                  ? index % 3 === 0
                    ? "high"
                    : "medium"
                  : ""
              }
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
