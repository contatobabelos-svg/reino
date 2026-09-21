const { Icon } = window.BabelOSDesignSystem_5ad360;
/* Cópia local de components/reino/NetworkMap.jsx (com a prop positions) — o bundle
   compilado é atualizado ao fim do turno; o kit não pode depender disso. */

const iniciais = (nome) => String(nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

/* Rede ao vivo: empresas como nós sobre o mapa, ligadas por fios de luz.
   x/y são porcentagens do painel, então a rede acompanha qualquer tamanho.

   [AC] Os fios seguem o Cérebro Babel (~/apps/cerebro-babel/src/main.js): fio
   MUITO fino, ciano e semitransparente, sem halo grosso, com duas partículas
   luminosas viajando nele em velocidade constante, fases e sentidos variados, e
   mais aceso quando um dos dois pinos está selecionado. As partículas andam por
   requestAnimationFrame sobre as coordenadas do quadro atual, então acompanham
   o arraste e o zoom do globo sem descolar. */
function NetworkMapLocal({ nodes = [], links = [], selected, onSelect, footer, height, overlay, positions }) {
  /* positions: { [id]: {x, y} } em px (ancorado ao mapa) — quando ausente usa x/y em % dos nós */
  const pos = (n) => (positions ? positions[n.id] : { x: n.x, y: n.y });
  const un = positions ? "px" : "%";
  const visiveis = nodes.filter((n) => pos(n));
  const porId = Object.fromEntries(visiveis.map((n) => [n.id, n]));
  const atual = nodes.find((n) => n.id === selected);
  const reduz = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* fios válidos (os dois pinos na tela) já com as pontas resolvidas */
  const fios = links.map(([a, b]) => {
    const na = porId[a], nb = porId[b];
    if (!na || !nb) return null;
    const pa = pos(na), pb = pos(nb);
    return { a, b, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, aceso: !!selected && (a === selected || b === selected) };
  }).filter(Boolean);

  /* partículas: 2 por fio, animadas fora do React para não re-renderizar a cada quadro */
  const fotonsRef = React.useRef([]);
  const fiosRef = React.useRef(fios);
  fiosRef.current = fios;
  React.useEffect(() => {
    if (reduz) return undefined;
    let id = 0, t0 = performance.now();
    const passo = (t) => {
      const seg = (t - t0) / 1000;
      fiosRef.current.forEach((f, i) => {
        for (let k = 0; k < 2; k++) {
          const el = fotonsRef.current[i * 2 + k];
          if (!el) continue;
          const sentido = i % 2 ? -1 : 1;
          const fase = ((i * 0.37 + k * 0.5) % 1);
          let u = (fase + sentido * seg * (f.aceso ? 0.34 : 0.21)) % 1;
          if (u < 0) u += 1;
          el.setAttribute("cx", f.x1 + (f.x2 - f.x1) * u);
          el.setAttribute("cy", f.y1 + (f.y2 - f.y1) * u);
          el.setAttribute("opacity", f.aceso ? 1 : 0.75);
        }
      });
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [reduz]);

  return (
    <div className={"hg-rede-mapa" + (overlay ? " is-overlay" : "") + (positions ? " is-ancorada" : "")} style={height ? { height } : undefined}>
      <svg className="hg-rede-raios" viewBox={positions ? undefined : "0 0 100 100"} preserveAspectRatio="none" aria-hidden="true">
        {fios.map((f, i) => (
          <line key={"f" + i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} className={"hg-fio" + (f.aceso ? " is-aceso" : "")} />
        ))}
        {reduz ? null : fios.flatMap((f, i) => [0, 1].map((k) => (
          <circle key={"p" + i + "-" + k} r={f.aceso ? 2.1 : 1.6} className={"hg-foton" + (f.aceso ? " is-aceso" : "")}
            ref={(el) => { fotonsRef.current[i * 2 + k] = el; }} />
        )))}
      </svg>
      {visiveis.map((n) => <i key={"p" + n.id} className="hg-rede-ponto" style={{ left: pos(n).x + un, top: pos(n).y + un }} aria-hidden="true" />)}
      {visiveis.map((n, i) => {
        const conteudo = n.foto ? <img src={n.foto} alt="" /> : <b>{iniciais(n.nome)}</b>;
        return (
          <button key={n.id} className={"hg-rede-no" + (n.id === selected ? " is-ativo" : "") + (n.eu ? " is-eu" : "")}
            style={{ left: pos(n).x + un, top: pos(n).y + un, "--giro": (7 + (i % 5) * 0.5).toFixed(1) + "s", "--fase": "-" + (i * 1.3).toFixed(1) + "s" }}
            onClick={() => onSelect && onSelect(n.id)}
            aria-label={n.nome + (n.nicho ? " · " + n.nicho : "") + (n.eu ? " · sua empresa" : "")} aria-pressed={n.id === selected}>
            {/* duas faces: o pino gira 360° e a foto continua legível dos dois lados */}
            <span className="hg-rede-pino">
              <span className="hg-rede-face">{conteudo}</span>
              <span className="hg-rede-face is-verso">{conteudo}</span>
            </span>
            <span className="hg-rede-rotulo">{n.nome}</span>
          </button>
        );
      })}
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
