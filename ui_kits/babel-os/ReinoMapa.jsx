/* Cartografia do Reino — mapa próprio, desenhado aqui.
   Dados de rua: OpenStreetMap (livres). Estilo, camadas e cores: nossos.
   Cards das empresas: Google Places. Rota: OSRM. Nenhuma chave de mapa de fornecedor. */
(() => {
const { EmptyState } = window.BabelOSDesignSystem_5ad360;
const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
const OSM_TILES = "https://tiles.openfreemap.org/planet";
const OSM_FONTS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const GOOGLE = () => window.REINO_GOOGLE || "";

/* paleta do Reino — noite profunda, ruas em ouro */
const C = { fundo: "#070c16", agua: "#0b1a2e", verde: "#0d1b17", parque: "#102420", predio: "#111c2e", predioBorda: "#1b2740",
  ruaMaior: "#c79a3c", ruaMedia: "#8d6f2e", ruaMenor: "#3d3a2c", trilha: "#2a2a24", ferro: "#2b3347",
  limite: "#2d3d57", texto: "#e8dcc0", textoHalo: "#060a12", aguaTexto: "#5d86ad" };
const COR = { empresas: "#5ad8ff", rede: "#b98bff", cliques: "#ffd34d", cadastros: "#63f2a5", eventos: "#ff7ba9", google: "#ffb35c" };
const ROTULO = { empresas: "Empresas do Reino", rede: "Minha rede", cliques: "Cliques no link", cadastros: "Cadastros", eventos: "Eventos", google: "Google Maps", territorios: "Territórios", calor: "Calor" };
const CURTO = { empresas: "Reino", rede: "Rede", cliques: "Cliques", cadastros: "Cadastros", eventos: "Eventos", google: "Google", territorios: "Territórios", calor: "Calor" };
const TITULOS = ["Imperador", "Rei", "Príncipe", "Duque", "Marquês", "Conde", "Visconde", "Barão"];
const CORTITULO = ["#ffd97a", "#ffb35c", "#ff8f6b", "#e07bd8", "#a98bff", "#6f9dff", "#4fc9d8", "#5fd8a4"];
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/* estilo do Reino, escrito camada por camada sobre o esquema OpenMapTiles */
function estiloReino() {
  const f = ["Noto Sans Regular"], fb = ["Noto Sans Bold"];
  return {
    version: 8, glyphs: OSM_FONTS,
    sources: { osm: { type: "vector", url: OSM_TILES } },
    layers: [
      { id: "fundo", type: "background", paint: { "background-color": C.fundo } },
      { id: "terra-verde", type: "fill", source: "osm", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "scrub"]]], paint: { "fill-color": C.verde, "fill-opacity": 0.55 } },
      { id: "parque", type: "fill", source: "osm", "source-layer": "park", paint: { "fill-color": C.parque, "fill-opacity": 0.6 } },
      { id: "agua", type: "fill", source: "osm", "source-layer": "water", paint: { "fill-color": C.agua } },
      { id: "predios", type: "fill", source: "osm", "source-layer": "building", minzoom: 14,
        paint: { "fill-color": C.predio, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, 0.75], "fill-outline-color": "#1b2740" } },
      { id: "trilhas", type: "line", source: "osm", "source-layer": "transportation", minzoom: 14,
        filter: ["in", ["get", "class"], ["literal", ["path", "track", "service"]]],
        paint: { "line-color": C.trilha, "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 19, 3] } },
      { id: "ferrovia", type: "line", source: "osm", "source-layer": "transportation", filter: ["==", ["get", "class"], "rail"],
        paint: { "line-color": C.ferro, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 18, 2.4], "line-dasharray": [3, 2] } },
      { id: "rua-menor", type: "line", source: "osm", "source-layer": "transportation", minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["minor", "residential", "living_street"]]],
        paint: { "line-color": C.ruaMenor, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 12, 0.4, 16, 2.4, 19, 9] } },
      { id: "rua-media", type: "line", source: "osm", "source-layer": "transportation", minzoom: 8,
        filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
        paint: { "line-color": C.ruaMedia, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 8, 0.5, 13, 2, 19, 13], "line-opacity": 0.9 } },
      { id: "rua-maior-brilho", type: "line", source: "osm", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
        paint: { "line-color": C.ruaMaior, "line-blur": 3, "line-opacity": 0.28, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 2, 12, 8, 19, 30] } },
      { id: "rua-maior", type: "line", source: "osm", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
        paint: { "line-color": C.ruaMaior, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 0.6, 12, 2.6, 19, 15] } },
      { id: "limite-estado", type: "line", source: "osm", "source-layer": "boundary", filter: ["<=", ["get", "admin_level"], 4],
        paint: { "line-color": C.limite, "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 10, 1.6], "line-dasharray": [4, 2] } },
      { id: "nome-rua", type: "symbol", source: "osm", "source-layer": "transportation_name", minzoom: 14,
        layout: { "text-field": ["get", "name"], "text-font": f, "text-size": 11, "symbol-placement": "line" },
        paint: { "text-color": "#b9a678", "text-halo-color": C.textoHalo, "text-halo-width": 1.4 } },
      { id: "nome-agua", type: "symbol", source: "osm", "source-layer": "water_name",
        layout: { "text-field": ["get", "name"], "text-font": f, "text-size": 11, "text-letter-spacing": 0.14 },
        paint: { "text-color": C.aguaTexto, "text-halo-color": C.textoHalo, "text-halo-width": 1.2 } },
      { id: "nome-bairro", type: "symbol", source: "osm", "source-layer": "place", minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["suburb", "neighbourhood", "quarter"]]],
        layout: { "text-field": ["get", "name"], "text-font": f, "text-size": 11.5, "text-letter-spacing": 0.2, "text-transform": "uppercase" },
        paint: { "text-color": "#9fb4cf", "text-halo-color": C.textoHalo, "text-halo-width": 1.4 } },
      { id: "nome-cidade", type: "symbol", source: "osm", "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        layout: { "text-field": ["get", "name"], "text-font": fb, "text-size": ["interpolate", ["linear"], ["zoom"], 4, 11, 10, 15, 14, 18] },
        paint: { "text-color": C.texto, "text-halo-color": C.textoHalo, "text-halo-width": 1.8 } },
      { id: "nome-estado", type: "symbol", source: "osm", "source-layer": "place", maxzoom: 7,
        filter: ["==", ["get", "class"], "state"],
        layout: { "text-field": ["get", "name"], "text-font": fb, "text-size": 12, "text-letter-spacing": 0.24, "text-transform": "uppercase" },
        paint: { "text-color": "#8d7a4e", "text-halo-color": C.textoHalo, "text-halo-width": 1.6 } },
    ],
  };
}

