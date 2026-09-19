import React from "react";
import { GlowNumber } from "../core/GlowNumber.jsx";

const CORES = ["var(--cyan)", "var(--violet)", "var(--blue)", "var(--magenta)", "var(--gold)"];

export function DonutChart({ segments = [], total, label, legend = true, size = 168 }) {
  const soma = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  const R = 50, C = 2 * Math.PI * R;
  let acumulado = 0;
  const arcos = segments.map((s, i) => {
    const frac = (Number(s.value) || 0) / soma;
    const arco = { cor: s.color || CORES[i % CORES.length], dash: C * frac, offset: -C * acumulado, pct: Math.round(frac * 100) };
    acumulado += frac;
    return arco;
  });
  return (
    <div className="hg-donut">
      <div className="hg-donut-graf" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(80,140,255,.14)" strokeWidth="13" />
          {arcos.map((a, i) => (
            <circle key={i} cx="60" cy="60" r={R} fill="none" stroke={a.cor} strokeWidth="13" strokeLinecap="butt"
              strokeDasharray={a.dash + " " + (C - a.dash)} strokeDashoffset={a.offset}
              transform="rotate(-90 60 60)" style={{ filter: "drop-shadow(0 0 6px currentColor)", color: a.cor }} />
          ))}
        </svg>
        <div className="hg-donut-val">
          <GlowNumber value={total != null ? total : soma.toLocaleString("pt-BR")} size="1.6rem" />
          <span>{label || "total"}</span>
        </div>
      </div>
      {legend ? (
        <ul className="hg-donut-leg">
          {segments.map((s, i) => (
            <li key={s.name}><i style={{ background: arcos[i].cor }} />{s.name}<b>{arcos[i].pct}%</b></li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
