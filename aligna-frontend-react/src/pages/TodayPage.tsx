import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { RingMetric } from "../components/RingMetric";
import { GlassCard } from "../components/GlassCard";
import { MealScene } from "../components/MealScene";

export function TodayPage() {
  return (
    <div className="page">
      <section className="hero-copy">
        <p className="kicker">THURSDAY · TODAY</p>
        <h1>
          Good afternoon,
          <br />
          <span>keep aligned.</span>
        </h1>
      </section>

      <section className="rings-row">
        <RingMetric value={72} label="Activity" tone="blue" icon="↗" />
        <RingMetric value={58} label="Nutrition" tone="mint" icon="◆" />
        <RingMetric value={82} label="Recovery" tone="violet" icon="◔" />
      </section>

      <motion.section
        className="focus-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="focus-content">
          <p className="kicker">RIGHT NOW</p>
          <h2>Morning meal</h2>
          <p>Avocado eggs on sourdough</p>

          <div className="macro-pills">
            <span>520 kcal</span>
            <span>28g protein</span>
            <span>10 min</span>
          </div>

          <button className="primary">
            Mark complete
            <ArrowUpRight size={16} />
          </button>
        </div>

        <MealScene />
      </motion.section>

      <section className="metric-grid">
        <GlassCard>
          <small>Nutrition</small>
          <strong>1,180</strong>
          <span>of 2,340 kcal</span>
          <div className="progress"><i style={{ width: "51%" }} /></div>
        </GlassCard>

        <GlassCard>
          <small>Hydration</small>
          <strong>5 / 8</strong>
          <span>glasses today</span>
          <div className="progress teal"><i style={{ width: "62%" }} /></div>
        </GlassCard>
      </section>

      <section className="section-heading">
        <div>
          <p className="kicker">TODAY</p>
          <h2>Coming up</h2>
        </div>
      </section>

      <section className="timeline">
        {[
          ["15:00", "Mid-afternoon", "Greek yogurt + berries"],
          ["18:00", "Training", "Back + biceps · 48 min"],
          ["20:15", "Dinner", "Salmon power plate"]
        ].map(([time, title, detail], index) => (
          <div className="timeline-row" key={time}>
            <span className={index === 0 ? "dot active" : "dot"} />
            <span className="time">{time}</span>
            <div>
              <strong>{title}</strong>
              <small>{detail}</small>
            </div>
            <span>›</span>
          </div>
        ))}
      </section>

      <GlassCard className="insight">
        <div className="insight-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="kicker">ALIGNA INSIGHT</p>
          <h3>Back is ready to train.</h3>
          <p>
            Chest and hamstrings are still recovering.
            Today's plan shifts load toward fresher areas.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