let carregando = null;
function carregarMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (carregando) return carregando;
  carregando = new Promise((ok, falha) => {
    if (!document.querySelector("link[data-maplibre]")) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = MAPLIBRE_CSS; l.dataset.maplibre = "1"; document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = MAPLIBRE_JS; s.onload = () => ok(window.maplibregl); s.onerror = () => falha(new Error("Não foi possível carregar o desenhista do mapa."));
    document.head.appendChild(s);
  });
  return carregando;
}

let idxCidades = null;
function cidadesIndex() {
  if (idxCidades) return idxCidades;
  idxCidades = new Map();
  try { (window.BabelDemo("reino/mapa", {}).cidades || []).forEach((c) => idxCidades.set(norm(c.nome) + "|" + c.uf, c)); } catch (e) {}
  return idxCidades;
}
const acharCidade = (nome, uf) => {
  const i = cidadesIndex();
  if (uf) { const d = i.get(norm(nome) + "|" + String(uf).toUpperCase()); if (d) return d; }
  for (const [k, v] of i) if (k.startsWith(norm(nome) + "|")) return v;
  return null;
};
const fc = (feats) => ({ type: "FeatureCollection", features: feats });
const ponto = (c, props) => ({ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] }, properties: props });
const espalhar = (c, i) => ({ lng: c.lng + Math.cos(i * 2.4) * 0.012 * (1 + (i % 3)), lat: c.lat + Math.sin(i * 2.4) * 0.012 * (1 + (i % 3)) });

function camadaEmpresas(uf) {
  try {
    const m = window.BabelDemo("reino/mapa", uf ? { estado: uf } : {});
    return fc((m.cidades || []).filter((c) => c.empresas > 0).map((c) => ponto(c, { camada: "empresas", nome: c.nome, sub: c.uf + " · " + c.empresas + " empresa(s)", peso: c.empresas })));
  } catch (e) { return fc([]); }
}
function camadaRede() {
  const nos = (window.BABEL_DEMO && window.BABEL_DEMO.rede && window.BABEL_DEMO.rede.nos) || [];
  return fc(nos.map((n, i) => {
    const c = acharCidade(n.cidade, n.estado); if (!c) return null;
    return ponto(espalhar(c, i), { camada: "rede", nome: n.nome, sub: (n.nicho || "") + " · " + n.cidade + "/" + (n.estado || ""), peso: 3 });
  }).filter(Boolean));
}
function camadaEventos() {
  const evs = (window.BABEL_DEMO && window.BABEL_DEMO.eventos) || [];
  return fc(evs.map((e, i) => {
    const [cid, ufe] = String(e.local || "").split("·").map((s) => s.trim());
    const c = acharCidade(cid, ufe); if (!c) return null;
    return ponto(espalhar(c, i + 7), { camada: "eventos", nome: e.nome, sub: e.data + " · " + e.local + " · " + (e.vagas || ""), peso: 4 });
  }).filter(Boolean));
}
async function camadasBanco() {
  const cfg = window.REINO_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anon) return { cliques: fc([]), cadastros: fc([]) };
  const base = cfg.url.replace(/\/$/, "") + "/rest/v1/";
  const cab = { apikey: cfg.anon, Authorization: "Bearer " + cfg.anon };
  const pega = (q) => fetch(base + q, { headers: cab }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const [cl, cd] = await Promise.all([
    pega("cliques?select=codigo,cidade,uf,cadastrou,criado_em&order=criado_em.desc&limit=500"),
    pega("cadastros?select=nome,titulo,cidade,uf,codigo,criado_em&order=criado_em.desc&limit=500"),
  ]);
  const monta = (linhas, camada, texto) => fc((linhas || []).map((l, i) => {
    const c = acharCidade(l.cidade, l.uf); if (!c) return null;
    return ponto(espalhar(c, i + 13), { camada, nome: texto(l), sub: (l.cidade || "") + (l.uf ? "/" + l.uf : "") + " · " + new Date(l.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }), peso: 2 });
  }).filter(Boolean));
  return {
    cliques: monta(cl, "cliques", (l) => "Clique em " + (l.codigo || "direto")),
    cadastros: monta(cd, "cadastros", (l) => (l.nome || "Cadastro") + (l.titulo ? " · " + l.titulo : "")),
  };
}
function camadaTerritorios(uf) {
  const emb = uf && window.REINO_MUNICIPIOS && window.REINO_MUNICIPIOS[uf];
  if (!emb) return fc([]);
  return fc(emb.cidades.map((m, i) => {
    const aneis = (m.g || []).map((plano) => { const anel = []; for (let k = 0; k < plano.length; k += 2) anel.push([plano[k], plano[k + 1]]); if (anel.length > 2) anel.push(anel[0]); return anel; }).filter((a) => a.length > 3);
    if (!aneis.length) return null;
    const t = i % TITULOS.length;
    return { type: "Feature", geometry: { type: "Polygon", coordinates: aneis }, properties: { camada: "territorios", nome: m.nome, sub: "Território de " + TITULOS[t], cor: CORTITULO[t], titulo: TITULOS[t] } };
  }).filter(Boolean));
}
function empresasDaCidade(nome, uf) {
  try {
    const lst = window.BabelDemo("reino/empresas", { cidade: nome, estado: uf, limite: 60 });
    return (Array.isArray(lst) ? lst : lst && lst.itens ? lst.itens : []).slice(0, 60);
  } catch (e) { return []; }
}

