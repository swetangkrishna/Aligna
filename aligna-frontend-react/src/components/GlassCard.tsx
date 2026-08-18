import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ className = "", children }: Props) {
  return (
    <section className={`glass-card ${className}`}>
      {children}
    </section>
  );
}
