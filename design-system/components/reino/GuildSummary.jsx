import React from "react";
import { Icon } from "../core/Icon.jsx";
import { GlowNumber } from "../core/GlowNumber.jsx";

export function GuildSummary({ nome, lider, pontos = 0, membros = [] }) {
  return (
    <>
      <div className="hg-guilda">
        <span className="hg-guilda-brasao"><Icon name="guilda" /></span>
        <div>
          <strong className="hg-gold" style={{ display: "block", font: "700 1.05rem var(--font-d)" }}>{nome}</strong>
          <span className="hg-sub">Líder: {lider}</span>
        </div>
        <div className="hg-guilda-pts">
          <GlowNumber value={Number(pontos).toLocaleString("pt-BR")} size="1.8rem" />
          <span className="hg-sub">pontos</span>
        </div>
      </div>
      <ul className="hg-list" style={{ marginTop: "1rem" }}>
        {membros.map((m) => (
          <li className="hg-row" key={m.nome}>
            <span className="hg-avatar">{m.nome.trim().split(/\s+/).slice(0, 2).map((s) => s[0].toUpperCase()).join("")}</span>
            <div><strong>{m.nome}</strong><span>{m.titulo || "Membro"}</span></div>
          </li>
        ))}
      </ul>
    </>
  );
}
