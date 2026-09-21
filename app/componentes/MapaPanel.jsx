const { Panel } = window.BabelOSDesignSystem_5ad360;
const NetworkMap = window.NetworkMapLocal;

/* Globo real do produto: monta window.BabelGlobo (globo.js) com os mesmos opts
   de app/js/app.js:341 e responde com os dados de demonstração (window.BabelDemo).
   Terra → Lua (torre Babel) → Brasil → estado → cidade → bairro.
   Ao chegar no bairro, a rede de empresas aparece sobre o mapa.

   [AC] Só entram no mapa empresas CADASTRADAS COM FOTO (public.empresas_do_mapa,
   via app/servicos/empresas.js). Os nós de demonstração saíram. Enquanto o
   cadastro não pedir cidade e UF, quem não tem localização não aparece — a única
   exceção é a empresa da própria conta, colocada no lugar do usuário. */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n, d = 0) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }));
const estrelas = (n) => {
  const cheias = Math.round(Number(n) || 0);
  return '<span class="hg-stars">' + Array.from({ length: 5 }, (_, i) => (i < cheias ? "★" : "<i>★</i>")).join("") + "</span>";
};
const iniciais = (nome) => String(nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");
const buscar = async (recurso, params) => ({ estado: "ok", dados: window.BabelDemo(recurso, params || {}) });

/* ---------- [AC] posição das empresas no mapa ---------- */
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/* espalhamento estável: a mesma empresa cai sempre no mesmo ponto do bairro */
function semente(id) {
  let h = 2166136261;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/* espiral (ângulo de ouro) + tempero estável do id: espalha sem empilhar e a mesma
   lista cai sempre nos mesmos lugares */
function deslocamento(id, grau, i, total) {
  const h = semente(id);
  const ang = i * 2.399963 + (h % 628) / 100;
  const k = total > 1 ? 0.34 + 0.66 * Math.sqrt((i + 0.6) / total) : 0.22;
  const r = grau * k * (0.86 + ((h >>> 9) % 28) / 100);
  return [Math.cos(ang) * r, Math.sin(ang) * r * 0.62];
}
/* centroide do município do IBGE (app/dados/municipios-tudo.js) */
function centroide(uf, cidade) {
  const emb = window.REINO_MUNICIPIOS && window.REINO_MUNICIPIOS[String(uf || "").toUpperCase()];
  if (!emb) return null;
  const alvo = semAcento(cidade);
  const m = emb.cidades.find((x) => semAcento(x.nome) === alvo);
  return m && m.c ? { lng: m.c[0], lat: m.c[1] } : null;
}
/* empresas do bairro em que o globo está: as da mesma cidade + a da própria conta */
function empresasDoLugar(lista, eu, lugar, bairro) {
  const cidade = semAcento(lugar.cidade), uf = String(lugar.uf || "").toUpperCase();
  const centro = bairro && bairro.lat != null ? bairro : centroide(uf, lugar.cidade);
  if (!centro) return [];
  const vistos = new Set();
  const escolhidas = [];
  const por = (e, ehEu) => {
    if (!e || !e.id || !e.foto || !e.empresa || vistos.has(e.id)) return;
    vistos.add(e.id);
    escolhidas.push({ ...e, ehEu: !!ehEu });
  };
  if (eu && semAcento(eu.cidade) === cidade && (!eu.uf || String(eu.uf).toUpperCase() === uf)) por(eu, true);
  lista.forEach((e) => { if (semAcento(e.cidade) === cidade && String(e.uf || "").toUpperCase() === uf) por(e, false); });
  /* sem rua no cadastro, a posição é o centro do bairro (ou o centroide do município)
     mais um deslocamento estável por empresa — ninguém fica empilhado */
  const grau = bairro ? 0.0105 : 0.06;
  return escolhidas.map((e, i) => {
    const [dLng, dLat] = deslocamento(e.id, grau, i, escolhidas.length);
    return { ...e, lng: centro.lng + dLng, lat: centro.lat + dLat };
  });
}
/* grafo de proximidade: cada empresa liga nas 2 vizinhas mais próximas, sem aresta repetida */
function ligacoes(nos) {
  const feitas = new Set(), saida = [];
  nos.forEach((a, i) => {
    nos.map((b, j) => ({ j, d: (b.lng - a.lng) ** 2 + (b.lat - a.lat) ** 2 }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const k = i < j ? i + "|" + j : j + "|" + i;
        if (feitas.has(k)) return;
        feitas.add(k);
        saida.push([nos[i].id, nos[j].id]);
      });
  });
  return saida;
}

function Globo({ imersivo, usuario }) {
  const ref = React.useRef(null);
  const apiRef = React.useRef(null);
  const [nivel, setNivel] = React.useState("terra");
  const [lugar, setLugar] = React.useState({ uf: "", cidade: "", bairro: "" });
  const [semMapa, setSemMapa] = React.useState(false);
  const [foco, setFoco] = React.useState(null);
  const [host, setHost] = React.useState(null);
  const [hostMapa, setHostMapa] = React.useState(null);
  const [posicoes, setPosicoes] = React.useState(null);
  const [empresas, setEmpresas] = React.useState([]);
  /* a empresa da própria conta entra sempre (quando tem foto), no lugar do usuário */
  const [minha, setMinha] = React.useState(null);
  const nosRef = React.useRef([]);

  /* lista real do banco: só perfis com foto, empresa e situação aprovada */
  React.useEffect(() => {
    let vivo = true;
    if (window.ReinoEmpresas) window.ReinoEmpresas.doMapa().then((l) => vivo && setEmpresas(l || []));
    const c = window.ReinoContas && window.ReinoContas.sessao && window.ReinoContas.sessao();
    if (c && c.foto && c.empresa) {
      setMinha({ id: c.id || "minha-conta", empresa: c.empresa, foto: c.foto, titulo: c.titulo || null, cidade: (usuario && usuario.cidade) || c.cidade, uf: (usuario && usuario.uf) || c.uf });
    }
    return () => { vivo = false; };
  }, [usuario && usuario.cidade, usuario && usuario.uf]);

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
    let ultimo = "";
    const reprojetar = () => {
      const b = api.bairroAtual && api.bairroAtual();
      if (!b || b.lat == null) { if (ultimo !== "") { ultimo = ""; setPosicoes(null); } return; }
      const out = {};
      nosRef.current.forEach((n) => {
        const p = api.projetar(n.lng, n.lat);
        if (p) out[n.id] = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
      });
      const chave = JSON.stringify(out);
      if (chave !== ultimo) { ultimo = chave; setPosicoes(out); }
    };
    el.addEventListener("globo:quadro", reprojetar);
    /* o cartão da faixa de baixo acende o pino correspondente */
    const escolher = (e) => setFoco(e.detail && e.detail.id);
    el.addEventListener("globo:empresa", escolher);
    /* A rede é montada dentro do palco do globo (mesma área do canvas), por portal. */
    const palco = api.palco || el;
    const ov = document.createElement("div");
    ov.className = "hg-rede-host";
    palco.appendChild(ov);
    setHost(ov);
    /* [AC] a cartografia real também entra no palco (e não sobre o painel inteiro):
       assim a faixa de cartões continua visível embaixo, em qualquer nível. */
    const hm = document.createElement("div");
    hm.className = "hg-mapa-host";
    palco.appendChild(hm);
    setHostMapa(hm);
    /* globo.js grava o nível atual em data-nivel a cada mudança */
    const obs = new MutationObserver(() => {
      const n = el.dataset.nivel || "terra";
      setNivel((v) => (v === n ? v : n));
      const u = el.dataset.uf || "", c = el.dataset.cidade || "", b = el.dataset.bairro || "";
      setLugar((v) => (v.uf === u && v.cidade === c && v.bairro === b ? v : { uf: u, cidade: c, bairro: b }));
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-nivel", "data-uf", "data-cidade", "data-bairro"] });
    return () => {
      el.removeEventListener("globo:quadro", reprojetar);
      el.removeEventListener("globo:empresa", escolher);
      api.destruir && api.destruir(); obs.disconnect(); setHost(null); setHostMapa(null); el.innerHTML = ""; el.className = "";
    };
  }, [imersivo]);

  /* nós e fios do bairro atual (só empresas com foto) */
  const nos = React.useMemo(() => {
    if (nivel !== "bairro" || !lugar.cidade) return [];
    const api = apiRef.current;
    const b = api && api.bairroAtual && api.bairroAtual();
    return empresasDoLugar(empresas, minha, lugar, b);
  }, [nivel, lugar.uf, lugar.cidade, lugar.bairro, empresas, minha]);
  const fios = React.useMemo(() => ligacoes(nos), [nos]);
  nosRef.current = nos;
  /* a faixa abaixo do globo lista exatamente as mesmas empresas */
  React.useEffect(() => {
    const api = apiRef.current;
    if (api && api.definirEmpresas) api.definirEmpresas(nos.map((n) => ({ id: n.id, empresa: n.empresa, foto: n.foto, cidade: n.cidade, uf: n.uf, titulo: n.titulo })));
  }, [nos]);
  React.useEffect(() => { if (foco && !nos.some((n) => n.id === foco)) setFoco(null); }, [nos, foco]);

  /* do Brasil para baixo a cartografia do Reino assume: em qualquer nível dá para descer até a rua */
  /* uma vez dentro do Brasil o mapa fica montado — o globo mexe em data-nivel durante a
     animação e remontar a cada passagem zerava a carga do mapa */
  const [entrou, setEntrou] = React.useState(false);
  React.useEffect(() => { if (nivel !== "terra" && nivel !== "lua") setEntrou(true); }, [nivel]);
  /* [AC] A cartografia real (MapLibre) manda do Brasil até a cidade. No BAIRRO o
     globo volta a mandar: ali ele já desenha as ruas reais e é sobre ele que a
     rede de pinos giratórios e os fios são ancorados. A faixa de cartões fica
     visível em todos os níveis — é ela que navega. */
  const noMapa = !semMapa && entrou && nivel !== "bairro" && !!window.ReinoMapa;
  React.useEffect(() => {
    const el = ref.current;
    if (el) el.classList.toggle("is-com-mapa", noMapa);
  }, [noMapa]);
  const voltarAoGlobo = () => { setSemMapa(true); setEntrou(false); const api = apiRef.current; api && api.irTerra(); };
  return (
    <>
      <div ref={ref} className="hg-encher" />
      {noMapa && hostMapa ? ReactDOM.createPortal(
        <window.ReinoMapa uf={lugar.uf} cidade={lugar.cidade} bairro={lugar.bairro} onVoltar={voltarAoGlobo} />, hostMapa) : null}
      {host && nivel === "bairro" && posicoes && nos.length ? ReactDOM.createPortal(
        <NetworkMap overlay
          nodes={nos.map((n) => ({ id: n.id, nome: n.empresa, nicho: n.titulo, cidade: n.cidade, estado: n.uf, foto: n.foto, eu: n.ehEu }))}
          links={fios} selected={foco} onSelect={setFoco} positions={posicoes} />, host) : null}
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
