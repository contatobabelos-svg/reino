import React from "react";

export function Pill({ as = "b", className = "", children, ...rest }) {
  const Tag = as;
  return <Tag className={["hg-pill", className].filter(Boolean).join(" ")} {...rest}>{children}</Tag>;
}
