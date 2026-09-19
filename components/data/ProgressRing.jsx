import React from "react";
import { GlowNumber } from "../core/GlowNumber.jsx";

export function ProgressRing({ value = 0, label = "Progresso", tone = "gold", small, size }) {
  const C = 314.16;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = tone === "gold" ? "url(#rg-gold)" : "var(--cyan)";
  return (
    <div className={["hg-ring", small ? "hg-ring-sm" : ""].filter(Boolean).join(" ")} style={size ? { width: size, height: size } : undefined}>
      <svg viewBox="0 0 120 120">
        <defs>
          <linearGradient id="rg-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1c9" /><stop offset=".5" stopColor="#f5c76a" /><stop offset="1" stopColor="#e0a33c" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(80,140,255,.14)" strokeWidth="9" />
        <circle className="hg-ring-arc" cx="60" cy="60" r="50" fill="none" stroke={stroke} strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} />
      </svg>
      <div className="hg-ring-val">
        <GlowNumber value={pct + "%"} tone={tone} size="2rem" />
        <span>{label}</span>
      </div>
    </div>
  );
}
