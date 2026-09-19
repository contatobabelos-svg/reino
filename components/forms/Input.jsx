import React from "react";

export function Input({ className = "", ...rest }) {
  return <input className={["hg-input", className].filter(Boolean).join(" ")} {...rest} />;
}