/* ---- Google Places: empresas de verdade no raio do mapa ---- */
const CAMPOS = ["places.id", "places.displayName", "places.primaryTypeDisplayName", "places.formattedAddress", "places.location",
  "places.rating", "places.userRatingCount", "places.nationalPhoneNumber", "places.websiteUri",
  "places.currentOpeningHours.openNow", "places.currentOpeningHours.weekdayDescriptions", "places.priceLevel", "places.photos"].join(",");
const PRECO = { PRICE_LEVEL_FREE: "grátis", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
/* o Google responde em inglês e com o número do projeto; aqui vira uma frase curta */
function emPortugues(err) {
  const m = String((err && err.message) || ""), s = (err && err.status) || "";
  const det = JSON.stringify((err && err.details) || []);
  if (/SERVICE_DISABLED/.test(det) || /has not been used in project|is disabled|not activated|SERVICE_DISABLED/i.test(m))
    return "Falta ativar a Places API (New) no seu projeto do Google Cloud.";
  if (/API key not valid|referer|API_KEY/i.test(m)) return "O Google recusou a chave. Verifique as restrições de site e de API.";
  if (s === "PERMISSION_DENIED") return "O Google negou o acesso. Confira se a Places API está ativada e com faturamento.";
  if (/billing/i.test(m)) return "Falta ativar o faturamento no projeto do Google Cloud.";
  if (s === "RESOURCE_EXHAUSTED" || /quota/i.test(m)) return "A cota do Google terminou por hoje.";
  if (s === "INVALID_ARGUMENT") return "A busca não foi aceita pelo Google.";
  return "Não foi possível consultar o Google agora.";
}

async function buscarGoogle({ lat, lng, raio = 1200, texto = "" }) {
  const k = GOOGLE(); if (!k) throw new Error("Sem chave do Google configurada.");
  const url = "https://places.googleapis.com/v1/places:" + (texto ? "searchText" : "searchNearby");
  const corpo = texto
    ? { textQuery: texto, languageCode: "pt-BR", maxResultCount: 20, locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: raio } } }
    : { languageCode: "pt-BR", maxResultCount: 20, rankPreference: "POPULARITY", locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(raio, 50000) } } };
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": k, "X-Goog-FieldMask": CAMPOS }, body: JSON.stringify(corpo) });
  const j = await r.json();
  if (j.error) throw new Error(emPortugues(j.error));
  return (j.places || []).map((p) => ({
    id: p.id, nome: (p.displayName && p.displayName.text) || "sem nome",
    categoria: (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || "",
    endereco: p.formattedAddress || "", lat: p.location && p.location.latitude, lng: p.location && p.location.longitude,
    nota: p.rating, avaliacoes: p.userRatingCount, telefone: p.nationalPhoneNumber || "", site: p.websiteUri || "",
    aberto: p.currentOpeningHours ? p.currentOpeningHours.openNow : undefined,
    horarios: (p.currentOpeningHours && p.currentOpeningHours.weekdayDescriptions) || null,
    preco: PRECO[p.priceLevel] || "", foto: p.photos && p.photos[0] ? p.photos[0].name : null,
  }));
}
const fotoUrl = (nome, h = 160) => "https://places.googleapis.com/v1/" + nome + "/media?maxHeightPx=" + h + "&key=" + GOOGLE();

