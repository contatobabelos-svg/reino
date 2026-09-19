import React from "react";

export function TitleChip({ nome, descricao, mensalidade, selected, onSelect }) {
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "/mês";
  return (
    <button className="hg-titulo-chip" role="radio" aria-checked={!!selected} onClick={onSelect} type="button">
      <b>{nome}</b>
      <span>{descricao}</span>
      {mensalidade != null ? <small>{brl(mensalidade)}</small> : null}
    </button>
  );
}
