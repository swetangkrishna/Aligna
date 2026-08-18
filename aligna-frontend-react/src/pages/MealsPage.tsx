import { Filter, Plus, ShoppingBag } from "lucide-react";
import { MealScene } from "../components/MealScene";
import { GlassCard } from "../components/GlassCard";

export function MealsPage() {
  return (
    <div className="page">
      <section className="hero-copy compact">
        <p className="kicker">SMART NUTRITION</p>
        <h1>Meals</h1>
        <p>Built around your goal, kitchen and training load.</p>
      </section>

      <GlassCard className="inventory-card">
        <div className="row-between">
          <div className="row-gap">
            <ShoppingBag size={19} />
            <div>
              <strong>12 ingredients at home</strong>
              <small>Enough for 5 suggested meals</small>
            </div>
          </div>
          <button className="icon-button"><Plus size={17} /></button>
        </div>
      </GlassCard>

      <section className="meal-feature">
        <MealScene />
        <div className="meal-feature-copy">
          <span className="pill">Recommended now</span>
          <h2>Chicken grain bowl</h2>
          <p>
            High protein · uses 6 ingredients you already have.
          </p>

          <div className="macro-bars">
            {[
              ["Protein", "48g", "78%"],
              ["Carbs", "64g", "62%"],
              ["Fats", "22g", "43%"]
            ].map(([label, value, width]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <i><b style={{ width }} /></i>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="filter-strip">
        <button className="filter active">For you</button>
        <button className="filter">High protein</button>
        <button className="filter">Quick</button>
        <button className="filter icon"><Filter size={14} /></button>
      </section>

      <section className="preference-grid">
        {[
          "Gluten free",
          "Dairy aware",
          "Nut filter",
          "Vegetarian",
          "Pescatarian",
          "Eggitarian"
        ].map((item) => (
          <button key={item}>{item}</button>
        ))}
      </section>
    </div>
  );
}
