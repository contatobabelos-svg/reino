/* Reino · Empresas do mapa — só o que pode aparecer no globo.
   Fonte: função do banco public.empresas_do_mapa(p_uf, p_cidade, p_limite, p_pagina)
   (supabase/2026-09-21_mapa_por_cidade_paginado.sql).
   Ela devolve apenas perfis com FOTO e NOME DE EMPRESA preenchidos e situação já
   aprovada ('membro' ou 'admin'), com estes campos e só eles:
     id, empresa, foto, cidade, uf, titulo
   Nada de e-mail, CNPJ, nome da pessoa ou usuário de login sai daqui.

   C8 do Parecer 1: a lista NÃO é mais pedida de uma vez. O PostgREST corta em
   max_rows = 1000 sem avisar, então passando de mil membros as UFs do fim do
   alfabeto sumiriam do mapa em silêncio. Agora:
     * doLugar(uf, cidade) pede só a cidade em que o globo está — que é exatamente
       o que o MapaPanel usa — e vai buscando página por página até acabar;
     * doMapa() continua existindo para quem quiser a lista geral, mas ela é
       PAGINADA e explicitamente limitada; use doLugar quando houver lugar.

   Uso: const lista = await window.ReinoEmpresas.doLugar("SP", "Campinas");
   Sem banco configurado, sem login ou com erro, devolve [] — o mapa simplesmente
   não mostra ninguém além da própria conta, que o MapaPanel acrescenta. */
(function () {
  "use strict";
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const VALE = 60000; /* cache curto: o mapa reprojeta a cada quadro, mas não rebusca */
  const PAGINA = 500;   /* casa com o teto da função (e fica abaixo do max_rows de 1000) */
  const MAX_PAGINAS = 20; /* 10 mil empresas numa cidade só: além disso é outra conversa */
  const cache = new Map(); /* chave do lugar → { quando, promessa } */

  function limpo(p) {
    return {
      id: String(p.id || ""),
      empresa: String(p.empresa || "").trim(),
      foto: String(p.foto || "").trim(),
      cidade: p.cidade ? String(p.cidade).trim() : null,
      uf: p.uf ? String(p.uf).trim().toUpperCase() : null,
      titulo: p.titulo ? String(p.titulo).trim() : null,
    };
  }

  async function pagina(tk, uf, cidade, n) {
    const c = CFG();
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/empresas_do_mapa", {
      method: "POST",
      headers: { apikey: c.anon, Authorization: "Bearer " + tk, "Content-Type": "application/json" },
      body: JSON.stringify({ p_uf: uf || null, p_cidade: cidade || null, p_limite: PAGINA, p_pagina: n }),
    });
    if (!r.ok) throw new Error("empresas_do_mapa " + r.status);
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  }

  async function buscar(uf, cidade) {
    const c = CFG();
    if (!c) return [];
    const C = window.ReinoContas;
    const tk = C && C.token ? await C.token().catch(() => null) : null;
    if (!tk) return []; /* a função é só para quem está logado */
    const todas = [];
    for (let n = 0; n < MAX_PAGINAS; n++) {
      const lote = await pagina(tk, uf, cidade, n);
      todas.push(...lote);
      if (lote.length < PAGINA) break; /* página incompleta = acabou */
    }
    /* a regra do mapa vale também no navegador: sem foto ou sem empresa, não entra */
    return todas.map(limpo).filter((p) => p.id && p.empresa && p.foto);
  }

  function pedir(uf, cidade) {
    const chave = (uf || "*") + "|" + (cidade || "*");
    const agora = Date.now();
    const antes = cache.get(chave);
    if (antes && agora - antes.quando < VALE) return antes.promessa;
    const promessa = buscar(uf, cidade).catch((e) => {
      console.warn("[empresas] mapa sem lista do banco:", e.message);
      return [];
    });
    cache.set(chave, { quando: agora, promessa });
    return promessa;
  }

  /* as empresas de uma cidade (o que o mapa realmente desenha) */
  const doLugar = (uf, cidade) => (uf && cidade ? pedir(String(uf).toUpperCase(), String(cidade)) : Promise.resolve([]));
  /* lista geral, paginada — usada só quando não há lugar definido */
  const doMapa = () => pedir(null, null);

  const limpar = () => cache.clear();

  window.ReinoEmpresas = { doMapa, doLugar, limpar, configurado: () => !!CFG() };
})();
