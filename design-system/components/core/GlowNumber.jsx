import React from "react";

export function GlowNumber({ value, suffix, tone, empty, size, className = "", ...rest }) {
  const cls = ["hg-glow-num", tone === "gold" ? "hg-gold-glow" : "", empty ? "is-empty" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={size ? { fontSize: size } : undefined} {...rest}>
      <span>{empty ? "—" : value}</span>
      {suffix ? <small>{suffix}</small> : null}
    </div>
  );
}
