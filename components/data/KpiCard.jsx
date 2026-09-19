import React from "react";
import { GlowNumber } from "../core/GlowNumber.jsx";
import { Icon } from "../core/Icon.jsx";

export function KpiCard({ label, value, suffix, foot, trend, onClose, empty, size = "1.75rem" }) {
  return (
    <article className="hg-panel hg-kpi">
      <div className="hg-head">
        <span className="hg-kpi-label">{label}</span>
        {onClose ? <button className="hg-x" onClick={onClose} aria-label="Ocultar widget"><Icon name="x" /></button> : null}
      </div>
      <GlowNumber value={value} suffix={suffix} empty={empty} size={size} />
      {foot !== undefined ? (
        <div className="hg-kpi-foot">
          {trend != null ? <b className={trend < 0 ? "is-down" : undefined}>{trend > 0 ? "+" : ""}{trend}%</b> : null}
          {trend != null && foot ? " " : null}
          {foot}
        </div>
      ) : null}
    </article>
  );
}
