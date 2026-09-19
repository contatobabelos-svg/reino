const { Panel } = window.BabelOSDesignSystem_5ad360;
const NetworkMap = window.NetworkMapLocal;

/* Globo real do produto: monta window.BabelGlobo (globo.js) com os mesmos opts
   de app/js/app.js:341 e responde com os dados de demonstração (window.BabelDemo).
   Terra → Lua (torre Babel) → Brasil → estado → cidade → bairro.
   Ao chegar no bairro, a rede de empresas (raios de luz) aparece sobre o mapa. */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n, d = 0) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }));
const estrelas = (n) => {
  const cheias = Math.round(Number(n) || 0);
  return '<span class="hg-stars">' + Array.from({ length: 5 }, (_, i) => (i < cheias ? "★" : "<i>★</i>")).join("") + "</span>";
};
const iniciais = (nome) => String(nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");
const buscar = async (recurso, params) => ({ estado: "ok", dados: window.BabelDemo(recurso, params || {}) });

function Globo({ imersivo, usuario }) {
  const ref = React.useRef(null);
  const apiRef = React.useRef(null);
  const [nivel, setNivel] = React.useState("terra");
  const [lugar, setLugar] = React.useState({ uf: "", cidade: "", bairro: "" });
  const [semMapa, setSemMapa] = React.useState(false);
  const [foco, setFoco] = React.useState(null);
  const [host, setHost] = React.useState(null);
  const [posicoes, setPosicoes] = React.useState(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.BabelGlobo) return;
    const api = window.BabelGlobo.criar(el, { buscar, esc, num, estrelas, iniciais, clima: null, empresasGoogle: null, imersivo: !!imersivo });
    apiRef.current = api;
    if (usuario) api.definirUsuario(usuario);
    /* "Ver no mapa" (Rede Completa etc.) deixa um destino pendente: o globo voa até ele ao montar */
    const destino = window.__destinoMapa;
    if (destino) { window.__destinoMapa = null; setTimeout(() => api.irEndereco(destino), 600); }
    /* A cada quadro desenhado, reprojeta as empresas: elas ficam presas ao mapa ao arrastar/zoom. */
    const rede = window.BABEL_DEMO.rede;
    let ultimo = "";
    const reprojetar = () => {
      const b = api.bairroAtual && api.bairroAtual();
      if (!b || b.lat == null) { if (ultimo !== "") { ultimo = ""; setPosicoes(null); } return; }
      const out = {};
      rede.nos.forEach((n) => {
        const p = api.projetar(b.lng + (n.dLng || 0), b.lat + (n.dLat || 0));
        if (p) out[n.id] = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
      });
      const chave = JSON.stringify(out);
      if (chave !== ultimo) { ultimo = chave; setPosicoes(out); }
    };
    el.addEventListener("globo:quadro", reprojetar);
    /* A rede é montada dentro da raiz do globo (mesma área do canvas), por portal. */
    const ov = document.createElement("div");
    ov.className = "hg-rede-host";
    el.appendChild(ov);
    setHost(ov);
    /* globo.js grava o nível atual em data-nivel a cada mudança */
    const obs = new MutationObserver(() => {
      const n = el.dataset.nivel || "terra";
      setNivel((v) => (v === n ? v : n));
      const u = el.dataset.uf || "", c = el.dataset.cidade || "", b = el.dataset.bairro || "";
      setLugar((v) => (v.uf === u && v.cidade === c && v.bairro === b ? v : { uf: u, cidade: c, bairro: b }));
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-nivel", "data-uf", "data-cidade", "data-bairro"] });
    return () => { el.removeEventListener("globo:quadro", reprojetar); api.destruir && api.destruir(); obs.disconnect(); setHost(null); el.innerHTML = ""; el.className = ""; };
  }, [imersivo]);
  const rede = window.BABEL_DEMO.rede;
  /* do Brasil para baixo a cartografia do Reino assume: em qualquer nível dá para descer até a rua */
  /* uma vez dentro do Brasil o mapa fica montado — o globo mexe em data-nivel durante a
     animação e remontar a cada passagem zerava a carga do mapa */
  const [entrou, setEntrou] = React.useState(false);
  React.useEffect(() => { if (nivel !== "terra" && nivel !== "lua") setEntrou(true); }, [nivel]);
  const noMapa = !semMapa && entrou && !!window.ReinoMapa;
  const voltarAoGlobo = () => { setSemMapa(true); setEntrou(false); const api = apiRef.current; api && api.irTerra(); };
  return (
    <>
      <div ref={ref} className="hg-encher" style={noMapa ? { visibility: "hidden" } : undefined} />
      {noMapa ? <window.ReinoMapa uf={lugar.uf} cidade={lugar.cidade} bairro={lugar.bairro} onVoltar={voltarAoGlobo} /> : null}
      {host && nivel === "bairro" && posicoes ? ReactDOM.createPortal(
        <NetworkMap overlay nodes={rede.nos} links={rede.raios} selected={foco} onSelect={setFoco} positions={posicoes} />, host) : null}
    </>
  );
}

function MapaPanel({ title = "Mapa Reino", subtitle = "Gire o planeta, entre no Brasil e desça até o bairro para ver a rede de empresas", usuario, onClose }) {
  return (
    <Panel className="hg-map-panel hg-globo-panel" fill title={title} subtitle={subtitle} onClose={onClose}>
      <Globo usuario={usuario} />
    </Panel>
  );
}

Object.assign(window, { Globo, MapaPanel });
