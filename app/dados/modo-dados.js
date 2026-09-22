/* Reino · Dados fictícios liga/desliga (TODO AH).
   O selo "Dados fictícios" do topo vira um interruptor. Desligado, tudo o que é inventado
   (window.BABEL_DEMO e as respostas de window.BabelDemo) é esvaziado mantendo o mesmo
   formato — lista vira [], número vira 0, texto vira "" — e cada tela mostra só o que é
   real: conta, mapa das empresas cadastradas, Bate Papo, notícias. As regras do Reino
   (títulos, quem fala no chat, grupos do feed) nunca somem.
   A escolha fica no navegador (localStorage "reino.dadosFicticios": "0" = desligado) e
   vale depois de recarregar, porque as telas leem os dados ao abrir.
   Precisa vir depois de data.js e dados-demo.js e antes das telas. */
(function () {
  const CHAVE = "reino.dadosFicticios";
  const ler = () => { try { return localStorage.getItem(CHAVE) !== "0"; } catch (e) { return true; } };
  const ligado = ler();

  /* mesmo formato, sem conteúdo */
  const vazio = (v) => {
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") { const o = {}; Object.keys(v).forEach((k) => { o[k] = vazio(v[k]); }); return o; }
    if (typeof v === "number") return 0;
    if (typeof v === "string") return "";
    if (typeof v === "boolean") return false;
    return v;
  };

  /* o que é regra do Reino, não dado inventado */
  const FICA_BABEL = ["titulos", "regras", "gruposFeed"];
  const FICA_ROTAS = ["reino/titulos", "reino/filtros", "preferencias"];

  if (!ligado) {
    const d = window.BABEL_DEMO;
    if (d) Object.keys(d).forEach((k) => { if (!FICA_BABEL.includes(k)) d[k] = vazio(d[k]); });
    const original = window.BabelDemo;
    if (typeof original === "function") {
      window.BabelDemo = function (recurso, params) {
        const r = original(recurso, params);
        return FICA_ROTAS.includes(recurso) ? r : vazio(r);
      };
    }
  }

  window.ReinoDados = {
    ficticios: () => ligado,
    alternar: () => {
      try { localStorage.setItem(CHAVE, ligado ? "0" : "1"); } catch (e) {}
      location.reload();
    },
  };
})();
