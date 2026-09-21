import React from "react";

export function Select({ className = "", children, ...rest }) {
  return <select className={["hg-select", className].filter(Boolean).join(" ")} {...rest}>{children}</select>;
}
