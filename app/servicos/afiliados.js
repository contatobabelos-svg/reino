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
    /* logado, vai com o token da conta: cada afiliado só lê os cliques e cadastros do próprio código (RLS) */
    const C = window.ReinoContas;
    const tk = C && C.token ? await C.token().catch(() => null) : null;
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/" + tabela + (query ? "?" + query : ""), {
      method: metodo, headers: { apikey: c.anon, Authorization: "Bearer " + (tk || c.anon), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (!r.ok) throw new Error("Supabase " + r.status + " " + (await r.text()));
    return metodo === "GET" ? r.json() : null; /* gravações não pedem a linha de volta: o e-mail de cadastros não é legível para o público */
  }

  /* ---------- localização do visitante: NÃO fazemos mais ----------
     C12 do Parecer 1 (LGPD). Até 21/09/2026 este arquivo mandava o navegador de CADA visitante
     chamar https://ipwho.is/ só para gravar cidade/UF no clique. Isso entrega o IP do titular
     (dado pessoal) a um terceiro, sem aviso, sem base legal escrita e sem contrato — por uma
     informação que o próprio cadastro pergunta duas telas depois. A chamada saiu.
     Consequência: `cliques.cidade` e `cliques.uf` nascem nulos; a tela "Meus acessos" já omite o
     que é nulo (AcessosScreen.jsx usa filter(Boolean)) e o mapa usa a cidade do CADASTRO, que a
     pessoa digita. Quem precisar de lugar no clique, pergunte — não deduza pelo IP. */
  async function geo() { return null; }
  try { sessionStorage.removeItem("reino.geo"); } catch (e) {} /* apaga o que ficou de antes */

  /* ---------- clique ---------- */
  let visitaId = sessionStorage.getItem("reino.visitaId") || "";
  async function registrarClique() {
    const codigo = codigoDaUrl(); if (!codigo) return null;
    sessionStorage.setItem("reino.ref", codigo);
    localStorage.setItem("reino.indicadoPor", codigo);
    if (visitaId) return codigo;                       // já contou nesta sessão
    visitaId = uuid(); sessionStorage.setItem("reino.visitaId", visitaId);
    /* sem cidade/UF: o clique guarda só o que o próprio pedido já diz (C12 do Parecer 1) */
    const linha = { id: visitaId, codigo, dispositivo: dispositivo(), origem: document.referrer || null, criado_em: agora(), cadastrou: false };
    const local = () => { const d = ler(); (d.cliques = d.cliques || []).push(linha); gravar(d); };
    if (!CFG()) local();
    else try { await sb("cliques", "POST", linha); }
    catch (e) { console.warn("[afiliados] clique não enviado, guardando local:", e.message); local(); }
    // limpa a URL (/r/x → /) sem recarregar, para o app rotear normalmente
    if (location.pathname.includes("/r/")) history.replaceState(null, "", location.pathname.replace(/\/r\/[^/]+\/?$/, "/") + location.hash);
    return codigo;
  }

  /* ---------- cadastro ----------
     C6 do Parecer 1: a linha de `cadastros` NÃO é mais inserida pelo navegador. Ela era
     forjável por qualquer pessoa com a chave publicável (que é pública por natureza) e é dela
     que saem o ranking de afiliados e a comissão. Agora quem grava é a Edge Function
     `reino-cadastro`, com a chave de serviço, depois que o Auth criou a conta de verdade.
     O que o navegador faz é só entregar o contexto da visita (contexto(), abaixo) para o
     servidor e, quando não há Supabase configurado, manter o registro local do painel. */
  function contexto() {
    return {
      codigo: sessionStorage.getItem("reino.ref") || localStorage.getItem("reino.indicadoPor") || PADRAO(),
      visitaId: visitaId || sessionStorage.getItem("reino.visitaId") || "",
      dispositivo: dispositivo(),
    };
  }
  async function registrarCadastro({ nome, email, titulo, cidade, uf }) {
    const c = contexto();
    const linha ={ id: uuid(), codigo: c.codigo, visita_id: c.visitaId || null, nome, email: email || null, titulo: titulo || null, cidade: cidade || null, uf: uf || null, dispositivo: c.dispositivo, criado_em: agora() };
    /* sem banco, o painel de demonstração continua funcionando pelo armazenamento local */
    if (!CFG()) { const d = ler(); (d.cadastros = d.cadastros || []).push(linha); (d.cliques || []).forEach((x) => { if (x.id === c.visitaId) x.cadastrou = true; }); gravar(d); }
    return linha;
  }

  /* ---------- meu link ---------- */
  function meuCodigo(nome) {
    /* Com conta logada o código é DESTA conta: o nome vem da sessão (não do perfil de demonstração
       que algumas telas ainda passam) e o código guardado no navegador só vale se for dela — sem
       isso, quem entra com outra conta no mesmo navegador herdaria o link de indicação da anterior. */
    const C = window.ReinoContas;
    const s = C && C.sessao ? C.sessao() : null;
    const dono = s && s.id ? String(s.id) : "";
    if (dono) nome = String(s.nome || "").trim() || (s.email ? String(s.email).split("@")[0] : nome);
    // o código escolhido em "Minha conta" tem prioridade
    let c = localStorage.getItem("reino.meuCodigo");
    if (c && dono && localStorage.getItem("reino.meuCodigo.dono") !== dono) c = null;
    if (!c) { c = slug(nome); localStorage.setItem("reino.meuCodigo", c); }
    if (dono) localStorage.setItem("reino.meuCodigo.dono", dono);
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
        ranking = await sb("rpc/ranking_afiliados", "GET", null, "order=cadastros.desc&limit=10");
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

  /* ranking do Reino: a função do banco só devolve código e total de cadastros. null = sem banco ou falha */
  async function ranking(limite) {
    try {
      if (!CFG()) return null;
      return await sb("rpc/ranking_afiliados", "GET", null, "order=cadastros.desc&limit=" + (limite || 5));
    } catch (e) { console.warn("[afiliados] ranking falhou:", e.message); return null; }
  }

  window.ReinoAfiliados = { ranking, codigoDaUrl, ehPadrao, registrarClique, registrarCadastro, contexto, meuCodigo, linkDe, linkCurtoDe, painel, geo, COMISSAO, PCT, configurado: () => !!CFG() };
  registrarClique();
})();
