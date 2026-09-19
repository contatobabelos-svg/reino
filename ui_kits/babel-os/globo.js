/* Globo digital do Reino — canvas 2D, projeção ortográfica, sem bibliotecas.
   Terra → Brasil → Estado (municípios IBGE) → Cidade (bairros) → Bairro (empresários).
   Mouse: arrastar gira · roda aproxima · passar o mouse revela. Toque: arrastar, pinça, tocar.
   Dados: GEO_MUNDO (Natural Earth/world-atlas), GEO_BRASIL e dados/municipios/UF.json (IBGE).
   Empresas, bairros e empresários vêm da API (ou do modo demonstração) via opts.buscar. */
(function () {
  "use strict";

  const RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const NIVEIS = ["terra", "brasil", "estado", "cidade", "bairro"];

  function pontoNoAnel(lon, lat, f) {
    let dentro = false;
    for (let i = 0, j = f.length - 2; i < f.length; j = i, i += 2) {
      const xi = f[i], yi = f[i + 1], xj = f[j], yj = f[j + 1];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }
  const contem = (feat, lon, lat) =>
    lon >= feat.b[0] && lon <= feat.b[2] && lat >= feat.b[1] && lat <= feat.b[3] && feat.g.some((anel) => pontoNoAnel(lon, lat, anel));

  /* [UI kit] população da cidade (Edge Function reino-apis, rota "cidade" → IBGE Censo
     2022). Cache em memória por "UF|cidade": dura a sessão da aba, sem duplicar buscas
     ao entrar e sair da mesma cidade. Falhou → cachePopulacao guarda null e a linha
     simplesmente não aparece (nada de erro visível no painel). */
  const cachePopulacao = {};
  function populacaoCidade(uf, cidade) {
    const chave = uf + "|" + cidade;
    if (chave in cachePopulacao) return cachePopulacao[chave];
    const cfg = window.REINO_SUPABASE;
    const promessa = (!cfg || !cfg.anon) ? Promise.resolve(null) : fetch("https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis", {
      method: "POST",
      headers: { apikey: cfg.anon, Authorization: "Bearer " + cfg.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ rota: "cidade", uf, cidade }),
    }).then((r) => (r.ok ? r.json() : null)).then((j) => (j && typeof j.populacao === "number" ? j.populacao : null)).catch(() => null);
    cachePopulacao[chave] = promessa;
    return promessa;
  }

  function criar(raiz, opts) {
    const { buscar, esc, num, estrelas, iniciais, clima, empresasGoogle, imersivo } = opts;
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MUNDO = window.GEO_MUNDO || [];
    const ESTADOS = window.GEO_BRASIL || [];
    const BRASIL = MUNDO.find((p) => p.n === "Brazil");

    raiz.classList.add("hg-globo");
    if (imersivo) raiz.classList.add("is-imersivo");
    raiz.innerHTML = `
      <canvas class="hg-globo-canvas" tabindex="0" aria-label="Globo digital. Use o painel ao lado para navegar pelo teclado."></canvas>
      <div class="hg-globo-hud">
        <button class="hg-icon-btn hg-globo-voltar" data-voltar aria-label="Voltar um nível" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
        <nav class="hg-globo-trilha" aria-label="Onde você está"></nav>
      </div>
      <div class="hg-globo-zoom">
        <button class="hg-icon-btn" data-zoom="1" aria-label="Aproximar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
        <button class="hg-icon-btn" data-zoom="-1" aria-label="Afastar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
        <button class="hg-icon-btn hg-globo-meu" data-meu-bairro aria-label="Mostrar minha localização" title="Mostrar minha localização" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></button>
        <button class="hg-icon-btn" data-terra aria-label="Ver o planeta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></button>
      </div>
      <div class="hg-globo-clima" role="status" hidden></div>
      <div class="hg-globo-tip" role="status" hidden></div>
      <p class="hg-globo-dica">Arraste para girar · ${imersivo ? "role" : "Ctrl + roda"} ou pinça para aproximar · toque no Brasil</p>
      <aside class="hg-globo-painel" aria-live="polite"></aside>
      <p class="hg-globo-credito" hidden>Ruas: Esri · © OpenStreetMap</p>`;

    const cv = raiz.querySelector("canvas");
    const ctx = cv.getContext("2d");
    const tip = raiz.querySelector(".hg-globo-tip");
    const painel = raiz.querySelector(".hg-globo-painel");
    /* aviso rápido quando a roda passa pelo globo sem Ctrl: a página rola e o zoom fica a um atalho */
    const avisoZoom = document.createElement("div");
    avisoZoom.className = "hg-globo-aviso"; avisoZoom.setAttribute("role", "status"); avisoZoom.hidden = true;
    avisoZoom.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "Use ⌘ + roda para dar zoom" : "Use Ctrl + roda para dar zoom";
    raiz.appendChild(avisoZoom);
    let avisoT = 0;
    const avisarZoom = () => { avisoZoom.hidden = false; clearTimeout(avisoT); avisoT = setTimeout(() => { avisoZoom.hidden = true; }, 1400); };
    const trilha = raiz.querySelector(".hg-globo-trilha");
    const dica = raiz.querySelector(".hg-globo-dica");
    const chipClima = raiz.querySelector(".hg-globo-clima");

    /* ---------- estado ---------- */
    let W = 0, H = 0, DPR = 1;
    const cam = { lon: -40, lat: -10, R: 200, ox: 0, oy: 0 };
    // Lua: órbita em volta da Terra; no nível "lua" ela vem para o centro e a Terra recua
    const lua = { ang: 0.9, k: 0, alvoK: 0, px: 0, py: 0, r: 0, atras: false };
    let anim = null;
    let giro = !reduz;
    let ultimaInteracao = 0;
    let sujo = true;
    const st = { nivel: "terra", uf: null, cidade: null, bairro: null, hover: null, usuario: null };
    let seqVoo = 0; // cada interação manual invalida a sequência automática em andamento
    const cacheMun = {};
    const dados = { estados: {}, cidades: {}, bairros: [], empresarios: [], google: [], googleEstado: null };
    const estrelasCeu = Array.from({ length: imersivo ? 520 : 160 }, (_, i) => ({ x: ((i * 7919) % 1000) / 1000, y: ((i * 104729) % 1000) / 1000, r: (i % 3) * 0.4 + 0.3 + (imersivo && i % 23 === 0 ? 1 : 0), a: 0.25 + ((i * 31) % 10) / 20, c: i % 11 === 0 ? "#bcd6ff" : i % 13 === 0 ? "#e2c6ff" : "#fff" }));
    // nebulosas do modo imersivo (derivam devagar com a rotação)
    const nebulosas = imersivo ? [
      { x: 0.18, y: 0.25, r: 0.55, c: "139,92,255", a: 0.2 }, { x: 0.82, y: 0.7, r: 0.6, c: "63,140,255", a: 0.17 },
      { x: 0.65, y: 0.12, r: 0.35, c: "224,75,255", a: 0.12 }, { x: 0.3, y: 0.85, r: 0.4, c: "63,227,255", a: 0.08 },
    ] : [];
    const credito = raiz.querySelector(".hg-globo-credito");

    /* ---------- ruas reais (mosaicos Esri World Dark Gray, tratados em neon) ---------- */
    const mosaicos = new Map();
    const lon2x = (lon, n) => ((lon + 180) / 360) * n;
    const lat2y = (lat, n) => ((1 - Math.asinh(Math.tan(lat * RAD)) / Math.PI) / 2) * n;
    const x2lon = (x, n) => (x / n) * 360 - 180;
    const y2lat = (y, n) => Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) / RAD;
    function mosaico(z, x, y) {
      const k = `${z}/${x}/${y}`;
      let m = mosaicos.get(k);
      if (m) { m.uso = performance.now(); return m.c; }
      m = { c: null, uso: performance.now() };
      mosaicos.set(k, m);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        try {
          const d = g.getImageData(0, 0, 256, 256), px = d.data;
          for (let i = 0; i < px.length; i += 4) {
            const t = Math.pow(Math.max(0, Math.min(1, ((px[i] + px[i + 1] + px[i + 2]) / 3 - 72) / 66)), 1.35);
            px[i] = 4 + 70 * t; px[i + 1] = 10 + 215 * t; px[i + 2] = 28 + 227 * t; px[i + 3] = 255;
          }
          g.putImageData(d, 0, 0);
        } catch (e) { /* sem CORS: usa o mosaico original */ }
        m.c = c; sujo = true;
        if (mosaicos.size > 180) [...mosaicos.entries()].sort((a, b) => a[1].uso - b[1].uso).slice(0, 40).forEach(([kk]) => mosaicos.delete(kk));
      };
      img.onerror = () => { m.falhou = true; };
      img.src = `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`;
      return null;
    }
    function desenharRuas() {
      const zf = Math.log2((cam.R * 2 * Math.PI) / 256);
      const alfa = Math.max(0, Math.min(1, (zf - 9.6) / 1.6));
      if (alfa <= 0 || (st.nivel !== "cidade" && st.nivel !== "bairro" && st.nivel !== "estado")) { credito.hidden = true; return; }
      let z = Math.min(17, Math.round(zf));
      const cantos = [[0, 0], [W, 0], [0, H], [W, H], [W / 2, 0], [W / 2, H], [0, H / 2], [W, H / 2]].map(([a, b]) => inverter(a, b)).filter(Boolean);
      if (cantos.length < 4) { credito.hidden = true; return; }
      const lons = cantos.map((c) => c[0]), lats = cantos.map((c) => c[1]);
      let n, x0, x1, y0, y1;
      for (;;) {
        n = 2 ** z;
        x0 = Math.floor(lon2x(Math.min(...lons), n)); x1 = Math.floor(lon2x(Math.max(...lons), n));
        y0 = Math.floor(lat2y(Math.max(...lats), n)); y1 = Math.floor(lat2y(Math.min(...lats), n));
        if ((x1 - x0 + 1) * (y1 - y0 + 1) <= 48 || z <= 10) break;
        z--;
      }
      ctx.save();
      ctx.globalAlpha = alfa;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const c = mosaico(z, x, y);
        if (!c) continue;
        const tl = proj(x2lon(x, n), y2lat(y, n)), tr = proj(x2lon(x + 1, n), y2lat(y, n)), bl = proj(x2lon(x, n), y2lat(y + 1, n));
        if (tl[2] <= 0) continue;
        ctx.setTransform(DPR * (tr[0] - tl[0]) / 256, DPR * (tr[1] - tl[1]) / 256, DPR * (bl[0] - tl[0]) / 256, DPR * (bl[1] - tl[1]) / 256, DPR * tl[0], DPR * tl[1]);
        ctx.drawImage(c, 0, 0, 256.6, 256.6);
      }
      ctx.restore();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      credito.hidden = false;
      // vinheta para as ruas se fundirem ao espaço
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(3,8,23,0)"); vg.addColorStop(1, `rgba(3,8,23,${0.75 * alfa})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    /* ---------- projeção ---------- */
    let s0 = 0, c0 = 1, cx = 0, cy = 0;
    // com o painel à direita (layout largo), o centro visual fica à esquerda dele
    const largo = () => raiz.clientWidth > 760;
    const prep = () => { s0 = Math.sin(cam.lat * RAD); c0 = Math.cos(cam.lat * RAD); cx = W / 2 + (largo() ? -160 : 0) + cam.ox; cy = H / 2 + cam.oy; };
    function proj(lon, lat) {
      const l = (lon - cam.lon) * RAD, p = lat * RAD;
      const cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
      const cosc = s0 * sp + c0 * cp * cl;
      return [cx + cam.R * cp * Math.sin(l), cy - cam.R * (c0 * sp - s0 * cp * cl), cosc];
    }
    function inverter(x, y) {
      const px = x - cx, py = cy - y;
      const rho = Math.hypot(px, py);
      if (rho > cam.R) return null;
      const c = Math.asin(rho / cam.R), sc = Math.sin(c), cc = Math.cos(c);
      const lat = rho ? Math.asin(cc * s0 + (py * sc * c0) / rho) / RAD : cam.lat;
      const lon = cam.lon + Math.atan2(px * sc, rho * cc * c0 - py * sc * s0) / RAD;
      return [((lon + 540) % 360) - 180, lat];
    }
    // caixa visível? (algum canto/centro na face da frente e dentro da tela)
    function visivel(b) {
      const pts = [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]], [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]];
      let frente = false, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (const [lo, la] of pts) {
        const [x, y, c] = proj(lo, la);
        if (c > -0.05) frente = true;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      return frente && maxX > -50 && minX < W + 50 && maxY > -50 && minY < H + 50;
    }
    function tracar(feat) {
      for (const anel of feat.g) {
        let aberto = false;
        for (let i = 0; i < anel.length; i += 2) {
          const [x, y, c] = proj(anel[i], anel[i + 1]);
          if (c < 0) { aberto = false; continue; }
          if (aberto) ctx.lineTo(x, y); else { ctx.moveTo(x, y); aberto = true; }
        }
      }
    }
    function ajustarR(b, folga = 0.78) {
      const dLon = (b[2] - b[0]) * Math.cos(((b[1] + b[3]) / 2) * RAD), dLat = b[3] - b[1];
      return clamp((Math.min(W, H) * folga) / (Math.max(dLon, dLat, 0.02) * RAD), Rmin(), Rmax());
    }
    const Rmin = () => Math.min(W, H) * 0.3;
    const Rmax = () => Math.min(W, H) * 4000;

    /* ---------- câmera animada ---------- */
    function voar(lon, lat, R, dur = 1300, ox = 0, oy = 0) {
      if (raiz.__acordar) raiz.__acordar();
      giro = false;
      let dl = ((lon - cam.lon + 540) % 360) - 180;
      const ini = { ...cam }, t0 = performance.now();
      const salto = Math.abs(dl) > 25 || R / ini.R > 20 || ini.R / R > 20;
      anim = (t) => {
        const k = reduz ? 1 : clamp((t - t0) / dur, 0, 1), e = easeInOut(k);
        cam.lon = ini.lon + dl * e;
        cam.lat = ini.lat + (lat - ini.lat) * e;
        cam.ox = ini.ox + (ox - ini.ox) * e;
        cam.oy = ini.oy + (oy - ini.oy) * e;
        let r = Math.exp(Math.log(ini.R) + (Math.log(R) - Math.log(ini.R)) * e);
        if (salto) r *= 1 - 0.35 * Math.sin(Math.PI * e); // recua no meio do voo, como um zoom de câmera
        cam.R = r;
        sujo = true;
        if (k >= 1) anim = null;
      };
    }
    const voarPara = (b, folga) => voar((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, ajustarR(b, folga));

    /* ---------- dados ---------- */
    async function carregarMunicipios(uf) {
      if (!cacheMun[uf]) { const emb = window.REINO_MUNICIPIOS && window.REINO_MUNICIPIOS[uf]; cacheMun[uf] = emb ? Promise.resolve(emb.cidades) : fetch(`dados/municipios/${uf}.json`).then((r) => r.json()).then((d) => d.cidades).catch(() => []); }
      return cacheMun[uf];
    }
    const lista = (r) => (r.estado === "ok" && Array.isArray(r.dados) ? r.dados : []);
    async function contagensBrasil() {
      const r = await buscar("reino/mapa", {});
      dados.estados = r.estado === "ok" ? r.dados.estados || {} : {};
      dados.total = r.estado === "ok" ? r.dados.total : null;
      dados.estadoApi = r.estado;
      sujo = true;
      if (st.nivel === "terra" || st.nivel === "brasil") renderPainel();
    }
    async function contagensEstado(uf) {
      const r = await buscar("reino/mapa", { estado: uf });
      dados.cidades = {};
      (r.estado === "ok" ? r.dados.cidades || [] : []).forEach((c) => (dados.cidades[norm(c.nome)] = c.empresas || 0));
      sujo = true;
    }

    /* ---------- navegação ---------- */
    function irLua() {
      Object.assign(st, { nivel: "lua", uf: null, cidade: null, bairro: null });
      lua.alvoK = 1;
      // a Terra recua para o canto inferior esquerdo
      voar(cam.lon, cam.lat, Math.min(W, H) * 0.2, 1400, -W * 0.3, H * 0.26);
      atualizarUI();
    }
    async function irTerra() {
      Object.assign(st, { nivel: "terra", uf: null, cidade: null, bairro: null });
      lua.alvoK = 0;
      voar(-50, -12, Math.min(W, H) * 0.42, 1400);
      setTimeout(() => (giro = !reduz), 1500);
      atualizarUI();
    }
    async function irBrasil() {
      Object.assign(st, { nivel: "brasil", uf: null, cidade: null, bairro: null });
      lua.alvoK = 0;
      voarPara(BRASIL ? BRASIL.b : [-74, -34, -34, 5.3], 0.82);
      atualizarUI();
    }
    async function irEstado(uf) {
      const e = ESTADOS.find((x) => x.uf === uf);
      if (!e) return;
      Object.assign(st, { nivel: "estado", uf, cidade: null, bairro: null });
      voarPara(e.b, 0.8);
      atualizarUI();
      painel.classList.add("is-carregando");
      await Promise.all([carregarMunicipios(uf), contagensEstado(uf)]);
      painel.classList.remove("is-carregando");
      sujo = true;
      renderPainel();
    }
    async function irCidade(cidade) {
      Object.assign(st, { nivel: "cidade", cidade, bairro: null });
      voarPara(cidade.b, 0.7);
      dados.bairros = [];
      dados.google = []; dados.googleEstado = null;
      dados.populacao = null;
      atualizarUI();
      populacaoCidade(st.uf, cidade.nome).then((p) => { if (st.cidade === cidade) { dados.populacao = p; renderPainel(); } });
      dados.bairros = lista(await buscar("reino/bairros", { cidade: cidade.nome, estado: st.uf }));
      sujo = true;
      renderPainel();
    }
    async function irBairro(bairro) {
      st.nivel = "bairro";
      st.bairro = bairro;
      // zoom de rua: ~2 km em volta do bairro, onde as ruas reais aparecem nítidas
      if (bairro.lat != null) voar(bairro.lng, bairro.lat, ajustarR([bairro.lng - 0.011, bairro.lat - 0.011, bairro.lng + 0.011, bairro.lat + 0.011], 0.85), 1200);
      dados.empresarios = [];
      atualizarUI();
      dados.empresarios = lista(await buscar("reino/empresarios", { cidade: st.cidade.nome, bairro: bairro.nome, estado: st.uf }));
      renderPainel();
    }
    /* ---------- hook de login: voar até o endereço do usuário ---------- */
    const fimDoVoo = () => new Promise((ok) => {
      const limite = performance.now() + 2600;
      const checar = () => (!anim || performance.now() > limite ? setTimeout(ok, reduz ? 0 : 220) : requestAnimationFrame(checar));
      checar();
    });
    function definirUsuario(perfil) {
      st.usuario = perfil && perfil.uf && perfil.cidade ? { ...perfil, uf: String(perfil.uf).toUpperCase() } : null;
      raiz.querySelector("[data-meu-bairro]").hidden = false; /* sem perfil ainda dá para achar pelo GPS/IP */
      sujo = true;
      renderPainel();
    }
    // "Minha localização": 1) GPS do aparelho (pede permissão; chega ao bairro) traduzido pelo
    // OpenStreetMap; 2) sem permissão, cidade aproximada pelo IP (ipwho.is); 3) endereço do perfil.
    async function localAtual() {
      const gps = await new Promise((ok) => {
        if (!navigator.geolocation) return ok(null);
        navigator.geolocation.getCurrentPosition((p) => ok(p.coords), () => ok(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 });
      });
      if (gps) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=pt-BR&zoom=16&lat=${gps.latitude}&lon=${gps.longitude}`);
          const a = (await r.json()).address || {};
          const uf = String(a["ISO3166-2-lvl4"] || "").replace("BR-", "");
          const cidade = a.city || a.town || a.village || a.municipality;
          if (uf && cidade) return { uf, cidade, bairro: a.suburb || a.neighbourhood || a.quarter || null };
        } catch (e) { /* sem rede: tenta o IP */ }
      }
      try {
        const j = await (await fetch("https://ipwho.is/?lang=pt-BR")).json();
        if (j.success && j.country_code === "BR" && j.region_code) return { uf: j.region_code, cidade: j.city };
      } catch (e) { /* segue para o perfil */ }
      return null;
    }
    async function irEnderecoDoUsuario() { return irEndereco((await localAtual()) || st.usuario); }
    // [UI kit] voa até qualquer endereço { uf, cidade, bairro? } — usado por "Ver no mapa"
    async function irEndereco(u) {
      if (!u || !u.uf || !u.cidade) return;
      u = { ...u, uf: String(u.uf).toUpperCase() };
      const seq = ++seqVoo;
      const vivo = () => seq === seqVoo;
      if (!ESTADOS.some((e) => e.uf === u.uf)) return;
      if (st.nivel === "terra" || st.nivel === "lua") { irBrasil(); await fimDoVoo(); if (!vivo()) return; }
      if (st.uf !== u.uf) { await irEstado(u.uf); await fimDoVoo(); if (!vivo()) return; }
      const muns = await carregarMunicipios(u.uf);
      const cidade = muns.find((m) => norm(m.nome) === norm(u.cidade));
      if (!cidade || !vivo()) return;
      if (st.cidade?.id !== cidade.id) { await irCidade(cidade); await fimDoVoo(); if (!vivo()) return; }
      const bairro = u.bairro && dados.bairros.find((b) => norm(b.nome) === norm(u.bairro));
      if (bairro) await irBairro(bairro);
    }
    const ehDoUsuario = (b) => st.usuario && st.cidade && norm(st.cidade.nome) === norm(st.usuario.cidade) && norm(b.nome) === norm(st.usuario.bairro || "");

    async function mostrarClima() {
      if (!clima || !st.cidade || (st.nivel !== "cidade" && st.nivel !== "bairro")) { chipClima.hidden = true; return; }
      const alvo = st.cidade.id;
      const c = await clima(st.cidade.nome, st.uf);
      if (!c || st.cidade?.id !== alvo) { if (st.cidade?.id === alvo) chipClima.hidden = true; return; }
      const icone = { storm: "⛈", snow: "❄", hail: "🌨", rain: "🌧", fog: "🌫", clear_day: "☀", clear_night: "🌙", cloud: "☁", cloudly_day: "⛅", cloudly_night: "☁", none_day: "☀", none_night: "🌙" }[c.condition_slug] || "🌡";
      chipClima.innerHTML = `<span class="ico">${icone}</span><b>${num(c.temp)}°</b><span>${esc(c.description)}</span><small>${esc(st.cidade.nome)} · umidade ${num(c.humidity)}%</small>`;
      chipClima.hidden = false;
    }

    function voltar() {
      if (st.nivel === "bairro") return irCidade(st.cidade);
      if (st.nivel === "cidade") return irEstado(st.uf);
      if (st.nivel === "estado") return irBrasil();
      if (st.nivel === "brasil" || st.nivel === "lua") return irTerra();
    }

    /* ---------- UI: trilha e painel ---------- */
    function atualizarUI() {
      raiz.dataset.nivel = st.nivel;
      // [UI kit] o mapa TomTom lê estes dois para saber onde assumir
      if (st.uf) raiz.dataset.uf = st.uf; else delete raiz.dataset.uf;
      if (st.cidade) raiz.dataset.cidade = st.cidade.nome; else delete raiz.dataset.cidade;
      if (st.bairro) raiz.dataset.bairro = st.bairro.nome; else delete raiz.dataset.bairro;
      raiz.querySelector("[data-voltar]").hidden = st.nivel === "terra";
      const e = st.uf && ESTADOS.find((x) => x.uf === st.uf);
      const passos = st.nivel === "lua" ? [["terra", "Terra"], ["lua", "Lua · Babel"]] : [["terra", "Terra"], ["brasil", "Brasil"]];
      if (e) passos.push(["estado", e.nome]);
      if (st.cidade) passos.push(["cidade", st.cidade.nome]);
      if (st.bairro) passos.push(["bairro", st.bairro.nome]);
      const alcance = st.nivel === "lua" ? 1 : NIVEIS.indexOf(st.nivel);
      trilha.innerHTML = passos.filter((_, i) => i <= alcance)
        .map(([n, t], i, arr) => i === arr.length - 1 ? `<span aria-current="location">${esc(t)}</span>` : `<button data-ir="${n}">${esc(t)}</button><i>›</i>`).join("");
      dica.classList.toggle("is-oculta", st.nivel !== "terra");
      cv.setAttribute("aria-label", `Globo digital — ${passos.map((p) => p[1]).join(", ")}`);
      mostrarClima();
      renderPainel();
      sujo = true;
    }

    // foto de perfil (fotos.js) quando existir
    const foto = (nome) => (window.ReinoFotos ? window.ReinoFotos.obter(nome) : null);
    function cabecalho(sobre, titulo, sub) {
      return `<p class="hg-globo-sobre">${sobre}</p><h3 class="hg-globo-titulo">${esc(titulo)}</h3>${sub ? `<p class="hg-globo-sub">${sub}</p>` : ""}`;
    }
    function aviso(msg) { return `<div class="hg-globo-vazio">${msg}</div>`; }
    const semApi = () => dados.estadoApi === "sem-api";

    function blocoGoogle() {
      if (!empresasGoogle || (st.nivel !== "cidade" && st.nivel !== "bairro")) return "";
      const onde = st.nivel === "bairro" ? `${st.bairro.nome}, ${st.cidade.nome}` : st.cidade.nome;
      let corpo = "";
      if (dados.googleEstado === "carregando") corpo = aviso("Buscando no Google Maps…");
      else if (dados.googleEstado === "erro") corpo = aviso(esc(dados.googleErro));
      else if (dados.googleEstado === "ok" && !dados.google.length) corpo = aviso("Nenhuma empresa encontrada.");
      else if (dados.google.length) corpo = `<ul class="hg-globo-google">${dados.google.map((g) => `<li>${g.foto_url ? `<img src="${esc(g.foto_url)}" alt="" loading="lazy">` : `<span class="hg-avatar">${esc(iniciais(g.nome))}</span>`}<div><strong>${esc(g.nome)}</strong><small>${esc(g.categoria || "")}</small>${g.avaliacao_google != null ? `<span>${estrelas(g.avaliacao_google)} ${num(g.avaliacao_google, 1)} (${num(g.num_avaliacoes_google || 0)})</span>` : ""}<small>${esc(g.endereco || "")}</small>${g.site ? `<a href="${esc(g.site)}" target="_blank" rel="noopener">site ↗</a>` : ""}</div></li>`).join("")}</ul>`;
      return `<div class="hg-globo-google-bloco"><button class="hg-btn is-ghost is-block" data-google>${dados.google.length ? "Atualizar" : "Empresas reais em"} ${esc(onde)} · Google Maps</button>${corpo}</div>`;
    }
    async function carregarGoogle() {
      const alvo = st.nivel === "bairro" ? `empresas em ${st.bairro.nome}, ${st.cidade.nome} - ${st.uf}` : `empresas em ${st.cidade.nome} - ${st.uf}`;
      const cidadeId = st.cidade.id;
      dados.googleEstado = "carregando"; renderPainel();
      const r = await empresasGoogle(alvo);
      if (st.cidade?.id !== cidadeId) return;
      if (r.estado === "ok") { dados.google = r.dados.candidatos || []; dados.googleEstado = "ok"; }
      else { dados.google = []; dados.googleEstado = "erro"; dados.googleErro = r.status === 503 ? "A chave do Google Maps (RAPIDAPI_MAPS_KEY) não está configurada no servidor." : r.mensagem || "Não foi possível buscar no Google Maps."; }
      sujo = true; renderPainel();
    }

    async function renderPainel() {
      let h = "";
      if (st.nivel === "terra") {
        // [UI kit] No nível Terra o painel identifica o território do usuário. O
        // alcance vem do título: Imperador = Brasil, Rei = região, Príncipe =
        // estado, Duque para baixo = cidade.
        const u = st.usuario;
        const est = u ? (window.GEO_BRASIL || []).find((e) => e.uf === u.uf) : null;
        const REG = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
        const ALCANCE = { Imperador: "brasil", Rei: "regiao", "Príncipe": "estado" };
        const alcance = u ? (ALCANCE[u.titulo] || "cidade") : null;
        if (!u) {
          h = cabecalho("Planeta Terra", "O Reino começa no Brasil", "Gire o globo e toque no Brasil para entrar.")
            + `<button class="hg-btn is-cyan is-block" data-ir="brasil">Entrar no Brasil</button>`;
        } else {
          const regiao = est ? REG[est.regiao] || "" : "";
          const lugar = alcance === "brasil" ? "Brasil" : alcance === "regiao" ? "Região " + regiao : alcance === "estado" ? (est ? est.nome : u.uf) : u.cidade;
          const onde = [u.bairro, u.cidade, u.uf].filter(Boolean).join(" · ");
          const acao = alcance === "brasil" || alcance === "regiao" ? "brasil" : alcance === "estado" ? "meu-estado" : "endereco";
          h = cabecalho("Seu território", lugar, `${esc(u.titulo || "Membro")} · você está em ${esc(onde)}`)
            + `<div class="hg-globo-local"><span class="hg-globo-local-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></span><div><b>${esc(u.cidade)}</b><span>${esc(est ? est.nome : u.uf)}${regiao ? " · " + regiao : ""}</span></div></div>`
            + `<button class="hg-btn is-cyan is-block" data-ir="${acao}">Ir para ${esc(lugar)}</button>`
            + (acao === "brasil" ? "" : `<button class="hg-btn is-block" data-ir="brasil">Ver o Brasil inteiro</button>`);
        }
        h += `<button class="hg-btn is-block hg-btn-lua" data-ir="lua">Visitar a torre Babel na Lua</button>`;
      } else if (st.nivel === "lua") {
        h = cabecalho("Lua · Sede", "Babel", "A torre que conecta todo o Reino. Daqui a Babel acompanha empresas, guildas e territórios.")
          + `<div class="hg-globo-torre-info"><span>Plataforma</span><b>Babel OS</b><span>Aplicativo</span><b>Reino</b></div>`
          + `<a class="hg-btn is-block hg-btn-lua" href="https://www.babel-os.com" target="_blank" rel="noopener">Conhecer a Babel</a>`
          + `<button class="hg-btn is-ghost is-block" data-ir="terra">Voltar para a Terra</button>`;
      } else if (st.nivel === "brasil") {
        const ordem = ESTADOS.slice().sort((a, b) => (dados.estados[b.uf] || 0) - (dados.estados[a.uf] || 0) || a.nome.localeCompare(b.nome, "pt-BR"));
        const ativos = ordem.filter((e) => dados.estados[e.uf]).length;
        h = cabecalho("País", "Brasil", dados.total != null ? `<b>${num(dados.total)}</b> empresas em <b>${ativos}</b> estados` : "27 unidades federativas")
          + (semApi() ? aviso('Conecte a API para ver empresas por estado.') : "")
          + `<ul class="hg-globo-lista">${ordem.map((e) => `<li><button data-uf="${e.uf}" class="${dados.estados[e.uf] ? "is-ativo" : ""}"><span class="uf">${e.uf}</span>${esc(e.nome)}<b>${dados.estados[e.uf] ? num(dados.estados[e.uf]) : "—"}</b></button></li>`).join("")}</ul>`;
      } else if (st.nivel === "estado") {
        const e = ESTADOS.find((x) => x.uf === st.uf);
        const muns = cacheMun[st.uf] ? await cacheMun[st.uf] : null;
        if (st.nivel !== "estado") return;
        const comEmp = muns ? muns.filter((m) => dados.cidades[norm(m.nome)]) : [];
        h = cabecalho(`Estado · ${e.uf}`, e.nome, muns ? `<b>${num(muns.length)}</b> cidades · <b>${num(comEmp.length)}</b> com empresas` : "Carregando cidades…")
          + `<label class="sr-only" for="globo-filtro">Filtrar cidades</label><input class="hg-input hg-globo-filtro" id="globo-filtro" type="search" placeholder="Buscar cidade em ${esc(e.nome)}…">`
          + `<ul class="hg-globo-lista" data-cidades></ul>`;
      } else if (st.nivel === "cidade") {
        const qtd = dados.cidades[norm(st.cidade.nome)] || 0;
        const linhaPop = dados.populacao ? `<p class="hg-globo-sub">População: <b>${num(dados.populacao)}</b> (IBGE · Censo 2022)</p>` : "";
        h = cabecalho(`Cidade · ${st.uf}`, st.cidade.nome, `<b>${num(qtd)}</b> empresas · <b>${num(dados.bairros.length)}</b> bairros com empresários`)
          + linhaPop
          + (dados.bairros.length
            ? `<ul class="hg-globo-lista">${dados.bairros.map((b, i) => `<li><button data-bairro="${i}" class="is-ativo"><span class="uf">${esc(iniciais(b.nome))}</span>${esc(b.nome)}<b>${num(b.empresarios ?? b.empresas ?? 0)}</b></button></li>`).join("")}</ul>`
            : aviso(semApi() ? "Conecte a API para ver os bairros." : "Nenhum bairro com empresários do Reino nesta cidade ainda."));
      } else if (st.nivel === "bairro") {
        h = (ehDoUsuario(st.bairro) ? `<p class="hg-globo-voce">📍 Você está aqui</p>` : "") + cabecalho(`Bairro · ${esc(st.cidade.nome)}`, st.bairro.nome, `<b>${num(dados.empresarios.length)}</b> empresários`)
          + (dados.empresarios.length
            ? `<ul class="hg-globo-empresarios">${dados.empresarios.map((p) => `<li><div class="hg-globo-pessoa">${foto(p.nome) ? `<img class="hg-globo-foto" src="${foto(p.nome)}" alt="" loading="lazy">` : `<span class="hg-avatar">${esc(iniciais(p.nome))}</span>`}<div><strong>${esc(p.nome)}</strong><span class="hg-gold">${esc(p.titulo || "")}</span></div></div>${(p.empresas || []).map((x) => `<div class="hg-globo-empresa"><span>${esc(x.nome)}</span><small>${esc(x.nicho || "")}</small>${x.nota != null ? estrelas(x.nota) : ""}</div>`).join("")}</li>`).join("")}</ul>`
            : aviso("Carregando empresários…"));
      }
      painel.innerHTML = h + blocoGoogle();
      painel.classList.remove("is-entrando");
      void painel.offsetWidth;
      painel.classList.add("is-entrando");
      if (st.nivel === "estado") listarCidades("");
    }
    async function listarCidades(filtro) {
      const ul = painel.querySelector("[data-cidades]");
      if (!ul || !cacheMun[st.uf]) return;
      const muns = await cacheMun[st.uf];
      const f = norm(filtro);
      const itens = muns.filter((m) => !f || norm(m.nome).includes(f))
        .sort((a, b) => (dados.cidades[norm(b.nome)] || 0) - (dados.cidades[norm(a.nome)] || 0) || a.nome.localeCompare(b.nome, "pt-BR"));
      ul.innerHTML = itens.slice(0, 80).map((m) => { const q = dados.cidades[norm(m.nome)]; return `<li><button data-cidade="${m.id}" class="${q ? "is-ativo" : ""}">${esc(m.nome)}<b>${q ? num(q) : ""}</b></button></li>`; }).join("")
        + (itens.length > 80 ? `<li class="hg-globo-mais">+ ${num(itens.length - 80)} cidades — use a busca</li>` : "");
    }

    raiz.addEventListener("click", async (e) => {
      const b = e.target.closest("button, [data-ir]");
      if (!b) return;
      if (!b.hasAttribute("data-meu-bairro")) seqVoo++;
      if (b.dataset.ir === "terra") irTerra();
      else if (b.dataset.ir === "brasil") irBrasil();
      else if (b.dataset.ir === "lua") irLua();
      else if (b.dataset.ir === "meu-estado") irEstado(st.usuario && st.usuario.uf);
      else if (b.dataset.ir === "endereco") irEnderecoDoUsuario();
      else if (b.dataset.ir === "estado") irEstado(st.uf);
      else if (b.dataset.ir === "cidade") irCidade(st.cidade);
      else if (b.dataset.uf) irEstado(b.dataset.uf);
      else if (b.dataset.cidade) { const m = (await cacheMun[st.uf]).find((x) => x.id === b.dataset.cidade); if (m) irCidade(m); }
      else if (b.dataset.bairro) irBairro(dados.bairros[+b.dataset.bairro]);
      else if (b.hasAttribute("data-voltar")) voltar();
      else if (b.hasAttribute("data-terra")) irTerra();
      else if (b.hasAttribute("data-meu-bairro")) irEnderecoDoUsuario();
      else if (b.hasAttribute("data-google")) carregarGoogle();
      else if (b.dataset.zoom) { giro = false; voar(cam.lon, cam.lat, clamp(cam.R * (b.dataset.zoom === "1" ? 1.8 : 1 / 1.8), Rmin(), Rmax()), 500); }
    });
    painel.addEventListener("input", (e) => e.target.id === "globo-filtro" && listarCidades(e.target.value));
    raiz.addEventListener("keydown", (e) => { if (e.key === "Escape" && st.nivel !== "terra") { e.preventDefault(); voltar(); } });

    /* ---------- hit test ---------- */
    function alvoEm(x, y) {
      if ((st.nivel === "terra" || st.nivel === "lua") && lua.r > 0 && Math.hypot(x - lua.px, y - (lua.py - lua.r * 0.6)) < lua.r * 1.6) return { tipo: "lua" };
      if (st.nivel === "cidade" || st.nivel === "bairro") {
        let melhor = null, dMin = 22;
        dados.bairros.forEach((b) => {
          if (b.lat == null) return;
          const [bx, by, c] = proj(b.lng, b.lat);
          const d = Math.hypot(bx - x, by - y);
          if (c > 0 && d < dMin) { dMin = d; melhor = { tipo: "bairro", bairro: b }; }
        });
        if (melhor) return melhor;
      }
      const ll = inverter(x, y);
      if (!ll) return null;
      const [lon, lat] = ll;
      if (st.nivel !== "terra" && st.uf && cacheMun[st.uf]?.pronto) {
        const m = cacheMun[st.uf].pronto.find((f) => contem(f, lon, lat));
        if (m) return { tipo: "cidade", cidade: m };
      }
      if (st.nivel !== "terra") {
        const e = ESTADOS.find((f) => contem(f, lon, lat));
        if (e) return { tipo: "estado", estado: e };
      }
      const p = MUNDO.find((f) => contem(f, lon, lat));
      return p ? { tipo: "pais", pais: p } : { tipo: "oceano" };
    }
    // guarda a versão resolvida da promessa para o hit test síncrono
    const origCarregar = carregarMunicipios;
    carregarMunicipios = async (uf) => { const d = await origCarregar(uf); cacheMun[uf].pronto = d; return d; };

    let hoverTimer = null;
    function hover(x, y) {
      const a = alvoEm(x, y);
      const chave = a && (a.tipo === "lua" ? "lua" : a.pais?.n || a.estado?.uf || a.cidade?.id || a.bairro?.nome);
      if (chave !== (st.hover && st.hover.chave)) { st.hover = a ? { ...a, chave } : null; sujo = true; }
      cv.style.cursor = a && a.tipo !== "oceano" ? "pointer" : "grab";
      if (!a || a.tipo === "oceano") { tip.hidden = true; return; }
      let html = "";
      if (a.tipo === "lua") html = st.nivel === "lua" ? "<b>Torre Babel</b><span>Sede do Reino</span>" : "<b>Lua · Torre Babel</b><span>Toque para visitar a sede</span>";
      if (a.tipo === "pais") html = a.pais === BRASIL ? "<b>Brasil</b><span>Toque para entrar no Reino</span>" : `<b>${esc(a.pais.n)}</b><span>Em breve no Reino</span>`;
      if (a.tipo === "estado") {
        const q = dados.estados[a.estado.uf];
        html = `<b>${esc(a.estado.nome)}</b><span>${q ? `${num(q)} empresas` : "Sem empresas ainda"}</span>`;
        // passar o mouse revela as cidades do estado
        clearTimeout(hoverTimer);
        if (st.nivel === "brasil") hoverTimer = setTimeout(async () => {
          const muns = await carregarMunicipios(a.estado.uf);
          if (st.hover?.chave !== a.estado.uf) return;
          tip.innerHTML = `<b>${esc(a.estado.nome)}</b><span>${num(muns.length)} cidades${q ? ` · ${num(q)} empresas` : ""}</span><em>${muns.slice().sort((m1, m2) => m1.nome.localeCompare(m2.nome, "pt-BR")).slice(0, 6).map((m) => esc(m.nome)).join(" · ")}…</em>`;
          sujo = true;
        }, 180);
      }
      if (a.tipo === "cidade") { const q = dados.cidades[norm(a.cidade.nome)]; html = `<b>${esc(a.cidade.nome)}</b><span>${q ? `${num(q)} empresas` : "Sem empresas ainda"}</span>`; }
      if (a.tipo === "bairro") html = `<b>${esc(a.bairro.nome)}</b><span>${num(a.bairro.empresarios ?? 0)} empresários · ${num(a.bairro.empresas ?? 0)} empresas</span>`;
      tip.innerHTML = html;
      tip.hidden = false;
      const r = raiz.getBoundingClientRect();
      tip.style.left = clamp(x + 14, 8, r.width - 240) + "px";
      tip.style.top = clamp(y + 14, 8, r.height - 90) + "px";
    }
    function clicar(x, y) {
      const a = alvoEm(x, y);
      if (!a) return;
      if (a.tipo === "lua") { if (st.nivel !== "lua") irLua(); return; }
      if (st.nivel === "lua") { if (a.tipo !== "oceano" || inverter(x, y)) irTerra(); return; }
      if (st.nivel === "terra") { if (a.pais === BRASIL) irBrasil(); return; }
      if (a.tipo === "bairro") return irBairro(a.bairro);
      if (a.tipo === "cidade" && (st.nivel === "estado" || st.nivel === "cidade" || st.nivel === "bairro")) return irCidade(a.cidade);
      if (a.tipo === "estado") return irEstado(a.estado.uf);
      if (a.tipo === "pais" && a.pais !== BRASIL) irTerra();
    }

    /* ---------- ponteiros: arrastar, inércia, pinça, toque ---------- */
    const ptrs = new Map();
    let arr = null, vel = { x: 0, y: 0 }, pinca = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => {
      if (raiz.__acordar) raiz.__acordar();
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, pos(e));
      giro = false; anim = null; ultimaInteracao = performance.now(); seqVoo++;
      if (ptrs.size === 1) { const [x, y] = pos(e); arr = { x, y, x0: x, y0: y, t0: performance.now(), t: performance.now() }; vel = { x: 0, y: 0 }; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinca = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), R: cam.R }; arr = null; }
      raiz.classList.add("is-arrastando");
    });
    cv.addEventListener("pointermove", (e) => {
      const [x, y] = pos(e);
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [x, y]);
      if (pinca && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        cam.R = clamp(pinca.R * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinca.d), Rmin(), Rmax());
        sujo = true; return;
      }
      if (arr) {
        const dx = x - arr.x, dy = y - arr.y, agora = performance.now(), dt = Math.max(agora - arr.t, 1);
        const k = 1 / (cam.R * RAD);
        cam.lon -= dx * k; cam.lat = clamp(cam.lat + dy * k, -85, 85);
        vel = { x: (dx * k) / dt, y: (dy * k) / dt };
        arr.x = x; arr.y = y; arr.t = agora;
        tip.hidden = true; sujo = true; return;
      }
      if (e.pointerType === "mouse") hover(x, y);
    });
    const soltar = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinca = null;
      if (arr && ptrs.size === 0) {
        const [x, y] = pos(e);
        const toque = Math.hypot(x - arr.x0, y - arr.y0) < 7 && performance.now() - arr.t0 < 450;
        if (toque) clicar(x, y);
        else if (!reduz) inercia = { ...vel, t: performance.now() };
        arr = null;
      }
      raiz.classList.remove("is-arrastando");
      ultimaInteracao = performance.now();
    };
    cv.addEventListener("pointerup", soltar);
    cv.addEventListener("pointercancel", soltar);
    cv.addEventListener("pointerleave", () => { if (!arr) { tip.hidden = true; if (st.hover) { st.hover = null; sujo = true; } } });
    cv.addEventListener("wheel", (e) => {
      /* fora da tela cheia a roda rola a página; zoom no globo pede Ctrl/⌘ + roda */
      if (!imersivo && !e.ctrlKey && !e.metaKey) { avisarZoom(); return; }
      e.preventDefault();
      if (raiz.__acordar) raiz.__acordar();
      giro = false; anim = null; ultimaInteracao = performance.now(); seqVoo++;
      cam.R = clamp(cam.R * Math.exp(-e.deltaY * 0.0015), Rmin(), Rmax());
      sujo = true;
    }, { passive: false });
    cv.addEventListener("keydown", (e) => {
      const passo = 8 / Math.max(1, cam.R / Rmin());
      const mapa = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] };
      if (mapa[e.key]) { e.preventDefault(); giro = false; cam.lon += mapa[e.key][0]; cam.lat = clamp(cam.lat + mapa[e.key][1], -85, 85); sujo = true; }
      if (e.key === "+" || e.key === "=") { cam.R = clamp(cam.R * 1.3, Rmin(), Rmax()); sujo = true; }
      if (e.key === "-") { cam.R = clamp(cam.R / 1.3, Rmin(), Rmax()); sujo = true; }
      if (e.key === "Enter" && st.nivel === "terra") irBrasil();
    });
    let inercia = null;

    /* ---------- Lua e torre Babel ---------- */
    const crateras = Array.from({ length: 14 }, (_, i) => ({ a: (i * 2.39996) % (Math.PI * 2), d: ((i * 37) % 100) / 130, r: 0.05 + ((i * 53) % 10) / 90 }));
    function posicaoLua() {
      const zoomRel = cam.R / Rmin();
      const orbX = cx + Math.cos(lua.ang) * cam.R * 1.85, orbY = cy + Math.sin(lua.ang) * cam.R * 0.4 - cam.R * 0.1;
      const orbR = Math.max(16, cam.R * 0.22);
      const areaW = largo() ? W - 330 : W;
      const cenX = areaW * 0.52, cenY = H * 0.56, cenR = Math.min(areaW, H) * 0.24;
      const e = easeInOut(lua.k);
      lua.px = orbX + (cenX - orbX) * e;
      lua.py = orbY + (cenY - orbY) * e;
      lua.r = orbR + (cenR - orbR) * e;
      lua.atras = lua.k < 0.5 && Math.sin(lua.ang) < 0;
      lua.alfa = lua.k > 0 ? 1 : clamp(1.8 - zoomRel / 1.6, 0, 1);
      if (lua.alfa <= 0) lua.r = 0;
    }
    function desenharTorre(x, baseY, mr, t) {
      const h = mr * 1.35, w0 = mr * 0.2, w1 = mr * 0.035, topo = baseY - h;
      const g = ctx.createLinearGradient(x, baseY, x, topo);
      g.addColorStop(0, "#1e3a8a"); g.addColorStop(0.35, "#3b82ff"); g.addColorStop(0.7, "#8b5cff"); g.addColorStop(1, "#d6b3ff");
      // brilho de base
      const halo = ctx.createRadialGradient(x, baseY, 0, x, baseY, mr * 0.9);
      halo.addColorStop(0, "rgba(139,92,255,.55)"); halo.addColorStop(1, "rgba(139,92,255,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.ellipse(x, baseY, mr * 0.9, mr * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      // torres laterais
      [-1, 1].forEach((lado) => {
        const bx = x + lado * w0 * 1.25;
        ctx.fillStyle = g; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.moveTo(bx - w0 * 0.45, baseY); ctx.lineTo(bx - lado * w0 * 0.1, baseY - h * 0.55); ctx.lineTo(bx + w0 * 0.45 * (lado > 0 ? 0.2 : 1), baseY - h * 0.5); ctx.lineTo(bx + w0 * 0.45, baseY); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      });
      // torre principal
      ctx.shadowColor = "#8b5cff"; ctx.shadowBlur = mr * 0.35;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w0, baseY); ctx.lineTo(x - w0 * 0.55, baseY - h * 0.45); ctx.lineTo(x - w1 * 2, topo + h * 0.12); ctx.lineTo(x, topo);
      ctx.lineTo(x + w1 * 2, topo + h * 0.12); ctx.lineTo(x + w0 * 0.55, baseY - h * 0.45); ctx.lineTo(x + w0, baseY); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // andares acesos
      ctx.strokeStyle = "rgba(160,235,255,.55)"; ctx.lineWidth = Math.max(0.6, mr * 0.008);
      for (let i = 1; i < 12; i++) {
        const y = baseY - (h * 0.85 * i) / 12, frac = (baseY - y) / h;
        const meia = w0 * (1 - frac * 0.9);
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 400 + i);
        ctx.beginPath(); ctx.moveTo(x - meia, y); ctx.lineTo(x + meia, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // núcleo de luz
      ctx.strokeStyle = "rgba(63,227,255,.9)"; ctx.lineWidth = Math.max(1, mr * 0.012);
      ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = mr * 0.2;
      ctx.beginPath(); ctx.moveTo(x, baseY - h * 0.05); ctx.lineTo(x, topo + h * 0.05); ctx.stroke(); ctx.shadowBlur = 0;
      // anéis holográficos girando
      [0.32, 0.58].forEach((f, i) => {
        const ry = baseY - h * f, rx = w0 * (2.4 - f * 1.4);
        ctx.strokeStyle = i ? "rgba(139,92,255,.8)" : "rgba(63,227,255,.8)"; ctx.lineWidth = Math.max(1, mr * 0.012);
        ctx.setLineDash([mr * 0.08, mr * 0.05]); ctx.lineDashOffset = (i ? -1 : 1) * t / 30;
        ctx.beginPath(); ctx.ellipse(x, ry, rx, rx * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]);
      // farol no topo
      const p = 0.5 + 0.5 * Math.sin(t / 350);
      ctx.fillStyle = "#e9d5ff"; ctx.shadowColor = "#c084fc"; ctx.shadowBlur = mr * (0.3 + 0.3 * p);
      ctx.beginPath(); ctx.arc(x, topo, Math.max(1.5, mr * 0.04), 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (mr > 36) {
        ctx.font = `800 ${Math.round(mr * 0.2)}px 'Exo 2', Inter, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const tg = ctx.createLinearGradient(x - mr * 0.5, 0, x + mr * 0.5, 0); tg.addColorStop(0, "#8b5cff"); tg.addColorStop(1, "#3fe3ff");
        ctx.fillStyle = tg; ctx.shadowColor = "#8b5cff"; ctx.shadowBlur = 16;
        ctx.fillText("BABEL", x, baseY + mr * 1.45); ctx.shadowBlur = 0;
      }
    }
    function desenharLua(t) {
      if (lua.r <= 0) return;
      const { px: x, py: y, r } = lua;
      ctx.globalAlpha = lua.alfa * (lua.atras ? 0.55 : 1);
      // aura
      const au = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.5);
      au.addColorStop(0, "rgba(139,92,255,.35)"); au.addColorStop(1, "rgba(59,130,255,0)");
      ctx.fillStyle = au; ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, Math.PI * 2); ctx.fill();
      // superfície
      const sf = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      sf.addColorStop(0, "#dfe6f7"); sf.addColorStop(0.55, "#8391b4"); sf.addColorStop(1, "#2b3558");
      ctx.fillStyle = sf; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      crateras.forEach((c) => {
        const cxr = x + Math.cos(c.a) * c.d * r, cyr = y + Math.sin(c.a) * c.d * r;
        ctx.fillStyle = "rgba(40,50,85,.35)"; ctx.beginPath(); ctx.arc(cxr, cyr, c.r * r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(230,238,255,.18)"; ctx.lineWidth = Math.max(0.5, r * 0.01); ctx.beginPath(); ctx.arc(cxr - c.r * r * 0.15, cyr - c.r * r * 0.15, c.r * r, Math.PI, Math.PI * 1.7); ctx.stroke();
      });
      // grade holográfica sobre a Lua
      ctx.strokeStyle = "rgba(139,92,255,.22)"; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(x, y, r, r * Math.abs(i) / 3.2, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = "rgba(190,160,255,.8)"; ctx.lineWidth = Math.max(1, r * 0.015); ctx.shadowColor = "#8b5cff"; ctx.shadowBlur = r * 0.25;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      const hov = st.hover?.tipo === "lua";
      desenharTorre(x, y - r * 0.78, r * (hov && st.nivel === "terra" ? 1.08 : 1), t);
      ctx.globalAlpha = 1;
    }

    /* ---------- desenho ---------- */
    function desenhar(t) {
      prep();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const zoomRel = cam.R / Rmin();
      const globoInteiro = cam.R < Math.hypot(W, H) / 2;

      // céu
      nebulosas.forEach((nb, i) => {
        const nx = (nb.x * W - cam.lon * 0.25 + W * 10) % (W * 1.3) - W * 0.15, ny = nb.y * H + Math.sin(t / 9000 + i) * 12;
        const rr = nb.r * Math.max(W, H);
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, rr);
        g.addColorStop(0, `rgba(${nb.c},${nb.a})`); g.addColorStop(0.45, `rgba(${nb.c},${nb.a * 0.35})`); g.addColorStop(1, `rgba(${nb.c},0)`);
        ctx.fillStyle = g; ctx.fillRect(nx - rr, ny - rr, rr * 2, rr * 2);
      });
      estrelasCeu.forEach((s) => {
        const x = (s.x * W - cam.lon * 0.6 + W * 10) % W, y = (s.y * H + cam.lat * 0.6 + H * 10) % H;
        ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t / 900 + s.x * 20));
        ctx.fillStyle = s.c;
        ctx.fillRect(x, y, s.r, s.r);
      });
      ctx.globalAlpha = 1;

      posicaoLua();
      if (lua.atras) desenharLua(t);

      // atmosfera
      if (globoInteiro) {
        const g = ctx.createRadialGradient(cx, cy, cam.R * 0.92, cx, cy, cam.R * 1.25);
        g.addColorStop(0, "rgba(63,227,255,.35)"); g.addColorStop(0.35, "rgba(59,130,255,.18)"); g.addColorStop(1, "rgba(139,92,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cam.R * 1.25, 0, Math.PI * 2); ctx.fill();
      }
      // oceano
      const oc = ctx.createRadialGradient(cx - cam.R * 0.35, cy - cam.R * 0.4, cam.R * 0.1, cx, cy, cam.R);
      oc.addColorStop(0, "#0d2a5c"); oc.addColorStop(0.7, "#071636"); oc.addColorStop(1, "#040b22");
      ctx.fillStyle = oc; ctx.beginPath(); ctx.arc(cx, cy, cam.R, 0, Math.PI * 2); ctx.fill();

      // grade (some com o zoom)
      const aGrade = clamp(1.4 - zoomRel / 6, 0, 1);
      if (aGrade > 0) {
        ctx.strokeStyle = `rgba(80,160,255,${0.14 * aGrade})`; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let lo = -180; lo < 180; lo += 15) { let ab = false; for (let la = -80; la <= 80; la += 4) { const [x, y, c] = proj(lo, la); if (c < 0) { ab = false; continue; } ab ? ctx.lineTo(x, y) : ctx.moveTo(x, y); ab = true; } }
        for (let la = -75; la <= 75; la += 15) { let ab = false; for (let lo = -180; lo <= 180; lo += 4) { const [x, y, c] = proj(lo, la); if (c < 0) { ab = false; continue; } ab ? ctx.lineTo(x, y) : ctx.moveTo(x, y); ab = true; } }
        ctx.stroke();
      }

      // países
      const pulso = 0.5 + 0.5 * Math.sin(t / 700);
      MUNDO.forEach((p) => {
        if (!visivel(p.b)) return;
        const ehBr = p === BRASIL, hov = st.hover?.pais === p;
        ctx.beginPath(); tracar(p);
        ctx.fillStyle = ehBr ? (st.nivel === "terra" ? `rgba(63,227,255,${0.22 + 0.12 * pulso})` : "rgba(20,50,110,.55)") : hov ? "rgba(90,130,220,.35)" : "rgba(22,40,86,.75)";
        ctx.fill();
        ctx.lineWidth = ehBr ? 1.4 : 0.6;
        ctx.strokeStyle = ehBr ? "rgba(120,240,255,.95)" : "rgba(90,150,255,.35)";
        if (ehBr && st.nivel === "terra") { ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = 14 + 10 * pulso; }
        ctx.stroke(); ctx.shadowBlur = 0;
      });

      // estados
      if (st.nivel !== "terra") {
        const maxQ = Math.max(1, ...Object.values(dados.estados));
        ESTADOS.forEach((e) => {
          if (!visivel(e.b)) return;
          const q = dados.estados[e.uf] || 0, sel = e.uf === st.uf, hov = st.hover?.estado === e;
          ctx.beginPath(); tracar(e);
          const foco = st.nivel === "brasil" || sel;
          ctx.fillStyle = sel ? "rgba(30,70,150,.55)" : hov ? "rgba(63,227,255,.28)" : `rgba(59,130,255,${foco ? 0.08 + 0.4 * (q / maxQ) : 0.05})`;
          ctx.fill();
          ctx.lineWidth = sel || hov ? 1.8 : 0.9;
          ctx.strokeStyle = sel ? "#3fe3ff" : hov ? "rgba(160,245,255,.95)" : `rgba(110,190,255,${foco ? 0.6 : 0.25})`;
          if (sel || hov) { ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = 12; }
          ctx.stroke(); ctx.shadowBlur = 0;
        });
        // rótulos das UFs no nível Brasil
        if (st.nivel === "brasil") {
          ctx.font = "700 11px 'Exo 2', Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ESTADOS.forEach((e) => {
            const [x, y, c] = proj(e.c[0], e.c[1]);
            if (c <= 0 || (e.b[2] - e.b[0]) * cam.R * RAD < 24) return;
            ctx.fillStyle = dados.estados[e.uf] ? "#fff" : "rgba(200,220,255,.55)";
            ctx.fillText(e.uf, x, y);
          });
        }
      }

      desenharRuas();

      // municípios: do estado em foco, ou do estado sob o mouse (revelação)
      const ufMun = st.uf || (st.nivel === "brasil" && st.hover?.estado?.uf);
      const muns = ufMun && cacheMun[ufMun]?.pronto;
      if (muns) {
        const revela = !st.uf;
        muns.forEach((m) => {
          if (!visivel(m.b)) return;
          const q = dados.cidades[norm(m.nome)] || 0, sel = st.cidade?.id === m.id, hov = st.hover?.cidade === m;
          ctx.beginPath(); tracar(m);
          if (!revela) {
            ctx.fillStyle = sel ? "rgba(63,227,255,.22)" : hov ? "rgba(63,227,255,.2)" : q ? `rgba(245,199,106,${0.18 + Math.min(q, 5) * 0.06})` : "rgba(59,130,255,.03)";
            ctx.fill();
          }
          ctx.lineWidth = sel || hov ? 1.6 : 0.5;
          ctx.strokeStyle = sel ? "#3fe3ff" : hov ? "rgba(170,245,255,.95)" : revela ? "rgba(140,220,255,.28)" : q ? "rgba(245,199,106,.7)" : "rgba(110,180,255,.22)";
          if (sel) { ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = 16; }
          ctx.stroke(); ctx.shadowBlur = 0;
        });
        // nomes das cidades com empresas
        if (st.nivel === "estado" || st.nivel === "cidade") {
          ctx.textAlign = "center"; ctx.textBaseline = "bottom";
          // com muitas cidades ativas, só as maiores ganham nome (as demais ficam como ponto dourado)
          const topo = new Set(muns.filter((m) => dados.cidades[norm(m.nome)]).sort((a, b) => dados.cidades[norm(b.nome)] - dados.cidades[norm(a.nome)]).slice(0, 12).map((m) => m.id));
          muns.forEach((m) => {
            const q = dados.cidades[norm(m.nome)];
            const sel = st.cidade?.id === m.id;
            if (!q && !sel && st.hover?.cidade !== m) return;
            const [x, y, c] = proj(m.c[0], m.c[1]);
            if (c <= 0 || x < -40 || x > W + 40 || y < -20 || y > H + 20) return;
            if (st.nivel === "estado") {
              ctx.fillStyle = "#f5c76a"; ctx.shadowColor = "#f5c76a"; ctx.shadowBlur = 10;
              ctx.beginPath(); ctx.arc(x, y, 3.2 + 1.2 * pulso, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            }
            if (!sel && st.hover?.cidade !== m && !topo.has(m.id)) return;
            ctx.font = `${sel ? 700 : 600} ${sel ? 14 : 11}px Inter, sans-serif`;
            ctx.lineWidth = 3; ctx.strokeStyle = "rgba(3,8,23,.85)"; ctx.strokeText(m.nome, x, y - 6);
            ctx.fillStyle = "#fff"; ctx.fillText(m.nome, x, y - 6);
          });
        }
      }

      // bairros e empresários
      if ((st.nivel === "cidade" || st.nivel === "bairro") && dados.bairros.length) {
        const pontos = dados.bairros.filter((b) => b.lat != null).map((b) => ({ b, p: proj(b.lng, b.lat) }));
        // conexões entre bairros
        ctx.strokeStyle = "rgba(139,92,255,.5)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.lineDashOffset = -t / 60;
        ctx.beginPath(); pontos.forEach(({ p }, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (pontos.length > 2) ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        pontos.forEach(({ b, p: [x, y, c] }) => {
          if (c <= 0) return;
          const sel = st.bairro === b, hov = st.hover?.bairro === b;
          const r = 7 + Math.min(b.empresas || 1, 6) * 1.5;
          // anel pulsante
          ctx.strokeStyle = sel ? "rgba(245,199,106,.8)" : "rgba(63,227,255,.6)";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - ((t / 1600) % 1);
          ctx.beginPath(); ctx.arc(x, y, r + ((t / 1600) % 1) * 22, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = sel ? "#f5c76a" : hov ? "#bff6ff" : "#3fe3ff";
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = "#03101f"; ctx.font = "700 11px 'Exo 2', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(b.empresarios ?? b.empresas ?? ""), x, y + 0.5);
          ctx.font = "600 12px Inter, sans-serif"; ctx.textBaseline = "top";
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(3,8,23,.85)"; ctx.strokeText(b.nome, x, y + r + 6);
          ctx.fillStyle = "#fff"; ctx.fillText(b.nome, x, y + r + 6);
          if (ehDoUsuario(b)) {
            const py = y - r - 30 - 3 * Math.sin(t / 400);
            ctx.fillStyle = "#f5c76a"; ctx.shadowColor = "#f5c76a"; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.moveTo(x, y - r - 4); ctx.lineTo(x - 7, py + 10); ctx.lineTo(x + 7, py + 10); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 26, py - 11, 52, 22, 11) : ctx.rect(x - 26, py - 11, 52, 22); ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = "#1a1206"; ctx.font = "800 11px 'Exo 2', sans-serif"; ctx.textBaseline = "middle"; ctx.fillText("VOCÊ", x, py + 0.5);
          }
          // empresários orbitando o bairro selecionado
          if (sel && dados.empresarios.length) {
            dados.empresarios.forEach((pe, i) => {
              const ang = t / 2200 + (i / dados.empresarios.length) * Math.PI * 2, rr = r + 42;
              const ox = x + Math.cos(ang) * rr, oy = y + Math.sin(ang) * rr * 0.6;
              ctx.strokeStyle = "rgba(245,199,106,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ox, oy); ctx.stroke();
              const g = ctx.createLinearGradient(ox - 14, oy - 14, ox + 14, oy + 14); g.addColorStop(0, "#3b82ff"); g.addColorStop(1, "#8b5cff");
              ctx.fillStyle = g; ctx.shadowColor = "#8b5cff"; ctx.shadowBlur = 14;
              ctx.beginPath(); ctx.arc(ox, oy, 14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
              ctx.fillStyle = "#fff"; ctx.font = "700 10px 'Exo 2', sans-serif"; ctx.textBaseline = "middle";
              ctx.fillText(iniciais(pe.nome), ox, oy + 0.5);
            });
          }
        });
      }

      // empresas reais do Google Maps (posição exata)
      if ((st.nivel === "cidade" || st.nivel === "bairro") && dados.google.length) {
        dados.google.forEach((g, i) => {
          if (g.lat == null) return;
          const [x, y, c] = proj(g.lng, g.lat);
          if (c <= 0 || x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
          const salto = reduz ? 0 : 2 * Math.sin(t / 300 + i);
          ctx.fillStyle = "#fff"; ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(x, y - 10 + salto, 7, Math.PI, 0); ctx.lineTo(x, y + salto); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = "#3b82ff"; ctx.beginPath(); ctx.arc(x, y - 10 + salto, 3, 0, Math.PI * 2); ctx.fill();
        });
      }

      // brilho da borda do planeta
      if (globoInteiro) {
        ctx.strokeStyle = "rgba(120,220,255,.55)"; ctx.lineWidth = 1.5; ctx.shadowColor = "#3fe3ff"; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(cx, cy, cam.R, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      }
      if (!lua.atras) desenharLua(t);
    }

    /* ---------- laço ---------- */
    let rodando = true;
    // [UI kit] qualquer interação ou voo religa o laço, mesmo que o observer o tenha pausado
    const acordar = () => { if (!rodando) { rodando = true; requestAnimationFrame(laco); } sujo = true; };
    raiz.__acordar = acordar;
    function laco(t) {
      if (!rodando) return;
      // [UI kit] elemento desmontado (React esvaziou a div) ou sem área: não desenha
      if (!cv.isConnected) { rodando = false; return; }
      // sem área conhecida: remede (o ResizeObserver pode ter disparado enquanto o elemento estava oculto)
      if (!(W > 0 && H > 0)) redimensionar();
      if (!(W > 0 && H > 0) || !isFinite(cam.R)) { requestAnimationFrame(laco); return; }
      if (anim) anim(t);
      if (inercia) {
        const dt = 16, f = Math.pow(0.92, (t - inercia.t) / 16);
        if (f < 0.02) inercia = null;
        else { cam.lon -= inercia.x * dt * f; cam.lat = clamp(cam.lat + inercia.y * dt * f, -85, 85); sujo = true; }
      }
      if (st.nivel === "terra" && !giro && !anim && !reduz && t - ultimaInteracao > 4000) giro = true;
      if (giro && st.nivel === "terra" && !arr) { cam.lon += 0.06; sujo = true; }
      if (st.nivel === "terra" && !reduz) lua.ang += 0.0025;
      if (Math.abs(lua.alvoK - lua.k) > 0.001) { lua.k = reduz ? lua.alvoK : lua.k + (lua.alvoK - lua.k) * 0.06; sujo = true; } else lua.k = lua.alvoK;
      // animações contínuas (pulso, órbitas) só quando há o que animar
      const vivo = !reduz && st.nivel !== "brasil";
      if (sujo || vivo) { desenhar(t); sujo = false; raiz.dispatchEvent(new CustomEvent("globo:quadro")); }
      requestAnimationFrame(laco);
    }

    function redimensionar() {
      const r = cv.getBoundingClientRect();
      const antigoMin = Math.min(W, H) || 1;
      W = r.width; H = r.height; DPR = Math.min(devicePixelRatio || 1, 2);
      // [UI kit] sem área (troca de página, aba oculta): mantém o último raio válido e espera
      if (!(W > 0 && H > 0)) { W = 0; H = 0; return; }
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      // se o globo nasceu sem altura (layout ainda calculando), o raio começa do zero: recalcula
      if (antigoMin <= 1 || cam.R < 1) { if (Math.min(W, H) > 0 && st.nivel === "terra") cam.R = Math.min(W, H) * 0.42; }
      else cam.R = cam.R * (Math.min(W, H) / antigoMin);
      if (!isFinite(cam.R) || cam.R < 1) cam.R = Math.min(W, H) * 0.42;
      sujo = true;
    }
    new ResizeObserver(() => { redimensionar(); }).observe(cv);
    // pausa quando fora da tela
    // [UI kit] só pausa se o elemento realmente não tiver área: dentro de um
    // preview embutido o IntersectionObserver reporta ratio 0 mesmo visível, e o
    // laço nunca voltava a rodar. Em navegador normal o comportamento é o mesmo.
    new IntersectionObserver(([en]) => {
      const r = raiz.getBoundingClientRect();
      const v = en.isIntersecting || (r.width > 0 && r.height > 0);
      if (v && !rodando) { rodando = true; requestAnimationFrame(laco); } else if (!v) rodando = false;
    }).observe(raiz);

    redimensionar();
    cam.R = Math.min(W, H) * 0.42;
    atualizarUI();
    contagensBrasil();
    requestAnimationFrame(laco);

    const destruir = () => { rodando = false; };
    // [UI kit] projeção pública: lon/lat → px na tela do canvas (null quando atrás do globo)
    const projetar = (lon, lat) => { prep(); const [x, y, cosc] = proj(lon, lat); return cosc > 0 ? { x, y, R: cam.R } : null; };
    const bairroAtual = () => (st.nivel === "bairro" && st.bairro ? { lat: st.bairro.lat, lng: st.bairro.lng, nome: st.bairro.nome } : null);
    const api = { irBrasil, irTerra, irEstado, voltar, definirUsuario, irEnderecoDoUsuario, irEndereco, destruir, projetar, bairroAtual };
    raiz.globo = api;
    return api;
  }

  window.BabelGlobo = { criar };
})();
