import React from "react";

export function LineChart({ points = [], labels = [], highlight, height = 150, suffix = "" }) {
  const W = 300, H = 110, PAD = 4;
  if (points.length < 2) return <div className="hg-linha-graf" style={{ height }} />;
  const max = Math.max(...points), min = Math.min(...points);
  const amp = max - min || 1;
  const x = (i) => (i / (points.length - 1)) * W;
  const y = (v) => PAD + (1 - (v - min) / amp) * (H - PAD * 2);
  const d = points.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  const ticks = [max, min + amp / 2, min];
  return (
    <div className="hg-linha-graf" style={{ height }}>
      {highlight != null ? <span className="hg-linha-selo">{highlight}</span> : null}
      <div className="hg-linha-eixo">{ticks.map((t) => <span key={t}>{Math.round(t).toLocaleString("pt-BR")}{suffix}</span>)}</div>
      <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" aria-hidden="true">
        {ticks.map((t) => <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="rgba(80,140,255,.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        <polyline className="area" points={"0," + H + " " + d + " " + W + "," + H} />
        <polyline className="linha" points={d} vectorEffect="non-scaling-stroke" />
        {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" className="ponto" vectorEffect="non-scaling-stroke" />)}
      </svg>
      {labels.length ? <div className="hg-linha-rot">{labels.map((l) => <span key={l}>{l}</span>)}</div> : null}
    </div>
  );
}
