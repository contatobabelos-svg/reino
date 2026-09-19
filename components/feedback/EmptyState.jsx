import React from "react";
import { Icon } from "../core/Icon.jsx";

export function EmptyState({ icon = "camadas", title = "Nada por aqui ainda", description, style }) {
  return (
    <div className="hg-empty" style={style}>
      <span className="hg-empty-ico"><Icon name={icon} /></span>
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}
