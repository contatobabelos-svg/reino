/* Babel OS · Reino — lógica das páginas.
   Nenhum dado embutido: tudo vem da API configurada em Configurações
   (localStorage "babel.api"). Sem API, cada widget mostra um estado vazio.
   Contrato dos endpoints e mapeamento para as tabelas reino_*: app/API.md */
(function () {
  "use strict";

  const I = window.BabelIcones || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const num = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const CORES = ["#3fe3ff", "#3b82ff", "#8b5cff", "#e04bff", "#34e6a6", "#f5c76a"];

  /* ======================== Dados ======================== */
  const ler = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
  const API = ler("babel.api").replace(/\/+$/, "");

  /** { estado: "sem-api" } | { estado: "ok", dados } | { estado: "erro", erro } */
  const DEMO = !API && ler("babel.demo") !== "0" && typeof window.BabelDemo === "function";
  async function buscar(recurso, params) {
    if (!API) return DEMO ? { estado: "ok", dados: window.BabelDemo(recurso, params) } : { estado: "sem-api" };
    const url = new URL(`${API}/${recurso}`);
    if (params) Object.entries(params).forEach(([k, v]) => v !== "" && v != null && url.searchParams.set(k, v));
    try {
      const token = ler("babel.token");
      const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { estado: "ok", dados: await r.json() };
    } catch (erro) {
      return { estado: "erro", erro };
    }
  }
  const lista = (res) => (res.estado === "ok" && Array.isArray(res.dados) && res.dados.length ? res.dados : null);
  const obj = (res) => (res.estado === "ok" && res.dados && typeof res.dados === "object" ? res.dados : null);

  /* ======================== Componentes ======================== */
  function vazio(res, { icone = "plug", titulo, texto } = {}) {
    let t = titulo, d = texto, ic = icone;
    if (res && res.estado === "sem-api") {
      d = 'Conecte a API em <a href="configuracoes.html">Configurações</a> para preencher este painel.';
    } else if (res && res.estado === "erro") {
      t = "Não foi possível carregar";
      d = `A API respondeu com erro (${esc(res.erro.message)}).`;
      ic = "alerta";
    }
    return `<div class="hg-empty"><span class="hg-empty-ico">${I[ic] || ""}</span><strong>${t || "Nada por aqui ainda"}</strong><span>${d || ""}</span></div>`;
  }

  function toast(msg) {
    let t = $(".hg-toast");
    if (!t) { t = document.createElement("div"); t.className = "hg-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = msg;
    requestAnimationFrame(() => t.classList.add("is-on"));
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-on"), 3400);
  }

  function contar(el, alvo, casas = 0) {
    if (reduz) { el.textContent = num(alvo, casas); return; }
    const t0 = performance.now();
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / 1200);
      el.textContent = num(alvo * (1 - Math.pow(1 - k, 3)), casas);
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  const iniciais = (nome) => String(nome || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  const estrelas = (n) => `<span class="hg-stars" aria-label="${num(n, 1)} de 5">${"★".repeat(Math.round(n))}<i>${"★".repeat(5 - Math.round(n))}</i></span>`;
  const barras = (el) => requestAnimationFrame(() => requestAnimationFrame(() => $$("[data-w]", el).forEach((b) => (b.style.width = b.dataset.w + "%"))));
  const metrica = (nome, rotulo, pct, cor) =>
    `<div class="hg-metric"><div class="hg-metric-row">${esc(nome)} <b>${esc(rotulo)}</b></div><div class="hg-bar"><i data-w="${Math.max(0, Math.min(100, Number(pct) || 0))}"${cor ? ` style="background:${cor};box-shadow:0 0 10px ${cor}"` : ""}></i></div></div>`;

  function linhaSVG(pontos, rotulos) {
    const w = 400, h = 180, pl = 30, pb = 22, pt = 12;
    const max = Math.max(...pontos, 1) * 1.15;
    const x = (i) => pl + (i * (w - pl - 10)) / Math.max(pontos.length - 1, 1);
    const y = (v) => pt + (h - pt - pb) * (1 - v / max);
    const d = pontos.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Série temporal">
      <defs><linearGradient id="la" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82ff" stop-opacity=".55"/><stop offset="1" stop-color="#3b82ff" stop-opacity="0"/></linearGradient></defs>
      ${[0, 1, 2, 3].map((k) => `<line x1="${pl}" x2="${w - 10}" y1="${pt + k * (h - pt - pb) / 3}" y2="${pt + k * (h - pt - pb) / 3}" stroke="rgba(80,140,255,.12)" stroke-dasharray="3"/>`).join("")}
      <path d="${d}L${x(pontos.length - 1)} ${h - pb}L${pl} ${h - pb}Z" fill="url(#la)"/>
      <path d="${d}" fill="none" stroke="#4aa3ff" stroke-width="2.5" style="filter:drop-shadow(0 0 5px #3fe3ff)"/>
      ${pontos.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#bfe9ff" stroke="#3b82ff" stroke-width="2"><title>${esc(rotulos?.[i])}: ${num(v)}</title></circle>`).join("")}
      ${(rotulos || []).map((r, i) => `<text x="${x(i)}" y="${h - 4}" fill="#8fa6d6" font-size="11" text-anchor="middle">${esc(r)}</text>`).join("")}
    </svg>`;
  }

  /* Anel de progresso: define arco (0–1) e texto central */
  function anel(arco, frac) {
    arco.style.strokeDashoffset = 314.16 * (1 - Math.max(0, Math.min(1, frac)));
  }

  /* ======================== Shell ======================== */
  $("[data-hg-menu]")?.addEventListener("click", () => $(".hg-app").classList.toggle("is-menu"));
  $$("[data-hg-drawer]").forEach((b) => b.addEventListener("click", () => abrirDrawer(b.dataset.hgDrawer)));
  async function abrirDrawer(tipo) {
    let d = $(".hg-drawer:not(.is-widgets)");
    if (!d) {
      d = document.createElement("aside");
      d.className = "hg-drawer";
      document.body.appendChild(d);
      document.addEventListener("keydown", (e) => e.key === "Escape" && d.classList.remove("is-open"));
    }
    const titulo = tipo === "mensagens" ? "Mensagens" : "Notificações";
    d.innerHTML = `<div class="hg-head"><h2 class="hg-title">${titulo}</h2><button class="hg-x" aria-label="Fechar">${I.x}</button></div><div data-corpo></div>`;
    $(".hg-x", d).onclick = () => d.classList.remove("is-open");
    d.classList.add("is-open");
    const res = await buscar(tipo);
    const itens = lista(res);
    $("[data-corpo]", d).innerHTML = itens
      ? `<ul class="hg-list">${itens.map((n) => `<li class="hg-row"><span class="hg-avatar">${esc(iniciais(n.autor || titulo))}</span><div><strong>${esc(n.titulo)}</strong><span>${esc(n.texto)}</span></div><time>${esc(n.quando)}</time></li>`).join("")}</ul>`
      : vazio(res, { icone: tipo === "mensagens" ? "msg" : "sino", titulo: `Nenhuma ${tipo === "mensagens" ? "mensagem" : "notificação"}`, texto: "Tudo em dia." });
  }
  $("#hg-busca")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) location.href = `pesquisa.html?q=${encodeURIComponent(e.target.value.trim())}`;
  });
  /* ======================== Widgets ========================
     Mesmo modelo do desktop do Babel OS (DESKTOP_WIDGETS + widgets_ativos):
     cada painel [data-widget] fica numa zona [data-zona]; o usuário liga/desliga,
     arrasta entre zonas compatíveis e reordena. Layout salvo por página em
     localStorage e, com API, sincronizado em GET/PUT /preferencias. */
  const Widgets = (() => {
    const zonas = $$("[data-zona]");
    const todos = $$("[data-widget]");
    if (!zonas.length || !todos.length) return null;
    const pagina = document.body.dataset.page;
    const chave = `babel.widgets.v2.${pagina}`;
    const porId = Object.fromEntries(todos.map((w) => [w.dataset.widget, w]));
    const padrao = { ativos: todos.map((w) => w.dataset.widget), layout: Object.fromEntries(zonas.map((z) => [z.dataset.zona, $$(":scope > [data-widget]", z).map((w) => w.dataset.widget)])) };
    let estado;
    try { estado = JSON.parse(localStorage.getItem(chave)) || padrao; } catch (e) { estado = padrao; }

    const zona = (nome) => zonas.find((z) => z.dataset.zona === nome);
    const aceita = (z, w) => (z.dataset.aceita || "").split(" ").includes(w.dataset.grupo);

    function aplicar() {
      // widgets novos (ainda não salvos) entram na zona padrão
      const conhecidos = new Set(Object.values(estado.layout).flat());
      Object.entries(padrao.layout).forEach(([z, ids]) => ids.forEach((id) => {
        if (!conhecidos.has(id)) { (estado.layout[z] ||= []).push(id); if (!estado.ativos.includes(id)) estado.ativos.push(id); }
      }));
      Object.entries(estado.layout).forEach(([z, ids]) => {
        const alvo = zona(z);
        if (!alvo) return;
        ids.forEach((id) => porId[id] && aceita(alvo, porId[id]) && alvo.appendChild(porId[id]));
      });
      todos.forEach((w) => {
        const on = estado.ativos.includes(w.dataset.widget);
        w.hidden = !on;
        w.classList.remove("is-hidden");
      });
      zonas.forEach((z) => z.classList.toggle("is-vazia", !$$(":scope > [data-widget]:not([hidden])", z).length));
      window.dispatchEvent(new Event("resize"));
    }

    function salvar() {
      estado.layout = Object.fromEntries(zonas.map((z) => [z.dataset.zona, $$(":scope > [data-widget]", z).map((w) => w.dataset.widget)]));
      try { localStorage.setItem(chave, JSON.stringify(estado)); } catch (e) {}
      if (API) {
        clearTimeout(salvar._t);
        salvar._t = setTimeout(() => fetch(`${API}/preferencias`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(ler("babel.token") ? { Authorization: `Bearer ${ler("babel.token")}` } : {}) },
          body: JSON.stringify({ pagina, widgets_ativos: estado.ativos, widgets_layout: estado.layout }),
        }).catch(() => {}), 400);
      }
    }

    function alternar(id, on) {
      estado.ativos = on ? [...new Set([...estado.ativos, id])] : estado.ativos.filter((x) => x !== id);
      aplicar(); salvar(); desenharCatalogo();
    }

    // Arrastar pela barra de título (mouse); no toque, use ↑ ↓ no catálogo
    let arrastando = null;
    todos.forEach((w) => {
      const alca = $(".hg-head", w) || w;
      alca.classList.add("hg-alca");
      alca.addEventListener("pointerdown", (e) => { if (!e.target.closest("button, a, select, input")) w.draggable = true; });
      w.addEventListener("dragstart", (e) => {
        arrastando = w;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", w.dataset.widget);
        requestAnimationFrame(() => { w.classList.add("is-arrastando"); document.body.classList.add("is-arrastando-widget"); zonas.forEach((z) => z.classList.toggle("is-alvo", aceita(z, w))); });
      });
      w.addEventListener("dragend", () => {
        w.draggable = false;
        w.classList.remove("is-arrastando");
        document.body.classList.remove("is-arrastando-widget");
        zonas.forEach((z) => z.classList.remove("is-alvo"));
        arrastando = null;
        zonas.forEach((z) => z.classList.toggle("is-vazia", !$$(":scope > [data-widget]:not([hidden])", z).length));
        salvar();
        window.dispatchEvent(new Event("resize"));
      });
    });
    zonas.forEach((z) => {
      z.addEventListener("dragover", (e) => {
        if (!arrastando || !aceita(z, arrastando)) return;
        e.preventDefault();
        const irmaos = $$(":scope > [data-widget]:not(.is-arrastando):not([hidden])", z);
        const horizontal = getComputedStyle(z).gridTemplateColumns.split(" ").length > 1;
        const depois = irmaos.find((s) => {
          const r = s.getBoundingClientRect();
          return horizontal ? e.clientX < r.left + r.width / 2 && e.clientY < r.bottom : e.clientY < r.top + r.height / 2;
        });
        if (depois) z.insertBefore(arrastando, depois); else z.appendChild(arrastando);
      });
      z.addEventListener("drop", (e) => e.preventDefault());
    });

    // Catálogo
    function desenharCatalogo() {
      const d = $(".hg-drawer.is-widgets");
      if (!d) return;
      $("[data-corpo]", d).innerHTML = zonas.map((z) => {
        const ws = $$(":scope > [data-widget]", z);
        if (!ws.length) return "";
        return `<p class="hg-sub" style="margin:1rem 0 .4rem;text-transform:uppercase;letter-spacing:.08em">${esc(z.dataset.rotulo || z.dataset.zona)}</p>` + ws.map((w, i) => `
          <div class="hg-cat${estado.ativos.includes(w.dataset.widget) ? " is-on" : ""}">
            <div><strong>${esc(w.dataset.titulo)}</strong><span>${esc(w.dataset.descricao || "")}</span></div>
            <div class="hg-cat-acoes">
              <button class="hg-x" data-mover="${w.dataset.widget}" data-dir="-1" aria-label="Mover ${esc(w.dataset.titulo)} para cima" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="hg-x" data-mover="${w.dataset.widget}" data-dir="1" aria-label="Mover ${esc(w.dataset.titulo)} para baixo" ${i === ws.length - 1 ? "disabled" : ""}>↓</button>
              <label class="hg-switch" style="border:0;padding:0"><span class="sr-only">Mostrar ${esc(w.dataset.titulo)}</span><input type="checkbox" data-ligar="${w.dataset.widget}" ${estado.ativos.includes(w.dataset.widget) ? "checked" : ""}></label>
            </div>
          </div>`).join("");
      }).join("") + `<button class="hg-btn is-ghost is-block" style="margin-top:1.2rem" data-restaurar>Restaurar padrão</button>`;
    }
    function abrirCatalogo() {
      let d = $(".hg-drawer.is-widgets");
      if (!d) {
        d = document.createElement("aside");
        d.className = "hg-drawer is-widgets";
        d.setAttribute("aria-label", "Personalizar widgets");
        d.innerHTML = `<div class="hg-head"><div><h2 class="hg-title">Widgets</h2><p class="hg-sub">Ligue, desligue e reordene. Arraste pela barra de título.</p></div><button class="hg-x" data-fechar aria-label="Fechar">${I.x}</button></div><div data-corpo style="overflow:auto;max-height:calc(100vh - 110px)"></div>`;
        document.body.appendChild(d);
        d.addEventListener("click", (e) => {
          if (e.target.closest("[data-fechar]")) d.classList.remove("is-open");
          const m = e.target.closest("[data-mover]");
          if (m) {
            const w = porId[m.dataset.mover];
            const irmao = m.dataset.dir === "1" ? w.nextElementSibling : w.previousElementSibling;
            if (irmao?.dataset.widget) m.dataset.dir === "1" ? irmao.after(w) : irmao.before(w);
            salvar(); desenharCatalogo(); window.dispatchEvent(new Event("resize"));
          }
          if (e.target.closest("[data-restaurar]")) { estado = JSON.parse(JSON.stringify(padrao)); aplicar(); salvar(); desenharCatalogo(); }
        });
        d.addEventListener("change", (e) => e.target.dataset.ligar && alternar(e.target.dataset.ligar, e.target.checked));
        document.addEventListener("keydown", (e) => e.key === "Escape" && d.classList.remove("is-open"));
      }
      desenharCatalogo();
      d.classList.add("is-open");
    }
    $$("[data-hg-widgets]").forEach((b) => b.addEventListener("click", abrirCatalogo));

    // Preferências do servidor têm prioridade quando existem
    buscar("preferencias", { pagina }).then((r) => {
      const p = obj(r);
      if (p && Array.isArray(p.widgets_ativos) && p.widgets_layout) { estado = { ativos: p.widgets_ativos, layout: p.widgets_layout }; aplicar(); }
    });

    aplicar();
    return { alternar };
  })();

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-close]");
    if (b) {
      const w = b.closest("[data-widget]") || b.closest(".hg-panel");
      w.classList.add("is-hidden");
      setTimeout(() => (Widgets && w.dataset.widget ? Widgets.alternar(w.dataset.widget, false) : (w.hidden = true)), 300);
      toast(`Widget oculto. Reative em <b>Personalizar</b>.`);
      return;
    }
    const a = e.target.closest("[data-acao]");
    if (a) toast(API ? "Ação pronta para ligar ao endpoint POST correspondente (veja API.md)." : 'Conecte a API em <a href="configuracoes.html">Configurações</a> para publicar e cadastrar.');
  });

  /* Título do usuário no cabeçalho (vem de /perfil) */
  /* ======================== Hook de login ========================
     aoLogar(cb) chama cb(perfil, { novo }) assim que houver usuário logado.
     `novo` é true só no primeiro carregamento da sessão (ou após salvar Configurações),
     para efeitos de "chegada" — como o globo voar até o bairro — não se repetirem a cada página. */
  const Sessao = (() => {
    const ouvintes = new Set();
    let atual = null, novo = false;
    return {
      aoLogar(cb) { ouvintes.add(cb); if (atual) cb(atual, { novo }); return () => ouvintes.delete(cb); },
      logar(perfil) {
        const chave = `${perfil.nome || ""}|${perfil.uf || ""}|${perfil.cidade || ""}|${perfil.bairro || ""}`;
        try { novo = sessionStorage.getItem("babel.sessao") !== chave; sessionStorage.setItem("babel.sessao", chave); } catch (e) { novo = true; }
        atual = perfil;
        ouvintes.forEach((cb) => cb(perfil, { novo }));
      },
      get usuario() { return atual; },
    };
  })();
  window.BabelSessao = Sessao;

  // Endereço informado em Configurações tem prioridade (útil sem API)
  function enderecoLocal() { try { return JSON.parse(localStorage.getItem("babel.endereco") || "null"); } catch (e) { return null; } }
  buscar("perfil").then((r) => {
    const p = obj(r);
    const end = enderecoLocal();
    if (!p && !end) return;
    const perfil = { ...(p || {}), ...(end || {}) };
    if (perfil.titulo) $$("[data-hg-titulo]").forEach((el) => (el.textContent = perfil.titulo));
    Sessao.logar(perfil);
  });

  /* Rotas do servidor local (chaves ficam no servidor): mesmo envelope de buscar() */
  async function buscarLocal(rota, params) {
    const url = new URL(rota, location.origin);
    Object.entries(params || {}).forEach(([k, v]) => v != null && v !== "" && url.searchParams.set(k, v));
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { estado: "ok", dados: await r.json() };
    } catch (erro) { return { estado: "erro", erro }; }
  }

  /* ======================== Blocos reutilizáveis ======================== */
  /* Globo digital (js/globo.js): Terra → Brasil → Estado → Cidade → Bairro → Empresários */
  function blocoMapa() {
    const el = $("#globo");
    if (!el || !window.BabelGlobo) return;
    const climaCache = {};
    const clima = (cidade, uf) => (climaCache[`${cidade},${uf}`] ||= buscarLocal("/api/clima", { cidade: `${cidade},${uf}` }).then((r) => (r.estado === "ok" ? r.dados : null)));
    const empresasGoogle = async (q) => {
      const r = await fetch(`/api/empresas-google?q=${encodeURIComponent(q)}`).catch(() => null);
      if (!r) return { estado: "erro", mensagem: "Servidor local indisponível." };
      const corpo = await r.json().catch(() => ({}));
      return r.ok ? { estado: "ok", dados: corpo } : { estado: "erro", status: r.status, mensagem: corpo.erro };
    };
    const globo = window.BabelGlobo.criar(el, { buscar, esc, num, estrelas, iniciais, clima, empresasGoogle, imersivo: el.dataset.imersivo === "1" });
    // hook: ao logar, o globo marca o usuário e voa até o bairro dele
    Sessao.aoLogar((perfil, { novo }) => {
      globo.definirUsuario(perfil);
      if (novo && perfil.uf && perfil.cidade) setTimeout(() => globo.irEnderecoDoUsuario(), 900);
    });
  }

  async function blocoFeed(alvo, limite) {
    const res = await buscar("social/feed", { limite });
    const posts = lista(res);
    $(alvo).innerHTML = posts
      ? `<ul class="hg-list">${posts.map((p) => `<li class="hg-post"><span class="hg-avatar">${esc(iniciais(p.autor))}</span><div><strong>${esc(p.autor)}</strong><span class="hg-post-meta">${esc(p.empresa || "")}${p.quando ? " · " + esc(p.quando) : ""}</span><p>${esc(p.texto)}</p><span class="hg-post-meta">♥ ${num(p.curtidas || 0)} · 💬 ${num(p.comentarios || 0)}</span></div></li>`).join("")}</ul>`
      : vazio(res, { icone: "social", titulo: "Nenhuma publicação ainda", texto: "Publicações das empresas e membros do Reino aparecem aqui." });
  }

  async function blocoAfiliado() {
    const el = $("#afiliado");
    if (!el) return;
    const res = await buscar("afiliado");
    const a = obj(res);
    const campo = $("[data-afiliado-link]", el);
    const btn = $("[data-copiar]", el);
    const aviso = $("[data-afiliado-aviso]", el);
    if (a && a.link) {
      campo.value = a.link;
      btn.disabled = false;
      $("[data-afiliado-indicados]", el).textContent = num(a.indicados ?? 0);
      $("[data-afiliado-comissoes]", el).textContent = `R$ ${num(a.comissoesPendentes ?? 0, 2)}`;
      aviso.textContent = "";
    } else {
      campo.value = "—";
      btn.disabled = true;
      aviso.innerHTML = res.estado === "erro" ? "Erro ao carregar o link." : res.estado === "sem-api" ? 'Conecte a <a href="configuracoes.html">API</a> para ver seu link.' : "Link indisponível.";
    }
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(campo.value); toast("🔗 Link de afiliado copiado."); }
      catch (e) { campo.select(); toast("Selecionei o link — use Ctrl+C para copiar."); }
    });
  }

  async function blocoMatch(alvo, limite) {
    const res = await buscar("reino/match", { limite });
    const m = lista(res);
    $(alvo).innerHTML = m
      ? `<ul class="hg-list">${m.map((x) => `<li class="hg-row"><span class="hg-avatar" style="background:linear-gradient(135deg,#8b5cff,#e04bff)">${esc(iniciais(x.nome))}</span><div><strong>${esc(x.nome)}</strong><span>${esc(x.nicho)} · ${esc(x.cidade)}</span></div>${x.compatibilidade != null ? `<b class="hg-pill">${num(x.compatibilidade)}%</b>` : ""}</li>`).join("")}</ul>`
      : vazio(res, { icone: "match", titulo: "Nenhum match no momento", texto: "Empresas de nichos complementares, próximas de você, aparecem aqui." });
  }

  async function blocoConquistas() {
    const res = await buscar("conquistas/resumo");
    const c = obj(res);
    const txt = $("#anel-txt");
    if (c && c.progresso != null) {
      anel($("#anel-arco"), c.progresso / 100);
      contar(txt, c.progresso);
      txt.dataset.suf = "%";
      txt.classList.remove("is-empty");
      $("#anel-rotulo").textContent = c.proximoTitulo ? `rumo a ${c.proximoTitulo}` : "Progresso";
      $("#metricas").innerHTML = (c.metricas || []).map((m, i) => metrica(m.nome, m.rotulo, m.percentual, i === 0 ? "linear-gradient(90deg,#e0a33c,#f5c76a)" : "")).join("")
        + (c.tituloAtual ? `<p class="hg-sub" style="margin:0 0 .8rem">Título atual: <b class="hg-gold">${esc(c.tituloAtual)}</b></p>` : "");
      barras($("#metricas"));
    } else {
      $("#metricas").innerHTML = ["Avaliações feitas", "Empresas cadastradas", "Conexões de match"].map((n) => metrica(n, "—", 0)).join("")
        + (res.estado === "sem-api" ? "" : vazio(res, { icone: "trofeu", titulo: "Nenhuma conquista ainda" }));
    }
  }

  async function blocoReputacao() {
    const res = await buscar("reino/reputacao");
    const r = obj(res);
    const el = $("#reputacao");
    if (r && r.total) {
      const dist = [5, 4, 3, 2, 1].map((e) => ({ e, q: (r.distribuicao || []).find((d) => Number(d.estrelas) === e)?.quantidade || 0 }));
      const frac = Number(r.media) / 5;
      el.innerHTML = `<div class="hg-rep">
        <div class="hg-ring hg-ring-sm"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(80,140,255,.14)" stroke-width="10"/><circle class="hg-ring-arc" id="rep-arco" cx="60" cy="60" r="50" fill="none" stroke="url(#rg-gold)" stroke-width="10" stroke-linecap="round" stroke-dasharray="314.16" stroke-dashoffset="314.16"/></svg>
          <div class="hg-ring-val"><span class="hg-glow-num hg-gold-glow">${num(r.media, 1)}</span><span>${num(r.total)} avaliações</span></div></div>
        <div>${dist.map((d) => metrica(`${d.e} ★`, num(d.q), (d.q / r.total) * 100, "linear-gradient(90deg,#e0a33c,#f5c76a)")).join("")}</div>
      </div>`;
      requestAnimationFrame(() => anel($("#rep-arco"), frac));
      barras(el);
    } else {
      el.innerHTML = vazio(res, { icone: "estrela", titulo: "Sem avaliações ainda", texto: "O score é a média das estrelas que as empresas recebem no Reino." });
    }
  }

  /* ======================== Modo espacial: tela cheia + música ========================
     Entrar em tela cheia toca a trilha (com fade); sair pausa. Play/pausa sempre visível.
     No iPhone (sem Fullscreen API para páginas) usa "modo cinema", que esconde toda a interface. */
  function modoEspacialComMusica() {
    const I2 = {
      cheia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
      sair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
      pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
    };
    const barra = document.createElement("div");
    barra.className = "hg-som";
    barra.innerHTML = `
      <button class="hg-som-cheia" type="button" aria-label="Entrar em tela cheia com música">${I2.cheia}<span>Tela cheia</span></button>
      <button class="hg-som-play" type="button" aria-label="Tocar música" aria-pressed="false">${I2.play}</button>
      <div class="hg-som-info" aria-hidden="true"><b>Ameno</b><small>Era</small></div>
      <div class="hg-som-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
    (document.querySelector(".hg-main") || document.body).appendChild(barra);
    const bCheia = $(".hg-som-cheia", barra), bPlay = $(".hg-som-play", barra), barras = [...barra.querySelectorAll(".hg-som-eq i")];

    const audio = new Audio("audio/ameno.mp3");
    audio.preload = "none";
    audio.loop = true;
    audio.volume = 0;
    let fade = null, ctxAudio = null, analisador = null, amostras = null;

    function volumeAte(alvo, ms, depois) {
      clearInterval(fade);
      const passos = Math.max(1, Math.round(ms / 40)), ini = audio.volume;
      let k = 0;
      fade = setInterval(() => {
        k++;
        audio.volume = Math.max(0, Math.min(1, ini + ((alvo - ini) * k) / passos));
        if (k >= passos) { clearInterval(fade); depois && depois(); }
      }, 40);
    }
    function ligarAnalisador() {
      if (analisador || reduz) return;
      try {
        ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        const fonte = ctxAudio.createMediaElementSource(audio);
        analisador = ctxAudio.createAnalyser();
        analisador.fftSize = 64;
        amostras = new Uint8Array(analisador.frequencyBinCount);
        fonte.connect(analisador); analisador.connect(ctxAudio.destination);
        const pintar = () => {
          if (!audio.paused) {
            analisador.getByteFrequencyData(amostras);
            barras.forEach((b, i) => b.style.setProperty("--h", (0.15 + (amostras[2 + i * 5] / 255) * 0.85).toFixed(2)));
            document.body.style.setProperty("--batida", (amostras[2] / 255).toFixed(2));
          }
          requestAnimationFrame(pintar);
        };
        pintar();
      } catch (e) { analisador = null; }
    }
    async function tocar() {
      ligarAnalisador();
      if (ctxAudio?.state === "suspended") ctxAudio.resume();
      try { await audio.play(); } catch (e) { toast("Não foi possível tocar a música neste navegador."); return; }
      volumeAte(0.85, 1400);
    }
    function pausar() { volumeAte(0, 700, () => audio.pause()); }
    function atualizarBotoes() {
      const tocando = !audio.paused && !audio.ended;
      bPlay.innerHTML = tocando ? I2.pausa : I2.play;
      bPlay.setAttribute("aria-pressed", tocando);
      bPlay.setAttribute("aria-label", tocando ? "Pausar música" : "Tocar música");
      barra.classList.toggle("is-tocando", tocando);
      const cheia = emTelaCheia();
      bCheia.innerHTML = (cheia ? I2.sair : I2.cheia) + `<span>${cheia ? "Sair" : "Tela cheia"}</span>`;
      bCheia.setAttribute("aria-label", cheia ? "Sair da tela cheia" : "Entrar em tela cheia com música");
    }
    ["play", "pause", "ended"].forEach((ev) => audio.addEventListener(ev, atualizarBotoes));

    const emTelaCheia = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.body.classList.contains("is-cinema"));
    async function entrar() {
      const el = document.documentElement;
      const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
      tocar(); // no mesmo clique: navegadores só liberam áudio com gesto do usuário
      if (pedir) { try { await pedir.call(el, { navigationUI: "hide" }); } catch (e) { document.body.classList.add("is-cinema"); } }
      else document.body.classList.add("is-cinema");
      document.body.classList.add("is-tela-cheia");
      atualizarBotoes();
      window.dispatchEvent(new Event("resize"));
    }
    function sair() {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen?.();
      aoSair();
    }
    function aoSair() {
      document.body.classList.remove("is-cinema", "is-tela-cheia");
      pausar();
      atualizarBotoes();
      window.dispatchEvent(new Event("resize"));
    }
    const mudouTelaCheia = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement) aoSair(); else atualizarBotoes(); };
    document.addEventListener("fullscreenchange", mudouTelaCheia);
    document.addEventListener("webkitfullscreenchange", mudouTelaCheia);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("is-cinema")) aoSair(); });

    bCheia.addEventListener("click", () => (emTelaCheia() ? sair() : entrar()));
    bPlay.addEventListener("click", () => (audio.paused ? tocar() : pausar()));

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: "Ameno", artist: "Era", album: "Reino · Modo espacial", artwork: [{ src: "img/icone-512.png", sizes: "512x512", type: "image/png" }] });
      navigator.mediaSession.setActionHandler("play", tocar);
      navigator.mediaSession.setActionHandler("pause", pausar);
    }
    // não deixa música tocando esquecida ao trocar de aba do navegador
    document.addEventListener("visibilitychange", () => { if (document.hidden && !audio.paused && !emTelaCheia()) pausar(); });
    atualizarBotoes();
  }

  /* Celular: globo e widgets são telas deslizantes; os pontos mostram e levam a cada uma */
  function paginacaoDeslizante(trilho) {
    if (!trilho) return;
    const nav = document.createElement("nav");
    nav.className = "hg-paginas";
    nav.setAttribute("aria-label", "Telas do painel");
    trilho.after(nav);
    const telas = () => [...trilho.querySelectorAll(":scope .hg-panel[data-widget]:not([hidden])")].sort((a, b) => (a.classList.contains("hg-globo-panel") ? -1 : b.classList.contains("hg-globo-panel") ? 1 : 0));
    function montar() {
      const lista = telas();
      nav.innerHTML = lista.map((t, i) => `<button type="button" aria-label="${esc(t.dataset.titulo || "Tela " + (i + 1))}" data-i="${i}"></button>`).join("");
      const obs = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.intersectionRatio > 0.6) { const i = lista.indexOf(en.target); nav.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-current", k === i)); }
      }), { root: trilho, threshold: [0.6] });
      lista.forEach((t) => obs.observe(t));
      nav.onclick = (e) => { const b = e.target.closest("button"); if (b) lista[+b.dataset.i].scrollIntoView({ behavior: reduz ? "auto" : "smooth", inline: "center", block: "nearest" }); };
    }
    montar();
  }

  /* ======================== Páginas ======================== */
  const paginas = {
    async inicio() {
      const h = new Date().getHours();
      const nome = (ler("babel.usuario") || obj(await buscar("perfil"))?.nome || "").split(" ")[0];
      $("[data-saudacao]").textContent = `${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}${nome ? ", " + nome : ""}`;

      const kpis = await buscar("reino/kpis");
      $$("[data-kpi]").forEach((card) => {
        const k = obj(kpis)?.[card.dataset.kpi];
        const foot = $(".hg-kpi-foot", card);
        if (k && k.valor != null) {
          $(".hg-glow-num", card).classList.remove("is-empty");
          contar($("[data-v]", card), Number(k.valor), card.dataset.kpi === "notaMedia" ? 1 : 0);
          foot.innerHTML = k.variacao != null ? `<b class="${k.variacao < 0 ? "is-down" : ""}">${k.variacao > 0 ? "+" : ""}${esc(k.variacao)}${esc(k.unidadeVariacao ?? "%")}</b> nos últimos 7 dias` : "&nbsp;";
        } else foot.textContent = kpis.estado === "erro" ? "Erro ao carregar" : kpis.estado === "sem-api" ? "Aguardando dados" : "Sem registros";
      });

      paginacaoDeslizante($(".hg-ops"));
      blocoAfiliado();
      blocoFeed("#feed", 4);
      blocoMapa();
      blocoConquistas();
      blocoMatch("#match", 3);
      blocoReputacao();

      const an = await buscar("reino/analises", { periodo: "mes" });
      const a = obj(an);
      $("#an-tempo").innerHTML = a?.cadastros?.length
        ? `<div class="hg-chart">${linhaSVG(a.cadastros.map((p) => Number(p.valor)), a.cadastros.map((p) => p.rotulo))}</div>`
        : `<div class="hg-chart">${linhaSVG([0, 0, 0, 0, 0, 0, 0], [])}${vazio(an, { icone: "analises", titulo: "Sem cadastros no período" })}</div>`;
      $("#an-nichos").innerHTML = a?.nichos?.length
        ? a.nichos.map((n) => metrica(n.nome, `${num(n.percentual)}%`, n.percentual)).join("")
        : vazio(an, { icone: "vitrine", titulo: "Sem nichos registrados" });
      barras($("#an-nichos"));
    },

    async mapa() {
      blocoMapa();
      modoEspacialComMusica();
    },

    async "pre-cadastro"() {
      const B = window.BRASIL;
      const svg = $("#br-svg");
      if (!B || !svg) return;
      const NS = "http://www.w3.org/2000/svg";
      const REGIOES = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
      const COR_REGIAO = { norte: "#3fe3ff", nordeste: "#f5c76a", "centro-oeste": "#34e6a6", sudeste: "#8b5cff", sul: "#e04bff" };
      const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      // Regra do mapa mental: Imperador → Brasil · Rei → Brasil com regiões · Príncipe → região com estados · Duque pra baixo → estado com cidades
      const nivelDoTitulo = (nome) => ({ imperador: "brasil", rei: "brasil-regioes", principe: "regiao" }[norm(nome)] || "estado");
      const NIVEIS = { brasil: "Mapa do Brasil", "brasil-regioes": "Brasil com regiões", regiao: "Região com estados", estado: "Estado com cidades" };

      /* --- desenha estados --- */
      svg.setAttribute("viewBox", B.viewBox);
      const gUF = $("#br-estados"), gRot = $("#br-rotulos"), gCid = $("#br-cidades");
      B.estados.forEach((e) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", e.d);
        p.setAttribute("class", "hg-uf");
        p.dataset.uf = e.uf;
        p.dataset.regiao = e.regiao;
        p.style.setProperty("--c", COR_REGIAO[e.regiao]);
        const t = document.createElementNS(NS, "title");
        t.textContent = `${e.nome} · ${REGIOES[e.regiao]}`;
        p.appendChild(t);
        gUF.appendChild(p);
      });
      const caixa = (els) => els.map((el) => el.getBBox()).reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.width), y2: Math.max(a.y2, b.y + b.height) }), { x: 1e9, y: 1e9, x2: -1e9, y2: -1e9 });
      const paths = $$(".hg-uf", gUF);
      const total = caixa(paths);

      /* --- estado da tela --- */
      const qs = new URLSearchParams(location.search);
      const st = { titulo: qs.get("titulo") || "", nivel: "estado", regiao: qs.get("regiao") || "sudeste", uf: (qs.get("estado") || "SP").toUpperCase(), cidade: "", nicho: "", dados: null };

      /* --- animação de viewBox --- */
      let vbAtual = B.viewBox.split(" ").map(Number);
      function zoom(bx, pad) {
        const w = bx.x2 - bx.x, h = bx.y2 - bx.y, p = Math.max(w, h) * pad;
        const alvo = [bx.x - p, bx.y - p, w + 2 * p, h + 2 * p];
        const ini = vbAtual.slice(), t0 = performance.now(), dur = reduz ? 0 : 650;
        const passo = (t) => {
          const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
          vbAtual = ini.map((v, i) => v + (alvo[i] - v) * e);
          svg.setAttribute("viewBox", vbAtual.join(" "));
          if (k < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      }

      function rotulo(x, y, texto, sub, cls = "") {
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", `hg-br-rotulo ${cls}`);
        const dy = st.nivel === "regiao" ? 5 : cls.includes("is-grande") ? 18 : 12;
        g.innerHTML = `<text x="${x}" y="${y}">${esc(texto)}</text>${sub != null ? `<text class="sub" x="${x}" y="${y + dy}">${esc(sub)}</text>` : ""}`;
        gRot.appendChild(g);
      }

      // lat/lng → coordenadas do SVG (aproximação linear pela caixa do Brasil continental)
      const LON = [-73.99, -34.79], LAT = [5.27, -33.75];
      const projetar = (lat, lng) => [total.x + ((lng - LON[0]) / (LON[1] - LON[0])) * (total.x2 - total.x), total.y + ((lat - LAT[0]) / (LAT[1] - LAT[0])) * (total.y2 - total.y)];

      function desenhar() {
        const d = st.dados;
        gRot.innerHTML = "";
        gCid.innerHTML = "";
        svg.dataset.nivel = st.nivel;
        const maxUF = Math.max(1, ...Object.values(d?.estados || {}));
        paths.forEach((p) => {
          const naRegiao = p.dataset.regiao === st.regiao, noUF = p.dataset.uf === st.uf;
          const foco = st.nivel === "brasil" || st.nivel === "brasil-regioes" || (st.nivel === "regiao" && naRegiao) || (st.nivel === "estado" && noUF);
          p.classList.toggle("is-foco", foco);
          p.classList.toggle("is-regioes", st.nivel === "brasil-regioes");
          const qtd = d?.estados?.[p.dataset.uf];
          p.style.setProperty("--calor", qtd ? (0.15 + 0.55 * (qtd / maxUF)).toFixed(2) : 0);
        });
        if (st.nivel === "brasil") {
          zoom(total, 0.04);
          rotulo((total.x + total.x2) / 2, (total.y + total.y2) / 2, "BRASIL", d?.total != null ? `${num(d.total)} empresas` : null, "is-grande");
        } else if (st.nivel === "brasil-regioes") {
          zoom(total, 0.04);
          Object.keys(REGIOES).forEach((r) => {
            const bx = caixa(paths.filter((p) => p.dataset.regiao === r));
            rotulo((bx.x + bx.x2) / 2, (bx.y + bx.y2) / 2, REGIOES[r].toUpperCase(), d?.regioes?.[r] != null ? `${num(d.regioes[r])} empresas` : null);
          });
        } else if (st.nivel === "regiao") {
          const doR = paths.filter((p) => p.dataset.regiao === st.regiao);
          zoom(caixa(doR), 0.12);
          doR.forEach((p) => { const bx = caixa([p]); rotulo((bx.x + bx.x2) / 2, (bx.y + bx.y2) / 2, p.dataset.uf, d?.estados?.[p.dataset.uf] != null ? num(d.estados[p.dataset.uf]) : null, "is-uf"); });
        } else {
          const pUF = paths.find((p) => p.dataset.uf === st.uf);
          if (pUF) zoom(caixa([pUF]), 0.15);
          (d?.cidades || []).filter((c) => c.lat != null && c.lng != null).forEach((c) => {
            const [x, y] = projetar(Number(c.lat), Number(c.lng));
            const g = document.createElementNS(NS, "g");
            g.setAttribute("class", `hg-br-cidade${norm(c.nome) === norm(st.cidade) ? " is-ativa" : ""}`);
            g.innerHTML = `<circle cx="${x}" cy="${y}" r="2.6"/><text x="${x}" y="${y - 4.5}">${esc(c.nome)}${c.empresas != null ? ` · ${num(c.empresas)}` : ""}</text>`;
            g.addEventListener("click", () => { st.cidade = c.nome; $("#f-cidade").value = c.nome; atualizarResumo(); desenhar(); });
            gCid.appendChild(g);
          });
        }
        $("#nivel-chip").textContent = NIVEIS[st.nivel];
        atualizarFiltros();
        atualizarResumo();
      }

      /* --- filtros --- */
      const fReg = $("#f-regiao"), fUF = $("#f-estado"), fCid = $("#f-cidade"), fNicho = $("#f-nicho");
      fReg.innerHTML = Object.entries(REGIOES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
      function opcoesUF() {
        const lst = B.estados.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        fUF.innerHTML = lst.map((e) => `<option value="${e.uf}">${esc(e.nome)}</option>`).join("");
      }
      opcoesUF();
      function atualizarFiltros() {
        fReg.value = st.regiao;
        fUF.value = st.uf;
        $("#campo-regiao").hidden = st.nivel !== "regiao";
        $("#campo-estado").hidden = st.nivel !== "estado";
        $("#campo-cidade").hidden = st.nivel !== "estado";
        const cids = (st.dados?.cidades || []).map((c) => c.nome);
        fCid.innerHTML = `<option value="">${cids.length ? "Escolha a cidade" : "Sem cidades carregadas"}</option>` + cids.map((c) => `<option>${esc(c)}</option>`).join("");
        fCid.value = st.cidade;
      }
      fReg.addEventListener("change", () => { st.regiao = fReg.value; carregar(); });
      fUF.addEventListener("change", () => { st.uf = fUF.value; st.regiao = B.estados.find((e) => e.uf === st.uf).regiao; st.cidade = ""; carregar(); });
      fCid.addEventListener("change", () => { st.cidade = fCid.value; desenhar(); });
      fNicho.addEventListener("change", () => { st.nicho = fNicho.value; carregar(); });
      gUF.addEventListener("click", (e) => {
        const p = e.target.closest(".hg-uf");
        if (!p) return;
        if (st.nivel === "regiao") { st.regiao = p.dataset.regiao; carregar(); }
        if (st.nivel === "estado") { st.uf = p.dataset.uf; st.regiao = p.dataset.regiao; st.cidade = ""; carregar(); }
      });

      /* --- títulos (níveis) --- */
      const titRes = await buscar("reino/titulos");
      const titulos = lista(titRes);
      const opcoesTit = titulos
        ? titulos.map((t) => ({ nome: t.nome, nivel: nivelDoTitulo(t.nome), preco: t.mensalidade }))
        : [{ nome: "Imperador", nivel: "brasil" }, { nome: "Rei", nivel: "brasil-regioes" }, { nome: "Príncipe", nivel: "regiao" }, { nome: "Duque ou abaixo", nivel: "estado" }];
      const escolhido = opcoesTit.find((t) => norm(t.nome) === norm(st.titulo)) || opcoesTit[opcoesTit.length - 1];
      st.titulo = escolhido.nome;
      st.nivel = escolhido.nivel;
      $("#titulos-nivel").innerHTML = opcoesTit.map((t) => `<button type="button" class="hg-titulo-chip" role="radio" aria-checked="${t.nome === st.titulo}" data-titulo="${esc(t.nome)}" data-nivel="${t.nivel}">
          <b>${esc(t.nome)}</b><span>${NIVEIS[t.nivel]}</span>${t.preco != null ? `<small>R$ ${num(t.preco, 2)}/mês</small>` : ""}</button>`).join("");
      $("#titulos-nivel").addEventListener("click", (e) => {
        const b = e.target.closest("[data-titulo]");
        if (!b) return;
        $$("[data-titulo]", e.currentTarget).forEach((x) => x.setAttribute("aria-checked", x === b));
        st.titulo = b.dataset.titulo;
        st.nivel = b.dataset.nivel;
        carregar();
      });

      const filtros = obj(await buscar("reino/filtros"));
      fNicho.innerHTML = `<option value="">Todos os nichos</option>` + (filtros?.nichos || []).map((n) => `<option>${esc(n.nome ?? n)}</option>`).join("");

      /* --- dados do mapa --- */
      async function carregar() {
        const res = await buscar("reino/mapa", { nivel: st.nivel, regiao: st.regiao, estado: st.uf, nicho: st.nicho });
        st.dados = obj(res);
        $("#mapa-aviso").innerHTML = st.dados ? "" : res.estado === "sem-api"
          ? 'Mostrando só o contorno. Conecte a <a href="configuracoes.html">API</a> para ver empresas por região, estado e cidade.'
          : res.estado === "erro" ? "Não foi possível carregar as empresas do mapa." : "";
        desenhar();
      }

      function territorio() {
        if (st.nivel === "brasil" || st.nivel === "brasil-regioes") return "Brasil";
        if (st.nivel === "regiao") return `Região ${REGIOES[st.regiao]}`;
        const e = B.estados.find((x) => x.uf === st.uf);
        return st.cidade ? `${st.cidade} · ${e.nome}` : e.nome;
      }
      function atualizarResumo() {
        $("#resumo-titulo").textContent = st.titulo;
        $("#resumo-territorio").textContent = territorio();
        const params = new URLSearchParams();
        if (qs.get("ref")) params.set("ref", qs.get("ref"));
        params.set("titulo", st.titulo);
        params.set("territorio", st.nivel === "regiao" ? st.regiao : st.nivel === "estado" ? [st.uf, st.cidade].filter(Boolean).join(":") : "BR");
        $("#continuar").href = `https://www.babel-os.com/cadastro?${params}`;
        const precisaCidade = st.nivel === "estado" && (st.dados?.cidades || []).length && !st.cidade;
        $("#continuar").classList.toggle("is-pendente", !!precisaCidade);
        $("#resumo-dica").textContent = precisaCidade ? "Escolha a cidade no mapa ou nos filtros." : "";
      }

      /* --- link de afiliado (quem indicou) --- */
      const ref = qs.get("ref");
      const campo = $("[data-afiliado-link]");
      const btn = $("[data-copiar]");
      if (ref) {
        campo.value = `https://www.babel-os.com/cadastro?ref=${ref}`;
        btn.disabled = false;
        const r = obj(await buscar("afiliado/resolver", { ref }));
        $("[data-afiliado-aviso]").innerHTML = r?.nome ? `Você foi indicado por <b>${esc(r.nome)}</b>.` : "Indicação registrada — ela segue junto no cadastro.";
      } else {
        campo.value = "—";
        $("[data-afiliado-aviso]").textContent = "Sem indicação. Você pode continuar mesmo assim.";
      }
      btn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(campo.value); toast("🔗 Link de afiliado copiado."); } catch (e) { campo.select(); }
      });

      /* --- opções do mapa (abas) --- */
      const abas = $$("[data-aba]");
      async function abrirAba(nome) {
        abas.forEach((a) => a.setAttribute("aria-selected", a.dataset.aba === nome));
        $$("[data-painel]").forEach((p) => (p.hidden = p.dataset.painel !== nome));
        if (nome === "noticias" && !$("#noticias").dataset.ok) {
          const res = await buscar("noticias", { temas: "afiliados,financas" });
          const n = lista(res);
          $("#noticias").dataset.ok = 1;
          $("#noticias").innerHTML = n
            ? `<ul class="hg-list">${n.map((x) => `<li class="hg-post"><span class="hg-avatar" style="background:linear-gradient(135deg,#1fcf8f,#3b82ff)">${x.tema === "financas" ? "R$" : "%"}</span><div><strong>${esc(x.titulo)}</strong><span class="hg-post-meta">${esc([x.fonte, x.data].filter(Boolean).join(" · "))}</span><p>${esc(x.resumo || "")}</p>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">Ler notícia →</a>` : ""}</div></li>`).join("")}</ul>`
            : vazio(res, { icone: "revista", titulo: "Nenhuma notícia agora", texto: "Notícias sobre afiliados e finanças aparecem aqui." });
        }
        if (nome === "busca") $("#busca-q").focus();
      }
      abas.forEach((a) => a.addEventListener("click", () => abrirAba(a.dataset.aba)));
      $("#form-busca").addEventListener("submit", async (e) => {
        e.preventDefault();
        const q = $("#busca-q").value.trim();
        if (!q) return;
        $("#busca-res").innerHTML = `<p class="hg-sub">Buscando…</p>`;
        const res = await buscar("busca-inteligente", { q, regiao: st.regiao, estado: st.uf });
        const r = obj(res);
        $("#busca-res").innerHTML = r
          ? `${r.resposta ? `<div class="hg-busca-resposta">${esc(r.resposta)}</div>` : ""}${(r.empresas || []).length ? `<ul class="hg-list">${r.empresas.map((x) => `<li class="hg-row"><span class="hg-avatar">${esc(iniciais(x.nome))}</span><div><strong>${esc(x.nome)}</strong><span>${esc([x.nicho, x.cidade, x.estado].filter(Boolean).join(" · "))}</span></div>${x.nota != null ? estrelas(x.nota) : ""}</li>`).join("")}</ul>` : ""}`
          : vazio(res, { icone: "busca", titulo: "Sem resultados", texto: "Tente descrever o que procura, ex.: “contador perto de Campinas”." });
      });

      carregar();
    },

    async guildas() {
      const [minha, todas] = await Promise.all([buscar("guildas/minha"), buscar("guildas")]);
      const g = obj(minha);
      $("#minha-guilda").innerHTML = g && g.nome
        ? `<div class="hg-guilda">
            <span class="hg-guilda-brasao">${I.guilda}</span>
            <div><h3 class="hg-title" style="font-size:1.3rem">${esc(g.nome)}</h3><p class="hg-sub">Líder: <b class="hg-gold">${esc(g.lider || "—")}</b></p></div>
            <div class="hg-guilda-pts"><span class="hg-glow-num" style="font-size:1.8rem">${num(g.pontos || 0)}</span><span class="hg-sub">pontos</span></div>
          </div>
          <ul class="hg-list" style="margin-top:1rem">${(g.membros || []).map((m) => `<li class="hg-row"><span class="hg-avatar">${esc(iniciais(m.nome))}</span><div><strong>${esc(m.nome)}</strong><span>${esc(m.titulo || "Membro")}</span></div></li>`).join("")}</ul>`
        : vazio(minha, { icone: "guilda", titulo: "Você ainda não está em uma guilda", texto: "Crie uma guilda ou entre em uma para somar pontos com outras empresas do Reino." });
      const lst = lista(todas);
      $("#explorar-guildas").innerHTML = lst
        ? `<div class="hg-grid-3">${lst.map((x) => `<article class="hg-badge is-on" style="opacity:1;border-color:rgba(63,227,255,.35)"><span class="hg-empty-ico">${I.guilda}</span><strong>${esc(x.nome)}</strong><span>${esc([x.nicho, x.regiao].filter(Boolean).join(" · "))}</span><span>${num(x.membros || 0)} membros · ${num(x.pontos || 0)} pts</span><button class="hg-btn is-ghost" data-acao="entrar-guilda">Entrar</button></article>`).join("")}</div>`
        : vazio(todas, { icone: "guilda", titulo: "Nenhuma guilda criada", texto: "As guildas do Reino aparecem aqui." });
    },

    async "rede-social"() {
      blocoFeed("#feed", 30);
    },

    async match() {
      blocoMatch("#match", 30);
    },

    async conquistas() {
      blocoConquistas();
      const res = await buscar("conquistas");
      const c = lista(res);
      $("#lista-conquistas").innerHTML = c
        ? `<div class="hg-grid-3">${c.map((x) => `<article class="hg-badge ${x.desbloqueada ? "is-on" : ""}"><span class="hg-empty-ico">${I.trofeu}</span><strong>${esc(x.nome)}</strong><span>${esc(x.descricao)}</span>${x.progresso != null && !x.desbloqueada ? `<div class="hg-bar" style="width:100%"><i data-w="${Number(x.progresso)}"></i></div>` : ""}</article>`).join("")}</div>`
        : vazio(res, { icone: "trofeu", titulo: "Nenhuma conquista cadastrada", texto: "Conquistas são desbloqueadas ao avaliar, cadastrar empresas e fazer matches." });
      barras($("#lista-conquistas"));
    },

    async revista() {
      const res = await buscar("revista");
      const ed = lista(res);
      $("#revista").innerHTML = ed
        ? `<div class="hg-grid-3">${ed.map((e) => `<article class="hg-panel"><p class="hg-sub">${esc(e.edicao || "")} ${e.data ? "· " + esc(e.data) : ""}</p><h2 class="hg-title">${esc(e.titulo)}</h2><p style="color:var(--text-2)">${esc(e.resumo || "")}</p>${e.url ? `<a class="hg-btn is-ghost" href="${esc(e.url)}">Ler</a>` : ""}</article>`).join("")}</div>`
        : `<section class="hg-panel">${vazio(res, { icone: "revista", titulo: "Nenhuma edição publicada", texto: "Matérias e destaques das empresas do Reino aparecem aqui." })}</section>`;
    },

    async pesquisa() {
      const qs = new URLSearchParams(location.search);
      const f = $("#form-pesquisa");
      f.q.value = qs.get("q") || "";
      const opts = await buscar("reino/filtros");
      const o = obj(opts);
      const preencher = (sel, itens, rotulo) => { sel.innerHTML = `<option value="">${rotulo}</option>` + (itens || []).map((n) => `<option>${esc(n.nome ?? n)}</option>`).join(""); };
      preencher(f.nicho, o?.nichos, "Todos os nichos");
      preencher(f.estado, o?.estados, "Todos os estados");
      preencher(f.cidade, o?.cidades, "Todas as cidades");
      ["nicho", "estado", "cidade", "regiao"].forEach((k) => qs.get(k) && f[k] && (f[k].value = qs.get(k)));
      async function executar() {
        const params = Object.fromEntries(new FormData(f));
        if (qs.get("regiao")) params.regiao = qs.get("regiao");
        const res = await buscar("reino/empresas", params);
        const itens = lista(res);
        $("#tabela").innerHTML = `<div class="hg-table-wrap"><table class="hg-table"><thead><tr>${["Empresa", "Nicho", "Cidade", "Abrangência", "Reputação"].map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${
          itens
            ? itens.map((e) => `<tr><td><strong style="color:#fff">${esc(e.nome)}</strong></td><td>${esc(e.nicho || "—")}</td><td>${esc(e.cidade || "—")}${e.estado ? " · " + esc(e.estado) : ""}</td><td>${esc(e.abrangencia || "—")}</td><td>${e.nota != null ? `${estrelas(e.nota)} <small>(${num(e.avaliacoes || 0)})</small>` : "—"}</td></tr>`).join("")
            : `<tr><td class="hg-table-empty" colspan="5">${vazio(res, { icone: "busca", titulo: "Nenhuma empresa encontrada", texto: "Ajuste os filtros de nicho, estado e cidade." })}</td></tr>`
        }</tbody></table></div>`;
      }
      async function googleMaps() {
        const alvo = $("#google-res");
        if (!alvo) return;
        const params = Object.fromEntries(new FormData(f));
        const q = [params.q || "empresas", params.nicho, params.cidade ? `em ${params.cidade}` : "", params.estado].filter(Boolean).join(" ");
        if (!params.q && !params.nicho && !params.cidade) { alvo.innerHTML = ""; return; }
        alvo.innerHTML = `<p class="hg-sub">Buscando “${esc(q)}” no Google Maps…</p>`;
        const r = await fetch(`/api/empresas-google?q=${encodeURIComponent(q)}&limite=10`).catch(() => null);
        const corpo = r ? await r.json().catch(() => ({})) : {};
        if (!r || !r.ok) { alvo.innerHTML = vazio({ estado: "ok" }, { icone: "alerta", titulo: "Google Maps indisponível", texto: esc(r?.status === 503 ? "Defina RAPIDAPI_MAPS_KEY no servidor." : corpo.erro || "Servidor local indisponível.") }); return; }
        const lst = corpo.candidatos || [];
        alvo.innerHTML = lst.length
          ? `<div class="hg-grid-2">${lst.map((g) => `<article class="hg-google-card">${g.foto_url ? `<img src="${esc(g.foto_url)}" alt="" loading="lazy">` : ""}<div><strong>${esc(g.nome)}</strong><small>${esc(g.categoria || "")}</small>${g.avaliacao_google != null ? `<span>${estrelas(g.avaliacao_google)} ${num(g.avaliacao_google, 1)} · ${num(g.num_avaliacoes_google || 0)} avaliações</span>` : ""}<small>${esc(g.endereco || "")}</small><small>${g.telefone ? esc(g.telefone) : ""} ${g.site ? `· <a href="${esc(g.site)}" target="_blank" rel="noopener">site ↗</a>` : ""}</small></div></article>`).join("")}</div>`
          : vazio({ estado: "ok" }, { icone: "busca", titulo: "Nenhuma empresa no Google Maps" });
      }
      f.addEventListener("submit", (e) => { e.preventDefault(); executar(); googleMaps(); });
      executar();
    },

    async vitrine() {
      const res = await buscar("reino/vitrine");
      const v = lista(res);
      $("#vitrine").innerHTML = v
        ? `<div class="hg-grid-3">${v.map((e) => `<article class="hg-panel"><p class="hg-sub">${esc(e.regiao)}</p><h2 class="hg-title">${esc(e.nome)}</h2><p style="color:var(--text-2)">${esc(e.nicho || "")} · ${esc(e.cidade || "")}</p>${e.nota != null ? estrelas(e.nota) : ""}</article>`).join("")}</div>`
        : `<section class="hg-panel">${vazio(res, { icone: "vitrine", titulo: "Vitrine vazia", texto: "Uma empresa em destaque por região aparece aqui." })}</section>`;
    },

    async hierarquia() {
      const res = await buscar("reino/titulos");
      const t = lista(res);
      $("#titulos").innerHTML = t
        ? `<ol class="hg-titulos">${t.map((x, i) => `<li><span class="hg-rank">${i + 1}</span><div><strong class="hg-gold">${esc(x.nome)}</strong><span>${esc(x.descricao || "")}</span></div>${x.mensalidade != null ? `<b>R$ ${num(x.mensalidade, 2)}/mês</b>` : ""}</li>`).join("")}</ol>`
        : vazio(res, { icone: "coroa", titulo: "Nenhum título cadastrado", texto: "Os títulos de nobreza do Reino aparecem em ordem." });
    },

    configuracoes() {
      const f = $("#form-config");
      f.api.value = ler("babel.api");
      f.token.value = ler("babel.token");
      f.usuario.value = ler("babel.usuario");
      const end = enderecoLocal() || {};
      f.cidade.value = end.cidade || ""; f.uf.value = end.uf || ""; f.bairro.value = end.bairro || "";
      f.demo.checked = ler("babel.demo") !== "0";
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          localStorage.setItem("babel.demo", f.demo.checked ? "1" : "0");
          localStorage.setItem("babel.api", f.api.value.trim());
          localStorage.setItem("babel.token", f.token.value.trim());
          localStorage.setItem("babel.usuario", f.usuario.value.trim());
          const end = { cidade: f.cidade.value.trim(), uf: f.uf.value.trim().toUpperCase(), bairro: f.bairro.value.trim() };
          if (end.cidade && end.uf) localStorage.setItem("babel.endereco", JSON.stringify(end)); else localStorage.removeItem("babel.endereco");
          sessionStorage.removeItem("babel.sessao"); // conta como novo login
        } catch (err) { return toast("O navegador bloqueou o armazenamento local."); }
        toast("Configurações salvas. Recarregando…");
        setTimeout(() => location.reload(), 900);
      });
      $("#testar").addEventListener("click", async () => {
        const url = f.api.value.trim().replace(/\/+$/, "");
        if (!url) return toast("Informe a URL da API.");
        try {
          const r = await fetch(`${url}/reino/kpis`, { headers: f.token.value ? { Authorization: `Bearer ${f.token.value.trim()}` } : {} });
          toast(r.ok ? "✅ API respondeu corretamente." : `A API respondeu HTTP ${r.status}.`);
        } catch (e) { toast("Não foi possível alcançar a API (rede ou CORS)."); }
      });
    },
  };

  if (DEMO) {
    const selo = document.createElement("a");
    selo.className = "hg-selo-demo";
    selo.href = "configuracoes.html";
    selo.title = "Dados fictícios. Desligue em Configurações.";
    selo.textContent = "Modo demonstração · dados fictícios";
    const acoes = $(".hg-top-actions");
    if (acoes) { selo.classList.add("is-cabecalho"); selo.textContent = "Demonstração"; acoes.prepend(selo); } else document.body.appendChild(selo);
  }

  const pagina = document.body.dataset.page;
  if (paginas[pagina]) paginas[pagina]();
})();
