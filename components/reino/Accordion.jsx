import React from "react";

export function Accordion({ title, value, children, open }) {
  return (
    <details className="hg-acc" open={open}>
      <summary>{title}{value != null ? <b>{value}</b> : null}</summary>
      {children}
    </details>
  );
}
