import React from "react";
import { ProgressBar } from "./ProgressBar.jsx";

export function MetricRow({ name, label, value = 0, color }) {
  return (
    <div className="hg-metric">
      <div className="hg-metric-row">{name} <b>{label}</b></div>
      <ProgressBar value={value} color={color} />
    </div>
  );
}
