import React from "react";

export function Switch({ label, hint, id, ...rest }) {
  return (
    <div className="hg-switch">
      <label htmlFor={id}>
        {label}
        {hint ? <small style={{ display: "block", color: "var(--text-3)", fontSize: "var(--fs-meta)" }}>{hint}</small> : null}
      </label>
      <input type="checkbox" id={id} {...rest} />
    </div>
  );
}
