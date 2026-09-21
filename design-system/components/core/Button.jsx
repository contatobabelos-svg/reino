import React from "react";
import { Icon } from "./Icon.jsx";

export function Button({ variant = "primary", block, icon, as, href, className = "", children, ...rest }) {
  const cls = ["hg-btn", variant !== "primary" ? "is-" + variant : "", block ? "is-block" : "", className].filter(Boolean).join(" ");
  const Tag = as || (href ? "a" : "button");
  return (
    <Tag className={cls} href={href} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Tag>
  );
}
