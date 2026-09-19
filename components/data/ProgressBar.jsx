import React from "react";

export function ProgressBar({ value = 0, color }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const style = { width: pct + "%" };
  if (color) { style.background = color; style.boxShadow = "0 0 10px " + color; }
  return <div className="hg-bar"><i style={style} /></div>;
}
