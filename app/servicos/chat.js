/* Reino · Bate Papo — grupo único do Reino, pedidos de network e chat privado.
   Tabelas e regras em supabase/2026-09-22_chat_grupo_e_privado.sql: quem lê, quem fala e
   o nome/empresa/título de cada mensagem são decididos no banco; aqui só se pede e se mostra.
   O tempo real usa o cliente oficial do Supabase (window.supabase, carregado no index.html)
   com o token da sessão de contas.js — o Realtime entrega a cada conta só o que ela pode ler. */
(function () {
  const CFG = () => { const c = window.REINO_SUPABASE; return c && c.url && c.anon ? c : null; };
  const SALA_GRUPO = "reino";
  let cliente = null;

  function sb() {
    if (cliente) return cliente;
    const c = CFG();
    if (!c || !window.supabase || !window.supabase.createClient) return null;
    const C = window.ReinoContas;
    cliente = window.supabase.createClient(c.url, c.anon, {
      /* o login é o de contas.js; este cliente só pega o token dele a cada chamada */
      accessToken: async () => (C && C.token ? (await C.token()) : null) || c.anon,
      realtime: { params: { eventsPerSecond: 10 } },
    });
    return cliente;
  }

  const erroLegivel = (e) => {
    const m = (e && (e.message || e.details)) || "";
    if (/row-level security/i.test(m)) return "Você não pode mandar mensagem nesta conversa.";
    if (/JWT|token/i.test(m)) return "Sua sessão venceu. Entre de novo.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão com o Reino agora. Tente de novo em instantes.";
    return m || "Não foi possível falar com o Bate Papo agora.";
  };
  async function pedir(p) {
    const r = await p;
    if (r.error) throw new Error(erroLegivel(r.error));
    return r.data;
  }

  const salaPrivada = (a, b) => { const [x, y] = [String(a), String(b)].sort(); return "p:" + x + ":" + y; };

  async function historico(sala, limite) {
    const c = sb(); if (!c) throw new Error("Bate Papo indisponível: o banco não está configurado.");
    const linhas = await pedir(c.from("chat_mensagens").select("*").eq("sala", sala).order("id", { ascending: false }).limit(limite || 100));
    return (linhas || []).reverse();
  }
  async function enviar(sala, texto) {
    const c = sb(); if (!c) throw new Error("Bate Papo indisponível.");
    const linhas = await pedir(c.from("chat_mensagens").insert({ sala, texto }).select());
    return linhas && linhas[0];
  }
  async function pedidos() {
    const c = sb(); if (!c) return [];
    return (await pedir(c.from("network_pedidos").select("*").order("criado_em", { ascending: false }))) || [];
  }
  async function pedirNetwork(para) {
    const c = sb(); if (!c) throw new Error("Bate Papo indisponível.");
    return pedir(c.rpc("chat_pedir_network", { p_para: para }));
  }
  async function responder(id, aceitar) {
    const c = sb(); if (!c) throw new Error("Bate Papo indisponível.");
    return pedir(c.rpc("chat_responder_network", { p_id: id, p_aceitar: !!aceitar }));
  }

  /* avisa cada mensagem nova e cada pedido novo/alterado. Devolve a função que desliga. */
  function assinar({ onMensagem, onPedido, onEstado }) {
    const c = sb(); if (!c) return () => {};
    const C = window.ReinoContas;
    let canal = null, desligado = false;
    /* o Realtime confere a política de leitura com o token do canal: sem o token da conta ele
       entra como anônimo e cada evento chega vazio ("401"). Passa o token antes de assinar e
       renova a cada 4 min (o do login vale 1 h e contas.js o renova perto de vencer). */
    const renovar = async () => { const t = C && C.token ? await C.token() : null; if (t) c.realtime.setAuth(t); return t; };
    const relogio = setInterval(renovar, 4 * 60 * 1000);
    renovar().then(() => {
      if (desligado) return;
      canal = c.channel("reino-chat-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_mensagens" }, (p) => { if (p.new && p.new.id) onMensagem && onMensagem(p.new); })
        .on("postgres_changes", { event: "*", schema: "public", table: "network_pedidos" }, (p) => { if (p.new && p.new.id) onPedido && onPedido(p.new, p.eventType); })
        .subscribe((estado) => onEstado && onEstado(estado));
    });
    return () => { desligado = true; clearInterval(relogio); try { canal && c.removeChannel(canal); } catch (e) {} };
  }

  /* espelho da regra do banco, só para mostrar o campo de texto ou o aviso */
  const TITULOS_SO_LEEM = ["Barão", "Visconde", "Conde"];
  const podeFalarNoGrupo = (conta) => !!conta && (conta.situacao === "admin" || (conta.situacao === "membro" && !TITULOS_SO_LEEM.includes(conta.titulo)));
  const podeFazerNetwork = (conta) => !!conta && (conta.situacao === "admin" || conta.situacao === "membro");

  window.ReinoChat = { SALA_GRUPO, salaPrivada, historico, enviar, pedidos, pedirNetwork, responder, assinar, podeFalarNoGrupo, podeFazerNetwork, disponivel: () => !!sb() };
})();
