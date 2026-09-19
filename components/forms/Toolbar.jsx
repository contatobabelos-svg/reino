import React from "react";

export function Toolbar({ as = "div", className = "", children, ...rest }) {
  const Tag = as;
  return <Tag className={["hg-toolbar", className].filter(Boolean).join(" ")} {...rest}>{children}</Tag>;
}
