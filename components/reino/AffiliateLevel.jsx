import React from "react";
import { Icon } from "../core/Icon.jsx";
import { ProgressBar } from "../data/ProgressBar.jsx";

export function AffiliateLevel({ level, nivel, indicados, proximo, progress = 0, compact }) {
  const rotulo = level || nivel;
  return (
    <div className={["hg-nivel", compact ? "is-compacto" : ""].filter(Boolean).join(" ")}>
      <span className="hg-nivel-selo"><Icon name="coroa" /></span>
      <div className="hg-nivel-info">
        <strong>{rotulo}</strong>
        <span>{indicados != null ? Number(indicados).toLocaleString("pt-BR") + " indicados" : "—"}{proximo ? " · " + proximo : ""}</span>
        {!compact ? <ProgressBar value={progress} color="var(--gold)" /> : null}
      </div>
    </div>
  );
}
