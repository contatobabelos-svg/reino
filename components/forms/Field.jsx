import React from "react";

export function Field({ label, hint, inline, htmlFor, children }) {
  if (inline) return <label className="hg-field-inline" htmlFor={htmlFor}>{label} {children}</label>;
  return (
    <div className="hg-field">
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
