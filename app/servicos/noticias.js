/* Reino · serviço de notícias — usado pela tela Notícias do Reino e pelo bloco
   do Dashboard, para os dois falarem com a mesma Edge Function, dividirem o
   mesmo cache e mostrarem os mesmos "salvos" e "já li".

   Como funciona o cache: quem abre a tela vê na hora o que estava guardado
   (mesmo velho) e a atualização chega por trás — é o "stale while revalidate".
   Tudo em localStorage com try/catch: navegador em janela anônima, cota cheia
   ou armazenamento bloqueado não pode derrubar a tela.

   Regras de conteúdo: só título, veículo, link, a capa que o próprio feed
   publica e o resumo curto do feed. A leitura é sempre no site da fonte. */
(() => {
  const FUNC_URL = ((window.REINO_SUPABASE && window.REINO_SUPABASE.url) || "https://fxlansnepokjxdikxocb.supabase.co") + "/functions/v1/reino-apis";
  const VERSAO = "v1";
  const CHAVE_CACHE = "reino.noticias." + VERSAO + ".";
  const CHAVE_SALVAS = "reino.noticias.salvas";
  const CHAVE_LIDAS = "reino.noticias.lidas";
  const MAX_CACHE = 10;      // quantas abas ficam guardadas
  const MAX_ITENS = 30;      // itens por aba no cache
  const MAX_SALVAS = 80;
  const MAX_LIDAS = 400;
  const VALIDADE = 4 * 60 * 1000; // depois disso o cache é "velho" (mas ainda aparece)

  /* Espelho das editorias da função: a tela desenha as abas antes da primeira
     resposta chegar. A função manda a lista junto e ela vence, se mudar. */
  const EDITORIAS = [
    { id: "destaques", rotulo: "Destaques" },
    { id: "negocios", rotulo: "Negócios" },
    { id: "economia", rotulo: "Economia" },
    { id: "tecnologia", rotulo: "Tecnologia" },
    { id: "marketing", rotulo: "Marketing" },
    { id: "credito", rotulo: "Crédito e juros" },
    { id: "empreendedorismo", rotulo: "Empreendedorismo" },
    { id: "politica", rotulo: "Política e empresas" },
  ];

  // ---------------------------------------------------------- armazenamento
  const ler = (chave, padrao) => {
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) return padrao;
      const v = JSON.parse(bruto);
      return v == null ? padrao : v;
    } catch (e) { return padrao; }
  };
  const gravar = (chave, valor) => {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { limparVelhos(); try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e2) { return false; } }
  };
  function chavesDeCache() {
    const saida = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(CHAVE_CACHE) === 0) saida.push(k);
      }
    } catch (e) { /* armazenamento bloqueado */ }
    return saida;
  }
  // cota cheia ou abas demais: some com as leituras mais antigas
  function limparVelhos() {
    try {
      const itens = chavesDeCache().map((k) => ({ k, em: (ler(k, {}) || {}).em || 0 })).sort((a, b) => a.em - b.em);
      while (itens.length > MAX_CACHE - 1) { const v = itens.shift(); localStorage.removeItem(v.k); }
    } catch (e) { /* nada a fazer */ }
  }

  const chaveDe = (pedido) => CHAVE_CACHE + ((pedido && pedido.busca)
    ? "b:" + String(pedido.busca).trim().toLowerCase()
    : "t:" + ((pedido && pedido.tema) || "destaques"));

  // ---------------------------------------------------------------- limpeza
  const soHttps = (u) => typeof u === "string" && /^https:\/\//i.test(u) && !/^https:\/\/(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(u);
  function limpar(n) {
    if (!n || !n.titulo || !soHttps(n.link)) return null;
    return {
      titulo: String(n.titulo).slice(0, 220),
      resumo: String(n.resumo || "").slice(0, 300),
      link: n.link,
      fonte: String(n.fonte || "Reino").slice(0, 60),
      fonteId: String(n.fonteId || "").slice(0, 30),
      site: String(n.site || "").slice(0, 80),
      publicado: String(n.publicado || ""),
      imagem: soHttps(n.imagem) ? n.imagem : "",
      temas: Array.isArray(n.temas) ? n.temas.slice(0, 4) : [],
      tambemEm: Array.isArray(n.tambemEm) ? n.tambemEm.slice(0, 3) : [],
    };
  }
  // a mesma manchete pode chegar de dois veículos; fica a primeira (com capa)
  function semRepetir(itens) {
    const vistos = new Set();
    const saida = [];
    itens.forEach((n) => {
      const chaveLink = n.link.replace(/[?#].*$/, "");
      const palavras = n.titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((p) => p.length > 3);
      // mesma regra da função: 8 palavras de peso + quantas eram ao todo
      const assinatura = palavras.length < 3 ? "" : palavras.slice().sort().slice(0, 8).join("-") + "|" + palavras.length;
      if (vistos.has(chaveLink) || (assinatura && vistos.has(assinatura))) return;
      vistos.add(chaveLink); if (assinatura) vistos.add(assinatura);
      saida.push(n);
    });
    return saida;
  }

  // ------------------------------------------------------------------ rede
  function pedir(corpo, sinal) {
    const chaves = window.REINO_SUPABASE || {};
    return fetch(FUNC_URL, {
      method: "POST", signal: sinal,
      headers: { apikey: chaves.anon, Authorization: "Bearer " + chaves.anon, "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível buscar as notícias agora.");
      return j;
    });
  }

  /* O que já está guardado nesta aba — devolve mesmo vencido (com velho: true),
     porque mostrar algo na hora é melhor do que tela em branco. */
  function doCache(pedido) {
    const g = ler(chaveDe(pedido), null);
    if (!g || !Array.isArray(g.itens) || !g.itens.length) return null;
    return { itens: g.itens, atualizado: g.atualizado || "", em: g.em || 0, velho: Date.now() - (g.em || 0) > VALIDADE, doCache: true };
  }

  /* Busca na função e guarda. `sinal` é um AbortSignal para cancelar quando o
     usuário troca de aba antes de a resposta chegar. */
  function buscar(pedido, sinal) {
    const corpo = { rota: "noticias" };
    if (pedido && pedido.busca) corpo.busca = String(pedido.busca).slice(0, 60);
    else corpo.tema = (pedido && pedido.tema) || "destaques";
    return pedir(corpo, sinal).then((j) => {
      const itens = semRepetir((j.itens || []).map(limpar).filter(Boolean));
      const dados = { itens, atualizado: j.atualizado || new Date().toISOString(), em: Date.now(), doCache: false, editorias: j.editorias || null };
      if (itens.length) {
        limparVelhos();
        gravar(chaveDe(pedido), { itens: itens.slice(0, MAX_ITENS), atualizado: dados.atualizado, em: dados.em });
      }
      return dados;
    });
  }

  // ------------------------------------------------------- salvas e lidas
  const salvas = () => (ler(CHAVE_SALVAS, []) || []).map(limpar).filter(Boolean);
  const lidas = () => { const v = ler(CHAVE_LIDAS, []); return Array.isArray(v) ? v : []; };
  const avisar = (nome) => { try { window.dispatchEvent(new CustomEvent(nome)); } catch (e) { /* navegador antigo */ } };

  const estaSalva = (link) => salvas().some((n) => n.link === link);
  function alternarSalva(n) {
    const limpa = limpar(n);
    if (!limpa) return false;
    const atuais = salvas();
    const tinha = atuais.some((x) => x.link === limpa.link);
    const novas = tinha ? atuais.filter((x) => x.link !== limpa.link) : [{ ...limpa, salvaEm: Date.now() }, ...atuais].slice(0, MAX_SALVAS);
    gravar(CHAVE_SALVAS, novas);
    avisar("reino-noticias-salvas");
    return !tinha;
  }
  const foiLida = (link) => lidas().indexOf(link) >= 0;
  function marcarLida(link) {
    if (!link || foiLida(link)) return;
    gravar(CHAVE_LIDAS, [link].concat(lidas()).slice(0, MAX_LIDAS));
    avisar("reino-noticias-lidas");
  }
  function limparLidas() { gravar(CHAVE_LIDAS, []); avisar("reino-noticias-lidas"); }

  // --------------------------------------------------------- compartilhar
  /* Web Share onde existir (celular), área de transferência no resto.
     Devolve "compartilhado", "copiado" ou "" (não deu). */
  async function compartilhar(n) {
    const dados = { title: n.titulo, text: n.titulo + " — " + (n.fonte || ""), url: n.link };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(dados))) { await navigator.share(dados); return "compartilhado"; }
    } catch (e) { if (e && e.name === "AbortError") return ""; }
    try { await navigator.clipboard.writeText(n.link); return "copiado"; } catch (e) { /* segue para o plano B */ }
    try {
      const campo = document.createElement("textarea");
      campo.value = n.link; campo.setAttribute("readonly", "");
      campo.style.position = "fixed"; campo.style.opacity = "0";
      document.body.appendChild(campo); campo.select();
      const deu = document.execCommand("copy");
      document.body.removeChild(campo);
      return deu ? "copiado" : "";
    } catch (e) { return ""; }
  }

  // ------------------------------------------------------------- utilidades
  function tempoRelativo(dataStr) {
    if (!dataStr) return "";
    const t = Date.parse(dataStr);
    if (isNaN(t)) return "";
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return "há " + min + " min";
    const h = Math.round(min / 60);
    if (h < 24) return "há " + h + " h";
    const d = Math.round(h / 24);
    if (d < 7) return "há " + d + (d === 1 ? " dia" : " dias");
    return new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
  const hora = (d) => new Date(d || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  function dataPorExtenso() {
    const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  /* Tom da capa de reserva: sempre o mesmo para o mesmo veículo, escolhido
     entre as combinações da identidade (as cores ficam no CSS, por data-tom). */
  function tomDaFonte(nome) {
    const s = String(nome || "Reino");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
    return (h % 6) + 1;
  }
  const iniciais = (nome) => String(nome || "Reino").replace(/^(g1|o|a|do|da)\s+/i, "").trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "R";

  window.ReinoNoticias = {
    EDITORIAS, FUNC_URL, VALIDADE,
    doCache, buscar, chaveDe,
    salvas, estaSalva, alternarSalva, lidas, foiLida, marcarLida, limparLidas,
    compartilhar, tempoRelativo, hora, dataPorExtenso, tomDaFonte, iniciais, semRepetir,
  };
})();
