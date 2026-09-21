/* Reino · Afiliados — rastreio real de indicações.
   Link: https://<dominio>/r/<codigo>  (também aceita ?ref=<codigo>)
   Grava no Supabase (REST) quando configurado em window.REINO_SUPABASE; sem
   configuração, guarda no navegador (localStorage) para o painel funcionar.

   Configuração (cole no index.html antes deste arquivo):
     window.REINO_SUPABASE = { url: "https://xxxx.supabase.co", anon: "eyJ..." };

   Tabelas (SQL em afiliados.sql). */
(function () {
  // só considera configurado quando há URL e chave anon
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const LS = "reino.afiliados";
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  const agora = () => new Date().toISOString();
  const dispositivo = () => (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "celular" : "computador");

  /* ---------- código do link ---------- */
  /* Sem ?ref= na URL, a visita é atribuída ao afiliado padrão (o administrador),
     para nenhum cadastro ficar órfão. Troque com window.REINO_AFILIADO_PADRAO. */
  const PADRAO = () => String(window.REINO_AFILIADO_PADRAO || "marcelo").toLowerCase();
  function codigoDaUrl() {
    const m = location.pathname.match(/\/r\/([A-Za-z0-9_-]{2,40})\/?$/);
    if (m) return m[1].toLowerCase();
    const q = new URLSearchParams(location.search).get("ref");
    if (q) return String(q).trim().toLowerCase();
    return sessionStorage.getItem("reino.ref") || localStorage.getItem("reino.indicadoPor") || PADRAO();
  }
  /* o código padrão da casa vale para a atribuição, mas não é "indicação" de ninguém na tela */
  const ehPadrao = (c) => !!c && String(c).toLowerCase() === PADRAO();
  const slug = (nome) => String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "reino";
  const dominio = () => (window.REINO_DOMINIO || location.origin);
  /* O formato bonito /r/<codigo> exige reescrita no servidor (vercel.json). Sem
     ela o link daria 404, então o padrão é ?ref=<codigo>, que funciona em
     qualquer hospedagem. Ative o /r/ com window.REINO_ROTA_R = true. */
  const linkDe = (codigo) => dominio().replace(/\/$/, "") + (window.REINO_ROTA_R === true ? "/r/" + codigo : "/?ref=" + codigo);
  const linkCurtoDe = (codigo) => dominio().replace(/\/$/, "") + "/r/" + codigo;

  /* ---------- armazenamento local (fallback) ---------- */
  const ler = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } };
  const gravar = (d) => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} };

  /* ---------- Supabase REST ---------- */
  async function sb(tabela, metodo, corpo, query) {
    const c = CFG(); if (!c) return null;
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/" + tabela + (query ? "?" + query : ""), {
      method: metodo, headers: { apikey: c.anon, Authorization: "Bearer " + c.anon, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (!r.ok) throw new Error("Supabase " + r.status + " " + (await r.text()));
    return metodo === "GET" ? r.json() : null; /* gravações não pedem a linha de volta: o e-mail de cadastros não é legível para o público */
  }

  /* ---------- localização real (cidade/UF por IP) ----------
     O Osiris (/api/geo) não libera acesso de outros sites, então usamos o
     ipwho.is, que permite e devolve cidade, UF e coordenadas sem chave. */
  let geoCache = null;
  try { geoCache = JSON.parse(sessionStorage.getItem("reino.geo") || "null"); } catch (e) {}
  async function geo() {
    if (geoCache) return geoCache;
    try {
      const r = await fetch("https://ipwho.is/");
      const j = await r.json();
      if (!j || j.success === false) return null;
      geoCache = { cidade: j.city || null, uf: j.region_code || null, estado: j.region || null, lat: j.latitude, lng: j.longitude, pais: j.country_code || null };
      try { sessionStorage.setItem("reino.geo", JSON.stringify(geoCache)); } catch (e) {}
      return geoCache;
    } catch (e) { return null; }
  }

  /* ---------- clique ---------- */
  let visitaId = sessionStorage.getItem("reino.visitaId") || "";
  async function registrarClique() {
    const codigo = codigoDaUrl(); if (!codigo) return null;
    sessionStorage.setItem("reino.ref", codigo);
    localStorage.setItem("reino.indicadoPor", codigo);
    if (visitaId) return codigo;                       // já contou nesta sessão
    visitaId = uuid(); sessionStorage.setItem("reino.visitaId", visitaId);
    const g = await geo();
    const linha = { id: visitaId, codigo, dispositivo: dispositivo(), origem: document.referrer || null, criado_em: agora(), cadastrou: false };
    if (g) { linha.cidade = g.cidade; linha.uf = g.uf; }
    const local = () => { const d = ler(); (d.cliques = d.cliques || []).push(linha); gravar(d); };
    if (!CFG()) local();
    else try { await sb("cliques", "POST", linha); }
    catch (e) {
      // banco antigo (sem as colunas cidade/uf): grava sem elas
      try { const { cidade, uf, ...base } = linha; await sb("cliques", "POST", base); }
      catch (e2) { console.warn("[afiliados] clique não enviado, guardando local:", e2.message); local(); }
    }
    // limpa a URL (/r/x → /) sem recarregar, para o app rotear normalmente
    if (location.pathname.includes("/r/")) history.replaceState(null, "", location.pathname.replace(/\/r\/[^/]+\/?$/, "/") + location.hash);
    return codigo;
  }

  /* ---------- cadastro ---------- */
  async function registrarCadastro({ nome, email, titulo, cidade, uf }) {
    const codigo = sessionStorage.getItem("reino.ref") || localStorage.getItem("reino.indicadoPor") || PADRAO();
    if (!cidade || !uf) { const g = await geo(); if (g) { cidade = cidade || g.cidade; uf = uf || g.uf; } }
    const linha = { id: uuid(), codigo, visita_id: visitaId || null, nome, email: email || null, titulo: titulo || null, cidade: cidade || null, uf: uf || null, dispositivo: dispositivo(), criado_em: agora() };
    const local = () => { const d = ler(); (d.cadastros = d.cadastros || []).push(linha); (d.cliques || []).forEach((c) => { if (c.id === visitaId) c.cadastrou = true; }); gravar(d); };
    if (!CFG()) local(); else try {
      await sb("cadastros", "POST", linha);
      if (visitaId) await sb("cliques", "PATCH", { cadastrou: true }, "id=eq." + visitaId);
    } catch (e) { console.warn("[afiliados] cadastro não enviado, guardando local:", e.message); local(); }
    return linha;
  }

  /* ---------- meu link ---------- */
  function meuCodigo(nome) {
    // o código escolhido em "Minha conta" tem prioridade
    let c = localStorage.getItem("reino.meuCodigo");
    if (!c) { c = slug(nome); localStorage.setItem("reino.meuCodigo", c); }
    return c;
  }

  /* ---------- painel: indicados de um código ---------- */
  const COMISSAO = { Imperador: 997, Rei: 497, "Príncipe": 247, Duque: 97, "Marquês": 77, Conde: 67, Visconde: 57, "Barão": 47 };
  const PCT = 0.3; // 30% da primeira mensalidade
  async function painel(codigo) {
    let cliques = [], cadastros = [], ranking = [];
    try {
      if (CFG()) {
        cliques = await sb("cliques", "GET", null, "codigo=eq." + encodeURIComponent(codigo) + "&order=criado_em.desc&limit=500");
        cadastros = await sb("cadastros", "GET", null, "select=id,codigo,nome,titulo,cidade,uf,criado_em&codigo=eq." + encodeURIComponent(codigo) + "&order=criado_em.desc&limit=500");
        ranking = await sb("ranking_afiliados", "GET", null, "order=cadastros.desc&limit=10");
      }
    } catch (e) { console.warn("[afiliados] leitura falhou:", e.message); }
    const d = ler();
    cliques = cliques.concat((d.cliques || []).filter((x) => x.codigo === codigo));
    cadastros = cadastros.concat((d.cadastros || []).filter((x) => x.codigo === codigo));
    const comissao = cadastros.reduce((s, c) => s + (COMISSAO[c.titulo] || 0) * PCT, 0);
    // últimos 14 dias
    const dias = Array.from({ length: 14 }, (_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - (13 - i)); return dt.toISOString().slice(0, 10); });
    const porDia = dias.map((dia) => ({ dia, cliques: cliques.filter((c) => (c.criado_em || "").slice(0, 10) === dia).length, cadastros: cadastros.filter((c) => (c.criado_em || "").slice(0, 10) === dia).length }));
    return { codigo, link: linkDe(codigo), linkCurto: linkCurtoDe(codigo), rotaR: window.REINO_ROTA_R === true, cliques, cadastros, comissao, porDia, ranking, online: !!CFG() };
  }

  window.ReinoAfiliados = { codigoDaUrl, ehPadrao, registrarClique, registrarCadastro, meuCodigo, linkDe, linkCurtoDe, painel, geo, COMISSAO, PCT, configurado: () => !!CFG() };
  registrarClique();
})();
