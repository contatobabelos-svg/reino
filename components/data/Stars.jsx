import React from "react";

export function Stars({ value = 0, max = 5, showValue }) {
  const cheias = Math.round(Number(value) || 0);
  return (
    <span className="hg-stars" title={value + " de " + max}>
      {Array.from({ length: max }, (_, i) => (i < cheias ? <React.Fragment key={i}>★</React.Fragment> : <i key={i}>★</i>))}
      {showValue ? <span style={{ marginLeft: ".35rem", fontSize: "var(--fs-meta)" }}>{value}</span> : null}
    </span>
  );
}
