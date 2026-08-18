import type { PropsWithChildren } from "react";
import {
  Dumbbell,
  Home,
  Salad,
  Settings2,
  TrendingUp
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Today", icon: Home },
  { path: "/meals", label: "Meals", icon: Salad },
  { path: "/train", label: "Train", icon: Dumbbell },
  { path: "/progress", label: "Progress", icon: TrendingUp }
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <strong>Aligna</strong>
        </div>

        <button
          className="icon-button"
          aria-label="Open settings"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("aligna-open-settings")
            )
          }
        >
          <Settings2 size={18} />
        </button>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const active =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);

          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              className={active ? "nav-item active" : "nav-item"}
              onClick={() => navigate(tab.path)}
            >
              <span className="nav-icon">
                {active && (
                  <motion.span
                    className="nav-active"
                    layoutId="nav"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32
                    }}
                  />
                )}
                <Icon size={19} />
              </span>
              <small>{tab.label}</small>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