function dentro(pt, poli) {
  let d = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

function ReinoMapa({ uf, cidade, bairro, onVoltar }) {
  const caixa = React.useRef(null);
  const mapa = React.useRef(null);
  const [pronto, setPronto] = React.useState(false);
  const [falha, setFalha] = React.useState(null);
  const [ligadas, setLigadas] = React.useState({ empresas: true, rede: true, cliques: true, cadastros: true, eventos: true, google: true, territorios: false, calor: false });
  const [sel, setSel] = React.useState(null);
  const [busca, setBusca] = React.useState("");
  const [achados, setAchados] = React.useState(null);
  const [modo, setModo] = React.useState(null);
  const [rota, setRota] = React.useState([]);
  const [area, setArea] = React.useState([]);
  const [dentroArea, setDentroArea] = React.useState(null);
  const [cartoes, setCartoes] = React.useState(null);
  const [lendoGoogle, setLendoGoogle] = React.useState(false);
  const [avisoGoogle, setAvisoGoogle] = React.useState(null);
  const dadosRef = React.useRef({});
  const ultBusca = React.useRef("");

  React.useEffect(() => {
    let morto = false;
    carregarMapLibre().then((ml) => {
      if (morto || !caixa.current) return;
      /* estado: enquadra pelo conjunto dos municípios, não por um deles */
      const caixaEstado = (() => {
        if (!uf) return null;
        let x1 = 180, y1 = 90, x2 = -180, y2 = -90, n = 0;
        for (const [k, c] of cidadesIndex()) {
          if (!k.endsWith("|" + String(uf).toUpperCase())) continue;
          n++; if (c.lng < x1) x1 = c.lng; if (c.lng > x2) x2 = c.lng; if (c.lat < y1) y1 = c.lat; if (c.lat > y2) y2 = c.lat;
        }
        return n > 1 ? [[x1, y1], [x2, y2]] : null;
      })();
      const centro = (() => {
        if (cidade) { const c = acharCidade(cidade, uf); if (c) return [c.lng, c.lat]; }
        if (caixaEstado) return [(caixaEstado[0][0] + caixaEstado[1][0]) / 2, (caixaEstado[0][1] + caixaEstado[1][1]) / 2];
        return [-47.9, -15.8];
      })();
      const m = new ml.Map({ container: caixa.current, style: estiloReino(), center: centro,
        zoom: bairro ? 15.4 : cidade ? 11.6 : uf ? 6.4 : 4.1, minZoom: 3, maxZoom: 19, attributionControl: false,
        /* fora da tela cheia do mapa, a roda e o dedo rolam a página; zoom pede Ctrl/⌘ + roda ou dois dedos */
        cooperativeGestures: !document.body.classList.contains("is-imersivo"),
        locale: { "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + roda do mouse para dar zoom no mapa", "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + roda do mouse para dar zoom no mapa", "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa" } });
      m.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
      m.addControl(new ml.AttributionControl({ compact: true, customAttribution: "Cartografia do Reino" }), "bottom-left");
      m.on("error", () => {});
      const aoPronto = () => { if (!morto && !mapa.current) { mapa.current = m; setPronto(true); } };
      m.on("load", () => { if (caixaEstado && !cidade && !bairro) m.fitBounds(caixaEstado, { padding: 48, duration: 0 }); aoPronto(); });
      m.on("idle", aoPronto);
      setTimeout(aoPronto, 6000);
    }).catch((e) => setFalha(e.message));
    return () => { morto = true; if (mapa.current) { mapa.current.remove(); mapa.current = null; } };
  }, []);

  React.useEffect(() => {
    if (!pronto) return;
    const m = mapa.current;
    const dados = { empresas: camadaEmpresas(uf), rede: camadaRede(), eventos: camadaEventos(), territorios: camadaTerritorios(uf), cliques: fc([]), cadastros: fc([]), google: fc([]) };
    dadosRef.current = dados;
    if (!m.getSource("territorios")) {
      m.addSource("territorios", { type: "geojson", data: dados.territorios });
      m.addLayer({ id: "territorios-fill", type: "fill", source: "territorios", paint: { "fill-color": ["get", "cor"], "fill-opacity": 0.16 } });
      m.addLayer({ id: "territorios-linha", type: "line", source: "territorios", paint: { "line-color": ["get", "cor"], "line-width": 0.8, "line-opacity": 0.55 } });
    }
    ["empresas", "rede", "cliques", "cadastros", "eventos", "google"].forEach((c) => {
      if (m.getSource(c)) return;
      m.addSource(c, { type: "geojson", data: dados[c], cluster: true, clusterRadius: 44, clusterMaxZoom: 12 });
      m.addLayer({ id: c + "-cluster", type: "circle", source: c, filter: ["has", "point_count"],
        paint: { "circle-color": COR[c], "circle-opacity": 0.28, "circle-stroke-color": COR[c], "circle-stroke-width": 1.4,
          "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 13, 40, 24, 400, 38] } });
      m.addLayer({ id: c + "-num", type: "symbol", source: c, filter: ["has", "point_count"],
        layout: { "text-field": ["to-string", ["get", "point_count"]], "text-size": 11, "text-font": ["Noto Sans Bold"] }, paint: { "text-color": "#fff" } });
      m.addLayer({ id: c + "-pt", type: "circle", source: c, filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": COR[c], "circle-radius": ["interpolate", ["linear"], ["coalesce", ["get", "peso"], 2], 1, 4.5, 20, 11], "circle-stroke-color": "rgba(0,0,0,.55)", "circle-stroke-width": 1 } });
    });
    if (!m.getSource("calor")) {
      m.addSource("calor", { type: "geojson", data: fc([]) });
      m.addLayer({ id: "calor-camada", type: "heatmap", source: "calor",
        paint: { "heatmap-weight": ["interpolate", ["linear"], ["coalesce", ["get", "peso"], 1], 0, 0.15, 20, 1], "heatmap-intensity": 0.9, "heatmap-radius": 34, "heatmap-opacity": 0.7 } }, "territorios-fill");
      m.addSource("rota", { type: "geojson", data: fc([]) });
      m.addLayer({ id: "rota-linha", type: "line", source: "rota", paint: { "line-color": "#63f2a5", "line-width": 4, "line-opacity": 0.9 } });
      m.addSource("area", { type: "geojson", data: fc([]) });
      m.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": "#5ad8ff", "fill-opacity": 0.14 } });
      m.addLayer({ id: "area-linha", type: "line", source: "area", paint: { "line-color": "#5ad8ff", "line-width": 2, "line-dasharray": [2, 1.5] } });
    }
    camadasBanco().then((b) => {
      if (!mapa.current) return;
      dadosRef.current = { ...dadosRef.current, ...b };
      ["cliques", "cadastros"].forEach((c) => m.getSource(c) && m.getSource(c).setData(b[c]));
      atualizarCalor();
    });
    atualizarCalor();
  }, [pronto, uf, cidade]);

  const atualizarCalor = React.useCallback(() => {
    const m = mapa.current; if (!m || !m.getSource("calor")) return;
    const d = dadosRef.current;
    m.getSource("calor").setData(fc(["empresas", "rede", "cliques", "cadastros", "eventos", "google"].flatMap((c) => (d[c] ? d[c].features : []))));
  }, []);

  /* Google Places: no nível de bairro, automático */
  const chamarGoogle = React.useCallback(async (texto) => {
    const m = mapa.current; if (!m) return;
    const c = m.getCenter(), z = m.getZoom();
    const raio = Math.max(400, Math.min(20000, 40000 / Math.pow(1.7, z - 11)));
    setLendoGoogle(true); setAvisoGoogle(null);
    try {
      const lst = await buscarGoogle({ lat: c.lat, lng: c.lng, raio, texto });
      if (!mapa.current) return;
      const feats = lst.filter((p) => p.lat != null).map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { camada: "google", nome: p.nome, sub: [p.categoria, p.endereco].filter(Boolean).join(" · "), peso: 3, dados: JSON.stringify(p) } }));
      dadosRef.current = { ...dadosRef.current, google: fc(feats) };
      m.getSource("google") && m.getSource("google").setData(fc(feats));
      atualizarCalor();
      setCartoes({ titulo: texto || "Empresas por aqui", origem: "google", lista: lst });
      if (!lst.length) setAvisoGoogle("Nada encontrado neste raio.");
    } catch (e) { setAvisoGoogle(e.message); setCartoes(null); }
    finally { setLendoGoogle(false); }
  }, [atualizarCalor]);

  React.useEffect(() => {
    if (!pronto || !bairro || !GOOGLE()) return;
    const chave = uf + "|" + cidade + "|" + bairro;
    if (ultBusca.current === chave) return;
    ultBusca.current = chave;
    chamarGoogle("");
  }, [pronto, bairro, cidade, uf, chamarGoogle]);

  React.useEffect(() => {
    const m = mapa.current; if (!pronto || !m) return;
    const ver = (id, v) => m.getLayer(id) && m.setLayoutProperty(id, "visibility", v ? "visible" : "none");
    ["empresas", "rede", "cliques", "cadastros", "eventos", "google"].forEach((c) => { ver(c + "-cluster", ligadas[c]); ver(c + "-num", ligadas[c]); ver(c + "-pt", ligadas[c]); });
    ver("territorios-fill", ligadas.territorios); ver("territorios-linha", ligadas.territorios); ver("calor-camada", ligadas.calor);
  }, [ligadas, pronto]);

  React.useEffect(() => {
    const m = mapa.current; if (!pronto || !m) return;
    const clique = (e) => {
      if (modo === "rota") { setRota((r) => (r.length >= 2 ? [[e.lngLat.lng, e.lngLat.lat]] : [...r, [e.lngLat.lng, e.lngLat.lat]])); return; }
      if (modo === "area") { setArea((a) => [...a, [e.lngLat.lng, e.lngLat.lat]]); return; }
      const camadas = ["google-pt", "empresas-pt", "rede-pt", "cliques-pt", "cadastros-pt", "eventos-pt", "territorios-fill"].filter((c) => m.getLayer(c));
      const f = m.queryRenderedFeatures(e.point, { layers: camadas })[0];
      if (f) {
        setSel({ ...f.properties });
        if (f.properties.camada === "google" && f.properties.dados) {
          try { setCartoes({ titulo: f.properties.nome, origem: "google", lista: [JSON.parse(f.properties.dados)] }); } catch (err) {}
        } else if (f.properties.camada === "empresas" && f.properties.nome) {
          const u = String(f.properties.sub || "").split(" · ")[0];
          setCartoes({ titulo: f.properties.nome + (u ? " · " + u : ""), origem: "reino", lista: empresasDaCidade(f.properties.nome, u) });
        } else setCartoes(null);
      } else {
        const cl = m.queryRenderedFeatures(e.point, { layers: camadas.map((c) => c.replace("-pt", "-cluster")).filter((c) => m.getLayer(c)) })[0];
        if (cl) m.easeTo({ center: cl.geometry.coordinates, zoom: Math.min(m.getZoom() + 2.2, 16) });
        else { setSel(null); setCartoes(null); }
      }
    };
    m.on("click", clique);
    return () => m.off("click", clique);
  }, [pronto, modo]);

  /* rota pelo OSRM — livre, sem chave */
  React.useEffect(() => {
    const m = mapa.current; if (!pronto || !m || !m.getSource("rota")) return;
    if (rota.length < 2) { m.getSource("rota").setData(fc(rota.length ? [{ type: "Feature", geometry: { type: "Point", coordinates: rota[0] }, properties: {} }] : [])); return; }
    const p = rota.map(([lng, lat]) => lng.toFixed(5) + "," + lat.toFixed(5)).join(";");
    fetch("https://router.project-osrm.org/route/v1/driving/" + p + "?overview=full&geometries=geojson")
      .then((r) => r.json())
      .then((j) => {
        const rt = j && j.routes && j.routes[0]; if (!rt || !mapa.current) return;
        m.getSource("rota").setData(fc([{ type: "Feature", geometry: rt.geometry, properties: {} }]));
        setSel({ nome: "Rota traçada", sub: (rt.distance / 1000).toFixed(1) + " km · " + Math.round(rt.duration / 60) + " min", camada: "rota" });
      }).catch(() => setSel({ nome: "Rota", sub: "Não foi possível calcular agora.", camada: "rota" }));
  }, [rota, pronto]);

  React.useEffect(() => {
    const m = mapa.current; if (!pronto || !m || !m.getSource("area")) return;
    if (area.length < 3) { m.getSource("area").setData(fc([])); setDentroArea(null); return; }
    const anel = [...area, area[0]];
    m.getSource("area").setData(fc([{ type: "Feature", geometry: { type: "Polygon", coordinates: [anel] }, properties: {} }]));
    const d = dadosRef.current, conta = {};
    ["empresas", "rede", "cliques", "cadastros", "eventos", "google"].forEach((c) => { conta[c] = (d[c] ? d[c].features : []).filter((f) => dentro(f.geometry.coordinates, anel)).length; });
    setDentroArea(conta);
  }, [area, pronto]);

  /* busca de endereço pelo Nominatim do OpenStreetMap — sem chave, como o resto do mapa */
  const buscar = async (e) => {
    e.preventDefault();
    const t = busca.trim(); if (!t) return;
    setAchados([]);
    try {
      const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&accept-language=pt-BR&limit=6&q=" + encodeURIComponent(t), { headers: { Accept: "application/json" } });
      const j = await r.json();
      setAchados((Array.isArray(j) ? j : []).map((x) => ({ nome: x.display_name.split(",").slice(0, 3).join(","), sub: x.display_name, pos: [parseFloat(x.lon), parseFloat(x.lat)] })));
    } catch (err) { setAchados([]); }
  };
  const irPara = (a) => { setAchados(null); setBusca(a.nome); mapa.current && mapa.current.easeTo({ center: a.pos, zoom: 15 }); };

  const chip = (k, cor) => (
    <button key={k} type="button" onClick={() => setLigadas((v) => ({ ...v, [k]: !v[k] }))}
      style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", padding: ".28rem .6rem", borderRadius: 999, fontSize: ".74rem", cursor: "pointer",
        whiteSpace: "nowrap", lineHeight: 1.1,
        border: "1px solid " + (ligadas[k] ? cor : "rgba(255,255,255,.16)"), background: ligadas[k] ? "rgba(255,255,255,.1)" : "transparent",
        color: ligadas[k] ? "#eaf3ff" : "rgba(234,243,255,.55)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: cor, opacity: ligadas[k] ? 1 : .4 }} />{CURTO[k] || ROTULO[k]}
    </button>
  );
  const botao = (ativo, ao, texto) => (
    <button type="button" onClick={ao} style={{ padding: ".3rem .65rem", borderRadius: 8, fontSize: ".74rem", cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1.1,
      border: "1px solid " + (ativo ? "#c79a3c" : "rgba(255,255,255,.18)"), background: ativo ? "rgba(199,154,60,.2)" : "rgba(8,14,26,.6)", color: "#eaf3ff" }}>{texto}</button>
  );

  /* a barra do mapa desce para baixo do cabeçalho do app, quando existe um */
  const [topoLivre, setTopoLivre] = React.useState(".7rem");
  React.useEffect(() => {
    const medir = () => {
      const cx = caixa.current; if (!cx) return;
      const cab = document.querySelector(".hg-topbar, header.hg-top, .hg-top");
      if (!cab) return setTopoLivre(".7rem");
      const rc = cx.getBoundingClientRect(), rb = cab.getBoundingClientRect();
      const sobra = rb.bottom - rc.top;
      setTopoLivre(sobra > 4 ? Math.round(sobra + 10) + "px" : ".7rem");
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [pronto]);

  if (falha) return <EmptyState icon="alerta" title="Mapa indisponível" description={falha} />;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div ref={caixa} style={{ position: "absolute", inset: 0 }} />

      <div style={{ position: "absolute", top: topoLivre, left: ".7rem", right: ".7rem", display: "flex", flexWrap: "wrap", gap: ".45rem", alignItems: "flex-start", pointerEvents: "none" }}>
        <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", pointerEvents: "auto" }}>
          {onVoltar ? botao(false, onVoltar, "← Globo") : null}
          {botao(false, () => chamarGoogle(""), lendoGoogle ? "Buscando…" : "Buscar empresas aqui")}
        </div>
        <form onSubmit={buscar} style={{ display: "flex", gap: ".3rem", pointerEvents: "auto", flex: "1 1 200px", maxWidth: 340, position: "relative" }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Endereço, cidade ou o que procura" aria-label="Buscar no mapa"
            style={{ flex: 1, minWidth: 0, padding: ".35rem .6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,.18)", background: "rgba(7,12,22,.85)", color: "#eaf3ff", fontSize: ".78rem" }} />
          {botao(false, () => chamarGoogle(busca.trim()), "Empresas")}
          {achados ? (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: ".25rem", listStyle: "none", padding: ".25rem", borderRadius: 10, background: "rgba(7,12,22,.97)", border: "1px solid rgba(255,255,255,.14)", maxHeight: 210, overflowY: "auto" }}>
              {!achados.length ? <li style={{ padding: ".4rem .5rem", fontSize: ".76rem", opacity: .6 }}>Nada encontrado.</li> : achados.map((a, i) => (
                <li key={i}><button type="button" onClick={() => irPara(a)} style={{ display: "block", width: "100%", textAlign: "left", padding: ".35rem .5rem", borderRadius: 7, border: 0, background: "transparent", color: "#eaf3ff", fontSize: ".76rem", cursor: "pointer" }}>{a.nome}</button></li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>

      {avisoGoogle && !achados ? (
        <div style={{ position: "absolute", top: "calc(" + topoLivre + " + 2.5rem)", left: ".7rem", padding: ".4rem .65rem", borderRadius: 9, background: "rgba(7,12,22,.94)", border: "1px solid rgba(255,179,92,.4)", color: "#ffd9a8", fontSize: ".75rem", maxWidth: 300 }}>{avisoGoogle}</div>
      ) : null}

      <div style={{ position: "absolute", bottom: "3.1rem", left: ".7rem", display: "flex", flexDirection: "column", gap: ".4rem", alignItems: "flex-start", maxWidth: "min(430px, calc(100% - 1.4rem))" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem" }}>
          {["google", "empresas", "rede", "cliques", "cadastros", "eventos"].map((k) => chip(k, COR[k]))}
          {chip("territorios", "#ffd97a")}{chip("calor", "#ff7ba9")}
        </div>
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
          {botao(modo === "rota", () => { setModo(modo === "rota" ? null : "rota"); setRota([]); }, modo === "rota" ? "Rota: toque 2 pontos" : "Traçar rota")}
          {botao(modo === "area", () => { setModo(modo === "area" ? null : "area"); setArea([]); }, modo === "area" ? "Área: toque os cantos" : "Desenhar área")}
          {rota.length || area.length ? botao(false, () => { setRota([]); setArea([]); setDentroArea(null); setModo(null); }, "Limpar") : null}
        </div>
      </div>

      {dentroArea ? (
        <div style={{ position: "absolute", top: "calc(" + topoLivre + " + 2.7rem)", right: cartoes ? "calc(min(340px, 100% - 1.4rem) + 1.1rem)" : ".7rem", padding: ".6rem .75rem", borderRadius: 12, background: "rgba(7,12,22,.94)", border: "1px solid rgba(90,216,255,.35)", fontSize: ".78rem", color: "#eaf3ff", minWidth: 190 }}>
          <strong style={{ display: "block", marginBottom: ".3rem" }}>Dentro da área</strong>
          {Object.entries(dentroArea).map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", opacity: v ? 1 : .5 }}><span>{ROTULO[k]}</span><b>{v}</b></div>)}
        </div>
      ) : null}

      {cartoes ? (
        <div style={{ position: "absolute", top: "calc(" + topoLivre + " + 2.7rem)", right: ".7rem", bottom: "7.4rem", width: "min(340px, calc(100% - 1.4rem))", display: "flex", flexDirection: "column", borderRadius: 14, background: "rgba(7,12,22,.95)", border: "1px solid rgba(199,154,60,.35)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: ".5rem", padding: ".65rem .8rem", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
            <div>
              <span style={{ display: "block", fontSize: ".64rem", textTransform: "uppercase", letterSpacing: ".08em", color: cartoes.origem === "google" ? COR.google : COR.empresas }}>{cartoes.origem === "google" ? "Google Maps" : "Empresas do Reino"}</span>
              <strong style={{ fontSize: ".92rem", color: "#eaf3ff" }}>{cartoes.titulo}</strong>
              <span style={{ display: "block", fontSize: ".7rem", color: "rgba(234,243,255,.5)" }}>{cartoes.lista.length} resultado(s)</span>
            </div>
            <button type="button" onClick={() => setCartoes(null)} aria-label="Fechar" style={{ border: 0, background: "transparent", color: "rgba(234,243,255,.6)", cursor: "pointer", fontSize: ".9rem" }}>✕</button>
          </div>
          <div style={{ overflowY: "auto", padding: ".55rem", display: "grid", gap: ".5rem" }}>
            {!cartoes.lista.length ? <p style={{ color: "rgba(234,243,255,.6)", fontSize: ".8rem", padding: ".5rem" }}>Nenhuma empresa aqui.</p> : cartoes.lista.map((e, i) => (
              <article key={e.id || e.nome + i} style={{ borderRadius: 11, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", overflow: "hidden" }}>
                {e.foto ? <img src={fotoUrl(e.foto)} alt="" loading="lazy" style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} /> : null}
                <div style={{ padding: ".55rem .65rem" }}>
                  <strong style={{ display: "block", fontSize: ".85rem", color: "#eaf3ff", lineHeight: 1.25 }}>{e.nome}</strong>
                  <span style={{ display: "block", fontSize: ".72rem", color: "rgba(234,243,255,.6)", marginTop: ".1rem" }}>{[e.categoria || e.nicho, e.preco, e.abrangencia].filter(Boolean).join(" · ")}</span>
                  {e.endereco ? <span style={{ display: "block", fontSize: ".72rem", color: "rgba(234,243,255,.52)", marginTop: ".2rem" }}>{e.endereco}</span> : null}
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: ".5rem", marginTop: ".35rem", fontSize: ".72rem" }}>
                    {e.nota != null ? <b style={{ color: "#ffd97a" }}>★ {e.nota}</b> : null}
                    {e.avaliacoes ? <span style={{ color: "rgba(234,243,255,.5)" }}>{e.avaliacoes} avaliações</span> : null}
                    {e.aberto === true ? <span style={{ color: "#63f2a5" }}>Aberto agora</span> : e.aberto === false ? <span style={{ color: "#ff8f8f" }}>Fechado</span> : null}
                    {e.listada ? <span style={{ color: "#63f2a5" }}>B3</span> : null}
                  </div>
                  {e.horarios ? <details style={{ marginTop: ".3rem" }}><summary style={{ fontSize: ".72rem", color: "rgba(234,243,255,.55)", cursor: "pointer" }}>Horários</summary>
                    <ul style={{ listStyle: "none", padding: ".25rem 0 0", margin: 0, fontSize: ".7rem", color: "rgba(234,243,255,.6)", display: "grid", gap: ".1rem" }}>{e.horarios.map((h, k) => <li key={k}>{h}</li>)}</ul></details> : null}
                  {e.telefone || e.site ? (
                    <div style={{ display: "flex", gap: ".45rem", marginTop: ".4rem", flexWrap: "wrap" }}>
                      {e.telefone ? <a href={"tel:" + e.telefone.replace(/\D/g, "")} style={{ fontSize: ".72rem", color: "#5ad8ff", textDecoration: "none" }}>{e.telefone}</a> : null}
                      {e.site ? <a href={e.site} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".72rem", color: "#5ad8ff", textDecoration: "none" }}>site</a> : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {sel && !cartoes ? (
        <div style={{ position: "absolute", bottom: "7.4rem", right: ".7rem", maxWidth: "min(320px, calc(100% - 1.4rem))", padding: ".7rem .85rem", borderRadius: 14, background: "rgba(7,12,22,.95)", border: "1px solid rgba(255,255,255,.16)", color: "#eaf3ff" }}>
          <button type="button" onClick={() => setSel(null)} aria-label="Fechar" style={{ position: "absolute", top: ".35rem", right: ".45rem", border: 0, background: "transparent", color: "rgba(234,243,255,.6)", cursor: "pointer", fontSize: ".9rem" }}>✕</button>
          <span style={{ display: "block", fontSize: ".66rem", textTransform: "uppercase", letterSpacing: ".07em", color: COR[sel.camada] || "#c79a3c", marginBottom: ".15rem" }}>{ROTULO[sel.camada] || sel.titulo || "Local"}</span>
          <strong style={{ display: "block", fontSize: ".95rem", paddingRight: "1rem" }}>{sel.nome}</strong>
          <span style={{ display: "block", fontSize: ".78rem", opacity: .72, marginTop: ".15rem" }}>{sel.sub}</span>
        </div>
      ) : null}

      {!pronto ? <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(4,8,16,.75)", color: "#c79a3c", fontSize: ".85rem", letterSpacing: ".1em", textTransform: "uppercase", pointerEvents: "none" }}>Desenhando o mapa…</div> : null}
    </div>
  );
}

Object.assign(window, { ReinoMapa });
})();
