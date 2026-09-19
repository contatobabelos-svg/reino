import React from "react";

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="hg-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
