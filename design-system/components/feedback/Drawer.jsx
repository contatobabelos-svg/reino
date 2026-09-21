import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Drawer({ open, title, subtitle, wide, onClose, children }) {
  const cls = ["hg-drawer", open ? "is-open" : "", wide ? "is-bolsa" : ""].filter(Boolean).join(" ");
  return (
    <aside className={cls} aria-label={title} aria-hidden={!open}>
      <div className="hg-head">
        <div>
          <h2 className="hg-title">{title}</h2>
          {subtitle ? <p className="hg-sub">{subtitle}</p> : null}
        </div>
        <button className="hg-x" onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
      </div>
      {children}
    </aside>
  );
}
