import React from "react";

export function MarketStatus({ open, children }) {
  return (
    <span className={["hg-bolsa-pregao", open ? "is-aberto" : ""].filter(Boolean).join(" ")}>
      <i />{children || (open ? "Pregão aberto" : "Pregão fechado")}
    </span>
  );
}
