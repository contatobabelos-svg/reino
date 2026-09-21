import React from "react";

/* Mesmo desenho do produto: polilinha de área + linha, viewBox 120x36 esticado. */
export function Sparkline({ points = [], trend, style }) {
  const cls = ["hg-bolsa-spark", trend === "up" ? "is-alta" : trend === "down" ? "is-baixa" : ""].filter(Boolean).join(" ");
  if (!points || points.length < 2) {
    return (
      <svg className="hg-bolsa-spark" viewBox="0 0 120 36" aria-hidden="true" style={style}>
        <line x1="0" y1="18" x2="120" y2="18" stroke="rgba(120,170,255,.25)" strokeDasharray="3 4" />
      </svg>
    );
  }
  const min = Math.min(...points), max = Math.max(...points), amp = max - min || 1;
  const pts = points.map((v, i) => ((i / (points.length - 1)) * 120).toFixed(1) + "," + (32 - ((v - min) / amp) * 28).toFixed(1)).join(" ");
  return (
    <svg className={cls} viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true" style={style}>
      <polyline points={"0,36 " + pts + " 120,36"} className="area" />
      <polyline points={pts} className="linha" />
    </svg>
  );
}
