import React from "react";
import { Icon } from "./Icon.jsx";

export function IconButton({ icon, label, active, dot, className = "", children, ...rest }) {
  const cls = ["hg-icon-btn", active ? "is-on" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {icon ? <Icon name={icon} /> : children}
      {dot ? <span className="hg-badge-dot" /> : null}
    </button>
  );
}
