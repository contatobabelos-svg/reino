import React from "react";

export function Toast({ open, children }) {
  return <div className={["hg-toast", open ? "is-on" : ""].filter(Boolean).join(" ")} role="status">{children}</div>;
}
