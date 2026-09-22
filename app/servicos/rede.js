/* Reino · Rede — guildas, matches e status (stories de 24 h) vindos do banco (TODO AI).
   Tabelas em supabase/2026-09-22_guildas_matches_status_e_contas_teste.sql; quem vê o quê
   é decidido lá (contas de teste só aparecem para admin e para elas mesmas).
   Usa a mesma conexão do Bate Papo (servicos/chat.js). */
(function () {
  const sb = () => (window.ReinoChat && window.ReinoChat.cliente ? window.ReinoChat.cliente() : null);
  async function ler(p) { const r = await p; if (r.error) throw new Error(r.error.message || "Não foi possível falar com o Reino agora."); return r.data || []; }

  async function guildas() {
    const c = sb(); if (!c) return [];
    const [gs, ms] = await Promise.all([
      ler(c.from("guildas").select("*").order("pontos", { ascending: false })),
      ler(c.from("guilda_membros").select("*").order("entrou_em")),
    ]);
    return gs.map((g) => {
      const membros = ms.filter((m) => m.guilda_id === g.id);
      const lider = membros.find((m) => m.papel === "lider");
      return { ...g, membros, lider_nome: lider ? lider.nome : "" };
    });
  }

  /* matches da conta, já do ponto de vista dela (o "outro" lado); admin sem match próprio
     recebe os pares de teste com os dois nomes */
  async function matches(euId) {
    const c = sb(); if (!c) return [];
    const linhas = await ler(c.from("matches").select("*").order("compatibilidade", { ascending: false }).limit(200));
    return linhas.map((m) => {
      const souA = m.a === euId, souB = m.b === euId;
      if (souA || souB) {
        const p = souA ? "b" : "a";
        return { id: m.id, outro: m[p], nome: m[p + "_empresa"], pessoa: m[p + "_nome"], nicho: m[p + "_nicho"], cidade: m[p + "_cidade"], uf: m[p + "_uf"], titulo: m[p + "_titulo"], compatibilidade: m.compatibilidade, motivo: m.motivo, meu: true };
      }
      return { id: m.id, nome: m.a_empresa + " ↔ " + m.b_empresa, pessoa: m.a_nome + " e " + m.b_nome, nicho: m.a_nicho + " · " + m.b_nicho, cidade: m.a_cidade + "/" + m.a_uf + " · " + m.b_cidade + "/" + m.b_uf, compatibilidade: m.compatibilidade, motivo: m.motivo, meu: false };
    });
  }

  async function status() {
    const c = sb(); if (!c) return [];
    return ler(c.from("status").select("*").gt("expira_em", new Date().toISOString()).order("criado_em", { ascending: true }).limit(300));
  }
  async function publicarStatus(texto, fundo) {
    const c = sb(); if (!c) return null;
    const r = await ler(c.from("status").insert({ texto: String(texto || "").slice(0, 280), fundo: fundo || "aurora" }).select());
    return r[0] || null;
  }

  window.ReinoRede = { guildas, matches, status, publicarStatus };
})();
