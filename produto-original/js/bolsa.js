/* Bolsa de Valores — cotações da B3 via rota local /api/bolsa (HG Brasil Finance v2).
   A chave HGBRASIL_KEY fica no servidor. Atualiza a cada 15 s com pregão aberto e 60 s fechado.
   Sem chave no servidor e com o modo demonstração ligado, usa cotações FICTÍCIAS, sinalizadas na tela. */
(function () {
  "use strict";
  if (document.body.dataset.page !== "bolsa") return;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  const pct = (n) => (n == null ? "—" : `${n > 0 ? "+" : ""}${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
  const compacto = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 }));
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ler = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const PADRAO = ["B3:PETR4", "B3:VALE3", "B3:ITUB4", "B3:BBDC4", "B3:ABEV3", "B3:B3SA3", "B3:WEGE3", "B3:BBAS3", "B3:GGBR4", "B3:MGLU3", "B3:RENT3", "B3:SUZB3"];
  let tickers = ler("babel.bolsa.tickers", PADRAO);
  let ordem = ler("babel.bolsa.ordem", "variacao");
  let ativos = [];
  let fonte = "api";
  let timer = null;
  // histórico da sessão para os minigráficos (fica só nesta aba)
  const historico = (() => { try { return JSON.parse(sessionStorage.getItem("babel.bolsa.hist")) || {}; } catch (e) { return {}; } })();
  const anteriores = {};

  /* ---------- demonstração (fictícia) ---------- */
  const BASE_DEMO = { PETR4: ["Petrobras", 48.95, "Petróleo, Gás e Biocombustíveis"], VALE3: ["Vale", 77.98, "Materiais Básicos"], ITUB4: ["Itaú Unibanco", 42.62, "Financeiro"], BBDC4: ["Bradesco", 16.29, "Financeiro"], ABEV3: ["Ambev", 15.6, "Consumo não Cíclico"], B3SA3: ["B3", 12.44, "Financeiro"], WEGE3: ["WEG", 38.2, "Bens Industriais"], BBAS3: ["Banco do Brasil", 27.4, "Financeiro"], GGBR4: ["Gerdau", 22.38, "Materiais Básicos"], MGLU3: ["Magazine Luiza", 9.8, "Consumo Cíclico"], RENT3: ["Localiza", 44.1, "Consumo Cíclico"], SUZB3: ["Suzano", 55.3, "Materiais Básicos"] };
  const estadoDemo = {};
  function cotacoesDemo(lista) {
    return lista.map((t) => {
      const sym = t.split(":")[1];
      const [nome, base, setor] = BASE_DEMO[sym] || [sym, 20 + (sym.charCodeAt(0) % 30), "—"];
      const s = (estadoDemo[t] ||= { v: base * (1 + (Math.random() - 0.5) * 0.02), abertura: base, alta: base, baixa: base, vol: 1e6 + Math.random() * 3e7 });
      s.v = Math.max(0.5, s.v * (1 + (Math.random() - 0.5) * 0.004));
      s.alta = Math.max(s.alta, s.v); s.baixa = Math.min(s.baixa, s.v); s.vol += Math.random() * 2e5;
      return {
        ticker: t, symbol: sym, name: nome, kind: "stock", currency: "BRL", classification: { sector: setor },
        quote: { value: s.v, change_value: s.v - base, change_percent: ((s.v - base) / base) * 100, market_cap: s.v * 4e9, updated_at: new Date().toISOString() },
        market: { is_open: true, previous_value: base, open: s.abertura, high: s.alta, low: s.baixa, volume: Math.round(s.vol) },
        dividends: { yield_12m_percent: 3 + (sym.charCodeAt(1) % 7) },
      };
    });
  }

  /* ---------- dados ---------- */
  async function carregar() {
    let dados = null, erro = null;
    try {
      const r = await fetch(`/api/bolsa?tickers=${encodeURIComponent(tickers.join(","))}`);
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(corpo.erro || `HTTP ${r.status}`), { status: r.status });
      dados = corpo;
      fonte = "api";
    } catch (e) {
      erro = e;
      let demo = true;
      try { demo = !localStorage.getItem("babel.api") && localStorage.getItem("babel.demo") !== "0"; } catch (x) {}
      if (demo) { dados = cotacoesDemo(tickers); fonte = "demo"; }
    }
    if (!dados) return renderErro(erro);
    ativos = dados;
    const agora = Date.now();
    ativos.forEach((a) => {
      const h = (historico[a.ticker] ||= []);
      if (!h.length || agora - h[h.length - 1][0] > 4000) h.push([agora, a.quote.value]);
      if (h.length > 120) h.splice(0, h.length - 120);
    });
    try { sessionStorage.setItem("babel.bolsa.hist", JSON.stringify(historico)); } catch (e) {}
    render();
    ativos.forEach((a) => (anteriores[a.ticker] = a.quote.value));
    agendar();
  }
  function agendar() {
    clearTimeout(timer);
    const aberto = ativos.some((a) => a.market?.is_open);
    timer = setTimeout(carregar, document.hidden ? 120000 : aberto ? 15000 : 60000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) carregar(); });

  /* ---------- componentes ---------- */
  const variacaoClasse = (n) => (n > 0 ? "is-alta" : n < 0 ? "is-baixa" : "is-neutro");
  const seta = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "■");
  function logo(a, tam = 28) {
    const ini = esc((a.symbol || "?").slice(0, 2));
    return a.logos?.square_small
      ? `<span class="hg-bolsa-logo" style="width:${tam}px;height:${tam}px"><img src="${esc(a.logos.square_small)}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${ini}'))"></span>`
      : `<span class="hg-bolsa-logo" style="width:${tam}px;height:${tam}px">${ini}</span>`;
  }
  function sparkline(ticker, classe) {
    const h = historico[ticker] || [];
    if (h.length < 2) return `<svg class="hg-bolsa-spark" viewBox="0 0 120 36" aria-hidden="true"><line x1="0" y1="18" x2="120" y2="18" stroke="rgba(120,170,255,.25)" stroke-dasharray="3 4"/></svg>`;
    const vs = h.map((p) => p[1]), min = Math.min(...vs), max = Math.max(...vs), amp = max - min || 1;
    const pts = vs.map((v, i) => `${((i / (vs.length - 1)) * 120).toFixed(1)},${(32 - ((v - min) / amp) * 28).toFixed(1)}`).join(" ");
    return `<svg class="hg-bolsa-spark ${classe}" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,36 ${pts} 120,36" class="area"/><polyline points="${pts}" class="linha"/></svg>`;
  }
  function faixa(a) {
    const { low, high } = a.market || {};
    if (low == null || high == null || high <= low) return "";
    const p = Math.max(0, Math.min(100, ((a.quote.value - low) / (high - low)) * 100));
    return `<div class="hg-bolsa-faixa" title="Mínima e máxima do dia"><span>${brl(low)}</span><div><i style="left:${p}%"></i></div><span>${brl(high)}</span></div>`;
  }
  const flash = (a) => { const ant = anteriores[a.ticker]; return ant == null || ant === a.quote.value ? "" : a.quote.value > ant ? " is-sobe" : " is-desce"; };

  /* ---------- render ---------- */
  function render() {
    // letreiro (carrossel): conteúdo duplicado para rolagem infinita
    const itens = ativos.map((a) => `<button class="hg-tape-item${flash(a)}" data-ticker="${esc(a.ticker)}">${logo(a, 22)}<b>${esc(a.symbol)}</b><span>${brl(a.quote.value)}</span><em class="${variacaoClasse(a.quote.change_percent)}">${seta(a.quote.change_percent)} ${pct(a.quote.change_percent)}</em></button>`).join("");
    const trilha = $("#tape-trilha");
    trilha.innerHTML = itens + `<span aria-hidden="true" class="hg-tape-dup">${itens}</span>`;
    trilha.style.setProperty("--dur", `${Math.max(20, ativos.length * 5)}s`);

    // status do pregão
    const aberto = ativos.some((a) => a.market?.is_open);
    const atualizado = ativos.map((a) => a.quote.updated_at).filter(Boolean).sort().pop();
    $("#pregao").className = `hg-bolsa-pregao ${aberto ? "is-aberto" : ""}`;
    $("#pregao").innerHTML = `<i></i>${aberto ? "Pregão aberto" : "Pregão fechado"}`;
    $("#atualizado").textContent = atualizado ? `Atualizado às ${new Date(atualizado).toLocaleTimeString("pt-BR")} · próxima em ${aberto ? 15 : 60}s` : "";
    $("#aviso-fonte").hidden = fonte !== "demo";

    // destaques
    const porVar = ativos.slice().sort((a, b) => b.quote.change_percent - a.quote.change_percent);
    const altas = ativos.filter((a) => a.quote.change_percent > 0).length, baixas = ativos.filter((a) => a.quote.change_percent < 0).length;
    const volume = ativos.reduce((s, a) => s + (a.market?.volume || 0), 0);
    const kpi = (rot, val, sub, cls = "") => `<article class="hg-panel hg-kpi"><div class="hg-head"><span class="hg-kpi-label">${rot}</span></div><div class="hg-glow-num ${cls}" style="font-size:1.9rem">${val}</div><div class="hg-kpi-foot">${sub}</div></article>`;
    $("#destaques").innerHTML =
      kpi("Maior alta", esc(porVar[0]?.symbol || "—"), porVar[0] ? `<b>${pct(porVar[0].quote.change_percent)}</b> · ${brl(porVar[0].quote.value)}` : "")
      + kpi("Maior baixa", esc(porVar[porVar.length - 1]?.symbol || "—"), porVar.length ? `<b class="is-down">${pct(porVar[porVar.length - 1].quote.change_percent)}</b> · ${brl(porVar[porVar.length - 1].quote.value)}` : "")
      + kpi("Volume da lista", compacto(volume), "ações negociadas hoje")
      + `<article class="hg-panel hg-kpi"><div class="hg-head"><span class="hg-kpi-label">Sentimento</span></div><div class="hg-bolsa-sentimento"><b class="is-alta">${altas}</b> em alta · <b class="is-baixa">${baixas}</b> em baixa</div><div class="hg-bolsa-barra"><i style="width:${ativos.length ? (altas / ativos.length) * 100 : 0}%"></i></div></article>`;

    // lista em vidro: linhas vivas que pulsam em verde/vermelho
    const ordenado = ativos.slice().sort((a, b) =>
      ordem === "valor" ? b.quote.value - a.quote.value : ordem === "volume" ? (b.market?.volume || 0) - (a.market?.volume || 0) : ordem === "nome" ? a.symbol.localeCompare(b.symbol) : b.quote.change_percent - a.quote.change_percent);
    const maxAbs = Math.max(0.01, ...ativos.map((a) => Math.abs(a.quote.change_percent || 0)));
    $("#cards").innerHTML = ordenado.map((a, i) => {
      const cls = variacaoClasse(a.quote.change_percent);
      const forca = Math.min(1, Math.abs(a.quote.change_percent || 0) / maxAbs);
      return `<article class="hg-bolsa-linha ${cls}${flash(a)}" role="listitem" data-ticker="${esc(a.ticker)}" tabindex="0" style="--i:${i};--forca:${forca.toFixed(2)}">
        <div class="hg-bolsa-ativo">${logo(a, 36)}<div><strong>${esc(a.symbol)}<i class="hg-live" title="Ao vivo"></i></strong><span>${esc(a.name)}</span></div></div>
        <div class="hg-bolsa-preco">${brl(a.quote.value)}<small>${a.quote.change_value > 0 ? "+" : ""}${brl(a.quote.change_value)}</small></div>
        <div class="hg-bolsa-pill ${cls}">${seta(a.quote.change_percent)} ${pct(a.quote.change_percent)}</div>
        <div class="hg-bolsa-sessao">${sparkline(a.ticker, cls)}</div>
        <div class="hg-bolsa-mm">${faixa(a) || "<span class='hg-sub'>—</span>"}</div>
        <div class="hg-bolsa-vol"><span>Volume</span><b>${compacto(a.market?.volume)}</b></div>
        <button class="hg-x" data-remover="${esc(a.ticker)}" aria-label="Remover ${esc(a.symbol)} da lista">✕</button>
      </article>`;
    }).join("");
  }

  function renderErro(erro) {
    $("#tape-trilha").innerHTML = `<span class="hg-tape-vazio">Cotações indisponíveis</span>`;
    $("#destaques").innerHTML = "";
    $("#cards").innerHTML = `<div class="hg-empty" style="grid-column:1/-1"><span class="hg-empty-ico">${window.BabelIcones?.alerta || ""}</span><strong>Não foi possível carregar as cotações</strong><span>${esc(erro?.status === 503 ? "Defina HGBRASIL_KEY no servidor e reinicie-o." : erro?.message || "Erro desconhecido.")}</span></div>`;
    agendar();
  }

  /* ---------- detalhes do ativo ---------- */
  function abrirDetalhe(ticker) {
    const a = ativos.find((x) => x.ticker === ticker);
    if (!a) return;
    let d = $(".hg-drawer.is-bolsa");
    if (!d) {
      d = document.createElement("aside");
      d.className = "hg-drawer is-bolsa";
      d.setAttribute("aria-label", "Detalhes do ativo");
      document.body.appendChild(d);
      d.addEventListener("click", (e) => e.target.closest("[data-fechar]") && d.classList.remove("is-open"));
      document.addEventListener("keydown", (e) => e.key === "Escape" && d.classList.remove("is-open"));
    }
    const cls = variacaoClasse(a.quote.change_percent);
    const linha = (r, v) => `<div><span>${r}</span><b>${v}</b></div>`;
    d.innerHTML = `<div class="hg-head"><div style="display:flex;gap:.7rem;align-items:center">${logo(a, 42)}<div><h2 class="hg-title">${esc(a.symbol)}</h2><p class="hg-sub">${esc(a.full_name || a.name)}</p></div></div><button class="hg-x" data-fechar aria-label="Fechar">✕</button></div>
      <div class="hg-bolsa-valor" style="font-size:2.4rem">${brl(a.quote.value)}</div>
      <div class="hg-bolsa-var ${cls}" style="margin-bottom:1rem">${seta(a.quote.change_percent)} ${pct(a.quote.change_percent)} <small>${brl(a.quote.change_value)} hoje</small></div>
      ${sparkline(a.ticker, cls).replace('class="hg-bolsa-spark', 'style="height:90px" class="hg-bolsa-spark')}
      ${faixa(a)}
      <div class="hg-bolsa-detalhes">
        ${linha("Abertura", brl(a.market?.open))}${linha("Fechamento anterior", brl(a.market?.previous_value))}
        ${linha("Máxima", brl(a.market?.high))}${linha("Mínima", brl(a.market?.low))}
        ${linha("Volume", compacto(a.market?.volume))}${linha("Valor de mercado", compacto(a.quote.market_cap))}
        ${linha("Dividend yield 12m", a.dividends?.yield_12m_percent != null ? pct(a.dividends.yield_12m_percent).replace("+", "") : "—")}${linha("Setor", esc(a.classification?.sector || "—"))}
      </div>
      <p class="hg-sub" style="margin-top:1rem">${esc(a.ticker)} · ${fonte === "demo" ? "cotação fictícia (demonstração)" : "fonte: HG Brasil / B3"}</p>`;
    d.classList.add("is-open");
  }

  /* ---------- interações ---------- */
  document.addEventListener("click", (e) => {
    const rem = e.target.closest("[data-remover]");
    if (rem) { e.stopPropagation(); tickers = tickers.filter((t) => t !== rem.dataset.remover); gravar("babel.bolsa.tickers", tickers); ativos = ativos.filter((a) => a.ticker !== rem.dataset.remover); render(); return; }
    const alvo = e.target.closest("[data-ticker]");
    if (alvo) abrirDetalhe(alvo.dataset.ticker);
  });
  document.addEventListener("keydown", (e) => { const c = e.target.closest?.(".hg-bolsa-linha"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirDetalhe(c.dataset.ticker); } });
  $("#form-ticker").addEventListener("submit", (e) => {
    e.preventDefault();
    const campo = $("#novo-ticker");
    const novos = campo.value.toUpperCase().split(/[\s,;]+/).filter(Boolean).map((t) => (t.includes(":") ? t : `B3:${t}`)).filter((t) => /^[A-Z0-9]{1,10}:[A-Z0-9.]{1,20}$/.test(t));
    if (!novos.length) return;
    tickers = [...new Set([...tickers, ...novos])].slice(0, 40);
    gravar("babel.bolsa.tickers", tickers);
    campo.value = "";
    carregar();
  });
  $("#ordem").value = ordem;
  $("#ordem").addEventListener("change", (e) => { ordem = e.target.value; gravar("babel.bolsa.ordem", ordem); render(); });
  $("#restaurar").addEventListener("click", () => { tickers = PADRAO.slice(); gravar("babel.bolsa.tickers", tickers); carregar(); });
  if (reduz) $("#tape-trilha").classList.add("is-parado");

  carregar();
})();
