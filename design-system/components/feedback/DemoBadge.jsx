import React from "react";

export function DemoBadge({ inline, href = "configuracoes.html", children = "Modo demonstração" }) {
  return <a className={["hg-selo-demo", inline ? "is-cabecalho" : ""].filter(Boolean).join(" ")} href={href}>{children}</a>;
}
