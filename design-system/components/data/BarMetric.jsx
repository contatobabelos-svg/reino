import React from "react";

const CORES = ["var(--cyan)", "var(--violet)", "var(--blue)", "var(--magenta)"];

export function BarMetric({ items = [] }) {
  const max = Math.max(...items.map((i) => Number(i.percent) || 0), 1);
  return (
    <ul className="hg-barras">
      {items.map((it, i) => (
        <li key={it.name}>
          <span className="hg-barras-rot">{it.name}</span>
          <div className="hg-barras-trilha">
            <i style={{ width: ((Number(it.percent) || 0) / max) * 100 + "%", background: it.color || CORES[i % CORES.length] }} />
          </div>
          <b>{it.value}</b>
        </li>
      ))}
    </ul>
  );
}
