import React from "react";
import { Icon } from "./Icon.jsx";

export function SectionHead({ title, subtitle, onClose, actions, headingLevel = 2 }) {
  const H = "h" + headingLevel;
  return (
    <div className="hg-head">
      <div>
        {title ? <H className="hg-title">{title}</H> : null}
        {subtitle ? <p className="hg-sub">{subtitle}</p> : null}
      </div>
      {actions}
      {onClose ? (
        <button className="hg-x" onClick={onClose} aria-label="Ocultar widget"><Icon name="x" /></button>
      ) : null}
    </div>
  );
}
