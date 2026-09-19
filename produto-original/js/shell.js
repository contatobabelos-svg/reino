/* Shell compartilhado: ícones, menu lateral e cabeçalho.
   Carregado de forma síncrona logo após os contêineres para não piscar. */
(function () {
  "use strict";

  const p = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    visao: p('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
    ordens: p('<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>'),
    tecnicos: p('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    agenda: p('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    clientes: p('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
    analises: p('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>'),
    relatorios: p('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    config: p('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    busca: p('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sino: p('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
    msg: p('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    menu: p('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    x: p('<path d="M18 6 6 18M6 6l12 12"/>'),
    mais: p('<path d="M12 5v14M5 12h14"/>'),
    rota: p('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>'),
    pin: p('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    camadas: p('<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="m2 13 10 5 10-5"/>'),
    alerta: p('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
    plug: p('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>'),
    grafico: p('<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
    baixar: p('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    filtro: p('<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>'),
    logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fe3ff"/><stop offset="1" stop-color="#8b5cff"/></linearGradient></defs><path d="M16 2 28 9v14l-12 7L4 23V9z" fill="none" stroke="url(#lg)" stroke-width="2.4"/><path d="M11 12.5 16 10l5 2.5v7L16 22l-5-2.5z" fill="url(#lg)"/></svg>',
  };
  window.BabelIcones = I;

  I.mapa = p('<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>');
  I.social = p('<circle cx="12" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M10.5 8.6 6.5 15.4M13.5 8.6l4 6.8M8 18h8"/>');
  I.match = p('<path d="M8 7a4 4 0 1 0 0 10"/><path d="M16 7a4 4 0 1 1 0 10"/><path d="M8 12h8M13 9l3 3-3 3"/>');
  I.trofeu = p('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/>');
  I.revista = p('<path d="M4 5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 8h5M8 12h8M8 16h8"/>');
  I.vitrine = p('<path d="M3 9 5 4h14l2 5M3 9h18v11H3zM3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>');
  I.coroa = p('<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>');
  I.estrela = p('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>');

  I.guilda = p('<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="M9 8v7l3-2 3 2V8"/>');
  I.link = p('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>');

  I.bolsa = p('<path d="M3 3v18h18"/><path d="M7 14v3M7 9v2M11 8v8M15 11v4M15 5v3M19 7v6"/><path d="M6 11h2v3H6zM10 10h2v4h-2zM14 8h2v3h-2zM18 9h2v2h-2z"/>');

  const menu = [
    ["index.html", "visao", "Dashboard"],
    ["guildas.html", "guilda", "Guildas"],
    ["mapa.html", "mapa", "Mapa Reino"],
    ["rede-social.html", "social", "Rede social"],
    ["match.html", "match", "Match Reino"],
    ["conquistas.html", "trofeu", "Conquistas"],
    ["revista.html", "revista", "Revista"],
    ["bolsa.html", "bolsa", "Bolsa de Valores"],
    ["pesquisa.html", "busca", "Pesquisa"],
    ["vitrine.html", "vitrine", "Vitrine"],
    ["hierarquia.html", "coroa", "Hierarquia"],
    ["configuracoes.html", "config", "Configurações"],
  ];
  const atual = location.pathname.split("/").pop() || "index.html";
  const cur = (href) => (href === atual ? ' aria-current="page"' : "");

  let api = "";
  let usuario = "";
  let demo = true;
  try { api = localStorage.getItem("babel.api") || ""; usuario = localStorage.getItem("babel.usuario") || ""; demo = localStorage.getItem("babel.demo") !== "0"; } catch (e) {}
  if (!api && demo && !usuario) usuario = "Bruno Carvalho";
  const iniciais = usuario.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

  const side = document.getElementById("hg-side");
  if (side) {
    // faixa sensível na borda esquerda: passar o mouse revela o menu
    const gatilho = document.createElement("div");
    gatilho.className = "hg-side-gatilho";
    gatilho.setAttribute("aria-hidden", "true");
    side.before(gatilho);
    side.className = "hg-side";
    side.innerHTML = `
      <a class="hg-brand" href="index.html">${I.logo}<span>Babel <b>OS</b></span></a>
      <nav class="hg-nav" aria-label="Principal">
        ${menu.map(([h, i, t]) => `<a href="${h}"${cur(h)}>${I[i]}<span>${t}</span></a>`).join("")}
      </nav>
      <div class="hg-side-foot">
        <b><span class="hg-dot ${api ? "is-on" : "is-off"}"></span>${api ? "API conectada" : demo ? "Modo demonstração" : "Sem fonte de dados"}</b>
        ${api ? "Os painéis carregam da sua API." : demo ? 'Dados fictícios. <a href="configuracoes.html">Conectar API</a>' : '<a href="configuracoes.html">Configure a API</a> para ver dados reais.'}
      </div>`;
  }

  const top = document.getElementById("hg-top");
  if (top) {
    top.className = "hg-top";
    top.innerHTML = `
      <button class="hg-icon-btn hg-burger" data-hg-menu aria-label="Abrir menu">${I.menu}</button>
      <label class="hg-search"><span class="sr-only">Busca global</span>${I.busca}
        <input type="search" id="hg-busca" placeholder="Buscar empresas, nichos ou cidades no Reino…" autocomplete="off"></label>
      <div class="hg-top-actions">
        <button class="hg-icon-btn" data-hg-drawer="notificacoes" aria-label="Notificações">${I.sino}<span class="hg-badge-dot" id="hg-notif-dot" hidden></span></button>
        <button class="hg-icon-btn" data-hg-drawer="mensagens" aria-label="Mensagens">${I.msg}<span class="hg-badge-dot" id="hg-msg-dot" hidden></span></button>
        <a class="hg-user" href="configuracoes.html" aria-label="Perfil">
          <span class="hg-avatar">${iniciais || I.tecnicos}</span>
          <div><b>${usuario ? usuario.replace(/</g, "&lt;") : "Seu perfil"}</b><small data-hg-titulo>${usuario ? "Membro do Reino" : "Configurar"}</small></div>
        </a>
      </div>`;
  }
})();
