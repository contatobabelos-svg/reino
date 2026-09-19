const { Icon } = window.BabelOSDesignSystem_5ad360;
/* Cópia local de components/reino/NetworkMap.jsx (com a prop positions) — o bundle
   compilado é atualizado ao fim do turno; o kit não pode depender disso. */

const iniciais = (nome) => String(nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

/* Rede ao vivo: empresas como nós sobre o mapa, ligadas por raios de luz.
   x/y são porcentagens do painel, então a rede acompanha qualquer tamanho. */
function NetworkMapLocal({ nodes = [], links = [], selected, onSelect, footer, height, overlay, positions }) {
  /* positions: { [id]: {x, y} } em px (ancorado ao mapa) — quando ausente usa x/y em % dos nós */
  const pos = (n) => (positions ? positions[n.id] : { x: n.x, y: n.y });
  const un = positions ? "px" : "%";
  const visiveis = nodes.filter((n) => pos(n));
  const porId = Object.fromEntries(visiveis.map((n) => [n.id, n]));
  const atual = nodes.find((n) => n.id === selected);
  return (
    <div className={"hg-rede-mapa" + (overlay ? " is-overlay" : "") + (positions ? " is-ancorada" : "")} style={height ? { height } : undefined}>
      <svg className="hg-rede-raios" viewBox={positions ? undefined : "0 0 100 100"} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="hg-raio-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3fe3ff" /><stop offset="1" stopColor="#8b5cff" />
          </linearGradient>
        </defs>
        {links.map(([a, b], i) => {
          const na = porId[a], nb = porId[b];
          if (!na || !nb) return null;
          const aceso = selected && (a === selected || b === selected);
          const cls = aceso ? " is-aceso" : "";
          const pa = pos(na), pb = pos(nb);
          const pos2 = { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y };
          return (
            <g key={i} style={{ "--atraso": (i * 0.55) + "s" }}>
              <line {...pos2} className={"hg-raio-halo" + cls} />
              <line {...pos2} className={"hg-raio" + cls} />
              <line {...pos2} className={"hg-raio-pulso" + cls} />
            </g>
          );
        })}
      </svg>
      {visiveis.map((n) => <i key={"p" + n.id} className="hg-rede-ponto" style={{ left: pos(n).x + un, top: pos(n).y + un }} aria-hidden="true" />)}
      {visiveis.map((n) => (
        <button key={n.id} className={"hg-rede-no" + (n.id === selected ? " is-ativo" : "")}
          style={{ left: pos(n).x + un, top: pos(n).y + un }} onClick={() => onSelect && onSelect(n.id)}
          aria-label={n.nome + (n.nicho ? " · " + n.nicho : "")} aria-pressed={n.id === selected}>
          <span className="hg-rede-pino">
            {n.foto ? <img src={n.foto} alt="" /> : <b>{iniciais(n.nome)}</b>}
          </span>
          <span className="hg-rede-rotulo">{n.nome}</span>
        </button>
      ))}
      {atual ? (
        <aside className="hg-rede-cartao">
          <p className="hg-globo-sobre">{atual.nicho || "Empresa do Reino"}</p>
          <strong>{atual.nome}</strong>
          {atual.cidade ? <span><Icon name="pin" />{atual.cidade}</span> : null}
          {atual.estado ? <span className="hg-rede-estado">{atual.estado}</span> : null}
        </aside>
      ) : null}
      {footer ? <div className="hg-rede-dock">{footer}</div> : null}
    </div>
  );
}

Object.assign(window, { NetworkMapLocal });
