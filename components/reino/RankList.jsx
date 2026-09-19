import React from "react";

export function RankList({ items = [] }) {
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "/mês";
  return (
    <ol className="hg-titulos">
      {items.map((x, i) => (
        <li key={x.nome}>
          <span className="hg-rank">{i + 1}</span>
          <div><strong className="hg-gold">{x.nome}</strong><span>{x.descricao || ""}</span></div>
          {x.mensalidade != null ? <b>{brl(x.mensalidade)}</b> : x.valor != null ? <b>{x.valor}</b> : null}
        </li>
      ))}
    </ol>
  );
}
