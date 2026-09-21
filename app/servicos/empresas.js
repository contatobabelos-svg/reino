/* Reino · Empresas do mapa — só o que pode aparecer no globo.
   Fonte: função do banco public.empresas_do_mapa() (supabase/2026-09-21_mapa_empresas_com_foto.sql).
   Ela devolve apenas perfis com FOTO e NOME DE EMPRESA preenchidos e situação já
   aprovada ('membro' ou 'admin'), com estes campos e só eles:
     id, empresa, foto, cidade, uf, titulo
   Nada de e-mail, CNPJ, nome da pessoa ou usuário de login sai daqui.

   Uso: const lista = await window.ReinoEmpresas.doMapa();
   Sem banco configurado, sem login ou com erro (inclusive a função ainda não
   publicada), devolve [] — o mapa simplesmente não mostra ninguém além da
   própria conta, que o MapaPanel acrescenta. */
(function () {
  "use strict";
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const VALE = 60000; /* cache curto: o mapa reprojeta a cada quadro, mas não rebusca */
  let cache = { quando: 0, promessa: null };

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

  async function buscar() {
    const c = CFG();
    if (!c) return [];
    const C = window.ReinoContas;
    const tk = C && C.token ? await C.token().catch(() => null) : null;
    if (!tk) return []; /* a função é só para quem está logado */
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/empresas_do_mapa", {
      method: "POST",
      headers: { apikey: c.anon, Authorization: "Bearer " + tk, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!r.ok) throw new Error("empresas_do_mapa " + r.status);
    const j = await r.json();
    if (!Array.isArray(j)) return [];
    /* a regra do mapa vale também no navegador: sem foto ou sem empresa, não entra */
    return j.map(limpo).filter((p) => p.id && p.empresa && p.foto);
  }

  async function doMapa() {
    const agora = Date.now();
    if (cache.promessa && agora - cache.quando < VALE) return cache.promessa;
    cache = {
      quando: agora,
      promessa: buscar().catch((e) => {
        console.warn("[empresas] mapa sem lista do banco:", e.message);
        return [];
      }),
    };
    return cache.promessa;
  }

  const limpar = () => { cache = { quando: 0, promessa: null }; };

  window.ReinoEmpresas = { doMapa, limpar, configurado: () => !!CFG() };
})();
