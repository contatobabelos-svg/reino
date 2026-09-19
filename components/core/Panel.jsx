import React from "react";
import { SectionHead } from "./SectionHead.jsx";

/* Painel de holograma: fundo em gradiente, borda-gradiente (::before) e a
   faixa de luz neon no topo (::after) vêm de .hg-panel em babel-ui.css. */
export function Panel({ tone, fill, title, subtitle, onClose, actions, headingLevel = 2, className = "", children, ...rest }) {
  const cls = ["hg-panel", tone ? "is-" + tone : "", fill ? "hg-encher" : "", className].filter(Boolean).join(" ");
  return (
    <article className={cls} {...rest}>
      {(title || actions || onClose) && (
        <SectionHead title={title} subtitle={subtitle} onClose={onClose} actions={actions} headingLevel={headingLevel} />
      )}
      {children}
    </article>
  );
}
