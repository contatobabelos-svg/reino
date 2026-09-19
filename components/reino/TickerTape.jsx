import React from "react";

const brl = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const pct = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%");
const seta = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "■");

export function TickerTape({ items = [], onSelect, paused }) {
  if (!items.length) return <div className="hg-tape" aria-label="Cotações em tempo real"><div className="hg-tape-trilha"><span className="hg-tape-vazio">Carregando cotações…</span></div></div>;
  const item = (a, i, dup) => (
    <button className="hg-tape-item" key={(dup ? "d" : "") + a.symbol + i} onClick={() => onSelect && onSelect(a.symbol)} tabIndex={dup ? -1 : 0}>
      <span className="hg-bolsa-logo" style={{ width: 22, height: 22 }}>{String(a.symbol).slice(0, 2)}</span>
      <b>{a.symbol}</b>
      <span>{brl(a.value)}</span>
      <em className={a.changePercent > 0 ? "is-alta" : a.changePercent < 0 ? "is-baixa" : "is-neutro"}>{seta(a.changePercent)} {pct(a.changePercent)}</em>
    </button>
  );
  return (
    <div className="hg-tape" aria-label="Cotações em tempo real">
      <div className={["hg-tape-trilha", paused ? "is-parado" : ""].filter(Boolean).join(" ")}
           style={{ "--dur": Math.max(20, items.length * 5) + "s" }}>
        {items.map((a, i) => item(a, i))}
        <span aria-hidden="true" className="hg-tape-dup">{items.map((a, i) => item(a, i, true))}</span>
      </div>
    </div>
  );
}
