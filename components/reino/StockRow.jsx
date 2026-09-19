import React from "react";
import { Sparkline } from "../data/Sparkline.jsx";
import { Icon } from "../core/Icon.jsx";

const brl = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const pct = (n) => (n == null ? "—" : (n > 0 ? "+" : "") + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%");
const compacto = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 }));
const seta = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "■");

export function StockRow({ symbol, name, value, changeValue, changePercent, volume, low, high, points, index = 0, force = 0.5, onOpen, onRemove }) {
  const cls = changePercent > 0 ? "is-alta" : changePercent < 0 ? "is-baixa" : "is-neutro";
  const trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : undefined;
  const p = low != null && high != null && high > low ? Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100)) : null;
  return (
    <article className={"hg-bolsa-linha " + cls} role="listitem" tabIndex={0} style={{ "--i": index, "--forca": force }}
             onClick={onOpen} onKeyDown={(e) => { if (onOpen && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}>
      <div className="hg-bolsa-ativo">
        <span className="hg-bolsa-logo" style={{ width: 36, height: 36 }}>{String(symbol).slice(0, 2)}</span>
        <div><strong>{symbol}<i className="hg-live" title="Ao vivo" /></strong><span>{name}</span></div>
      </div>
      <div className="hg-bolsa-preco">{brl(value)}<small>{changeValue > 0 ? "+" : ""}{brl(changeValue)}</small></div>
      <div className={"hg-bolsa-pill " + cls}>{seta(changePercent)} {pct(changePercent)}</div>
      <div className="hg-bolsa-sessao"><Sparkline points={points} trend={trend} /></div>
      <div className="hg-bolsa-mm">
        {p != null ? (
          <div className="hg-bolsa-faixa" title="Mínima e máxima do dia">
            <span>{brl(low)}</span><div><i style={{ left: p + "%" }} /></div><span>{brl(high)}</span>
          </div>
        ) : <span className="hg-sub">—</span>}
      </div>
      <div className="hg-bolsa-vol"><span>Volume</span><b>{compacto(volume)}</b></div>
      <button className="hg-x" onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }} aria-label={"Remover " + symbol + " da lista"}><Icon name="x" /></button>
    </article>
  );
}
