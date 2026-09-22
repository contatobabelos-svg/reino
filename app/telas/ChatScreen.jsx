const { Button, Avatar, Icon } = window.BabelOSDesignSystem_5ad360;

/* Bate Papo do Reino — um grupo só para o Reino inteiro, estilo WhatsApp, de verdade.
   Toque numa mensagem → "Fazer network" → o pedido chega na hora para a outra conta →
   ela aceita → abre o chat privado 1:1. Tudo pelo banco (servicos/chat.js); quem pode
   ler e falar é decidido lá, a tela só mostra. */
const horaDe = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const diaDe = (iso) => {
  const d = new Date(iso); const hoje = new Date(); const ontem = new Date(Date.now() - 864e5);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

function ChatScreen({ conta }) {
  const CH = window.ReinoChat;
  const euId = conta && conta.id;
  const [grupo, setGrupo] = React.useState([]);
  const [privados, setPrivados] = React.useState({}); // sala -> mensagens
  const [pedidos, setPedidos] = React.useState([]);
  const [aberto, setAberto] = React.useState("reino"); // sala aberta
  const [selecionada, setSelecionada] = React.useState(null);
  const [notifAberta, setNotifAberta] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [busca, setBusca] = React.useState("");
  const [menuMobile, setMenuMobile] = React.useState(false);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [aoVivo, setAoVivo] = React.useState(false);
  const fim = React.useRef(null);
  const privadosRef = React.useRef({});
  privadosRef.current = privados;

  const addMsg = (lista, m) => (lista.some((x) => x.id === m.id) ? lista : [...lista, m].sort((a, b) => a.id - b.id));
  const receber = React.useCallback((m) => {
    if (!m || !m.sala) return;
    if (m.sala === CH.SALA_GRUPO) setGrupo((g) => addMsg(g, m));
    else setPrivados((pv) => ({ ...pv, [m.sala]: addMsg(pv[m.sala] || [], m) }));
  }, []);
  const carregarSala = async (sala) => {
    try { const ms = await CH.historico(sala, 100); setPrivados((pv) => ({ ...pv, [sala]: ms.reduce(addMsg, pv[sala] || []) })); }
    catch (e) { setErro(e.message); }
  };

  React.useEffect(() => {
    if (!CH || !CH.disponivel()) { setErro("O Bate Papo está indisponível agora. Recarregue a página."); setCarregando(false); return; }
    let vivo = true;
    (async () => {
      try {
        const [ms, ps] = await Promise.all([CH.historico(CH.SALA_GRUPO, 150), CH.pedidos()]);
        if (!vivo) return;
        setGrupo(ms); setPedidos(ps);
        ps.filter((p) => p.estado === "aceito").forEach((p) => carregarSala(CH.salaPrivada(p.de, p.para)));
      } catch (e) { if (vivo) setErro(e.message); }
      finally { if (vivo) setCarregando(false); }
    })();
    const desligar = CH.assinar({
      onMensagem: receber,
      onPedido: (p) => {
        if (!p || !p.id) return;
        setPedidos((lista) => [p, ...lista.filter((x) => x.id !== p.id)]);
        if (p.estado === "aceito") { const s = CH.salaPrivada(p.de, p.para); if (!privadosRef.current[s]) carregarSala(s); }
      },
      onEstado: (s) => setAoVivo(s === "SUBSCRIBED"),
    });
    return () => { vivo = false; desligar(); };
  }, []);

  React.useEffect(() => { const el = fim.current; if (el && el.parentElement) el.parentElement.scrollTop = el.parentElement.scrollHeight; }, [grupo, privados, aberto]);

  const outroDe = (p) => (p.de === euId
    ? { id: p.para, nome: p.para_nome || "Membro", empresa: p.para_empresa, titulo: p.para_titulo }
    : { id: p.de, nome: p.de_nome || "Membro", empresa: p.de_empresa, titulo: p.de_titulo });
  const pedidoCom = (id) => pedidos.find((p) => p.de === id || p.para === id);

  const fazerNetwork = async (m) => {
    setErro(""); /* o balão fica aberto e passa a mostrar "Pedido de network enviado" */
    try {
      const p = await CH.pedirNetwork(m.autor);
      setPedidos((lista) => [p, ...lista.filter((x) => x.id !== p.id)]);
      if (p.estado === "aceito") { const s = CH.salaPrivada(p.de, p.para); carregarSala(s); }
    } catch (e) { setErro(e.message); }
  };
  const responder = async (p, aceitar) => {
    setErro("");
    try {
      const r = await CH.responder(p.id, aceitar);
      setPedidos((lista) => [r, ...lista.filter((x) => x.id !== r.id)]);
      if (aceitar) abrirPrivado(r);
    } catch (e) { setErro(e.message); }
  };
  const abrirPrivado = (p) => {
    const s = CH.salaPrivada(p.de, p.para);
    if (!privados[s]) carregarSala(s);
    setAberto(s); setNotifAberta(false); setMenuMobile(false);
  };
  const enviar = async (e) => {
    e.preventDefault();
    const t = texto.trim(); if (!t || enviando) return;
    setEnviando(true); setErro("");
    try { const m = await CH.enviar(aberto, t); if (m) receber(m); setTexto(""); }
    catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };

  const aceitos = pedidos.filter((p) => p.estado === "aceito");
  const visiveis = pedidos.filter((p) => p.estado !== "recusado");
  const pendentes = pedidos.filter((p) => p.estado === "pendente" && p.para === euId);
  const ultima = (ms) => ms[ms.length - 1];
  const participantes = new Set(grupo.map((m) => m.autor)).size;
  const conversas = [
    { id: CH.SALA_GRUPO, nome: "Bate Papo do Reino", sub: participantes ? `${participantes} participante${participantes > 1 ? "s" : ""} · todos os títulos` : "Todos os títulos", ultima: ultima(grupo), grupo: true },
    ...aceitos.map((p) => { const o = outroDe(p); const s = CH.salaPrivada(p.de, p.para); const ms = privados[s] || []; return { id: s, nome: o.nome, sub: [o.titulo, o.empresa].filter(Boolean).join(" · ") || "Membro", ultima: ultima(ms) || null, pedido: p }; })
      .sort((a, b) => ((b.ultima && b.ultima.id) || 0) - ((a.ultima && a.ultima.id) || 0)),
  ];
  const listadas = busca.trim() ? conversas.filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase())) : conversas;
  const noGrupo = aberto === CH.SALA_GRUPO;
  const msgs = noGrupo ? grupo : privados[aberto] || [];
  const conversaAtual = conversas.find((c) => c.id === aberto) || conversas[0];
  const podeFalar = noGrupo ? CH.podeFalarNoGrupo(conta) : !!conversaAtual.pedido;
  const podeNetwork = CH.podeFazerNetwork(conta);

  const avisoSemFala = conta && conta.situacao !== "membro" && conta.situacao !== "admin"
    ? "Sua conta aguarda aprovação. Enquanto isso você acompanha o Bate Papo, e poderá falar quando for aprovada."
    : "Só Marquês para cima envia mensagem no Bate Papo. Suba de título para participar.";

  return (
    <div className={"hg-zap" + (menuMobile ? " is-lista" : "")}>
      {/* coluna de conversas */}
      <aside className="hg-zap-lista">
        <div className="hg-zap-lista-topo">
          <Avatar name={(conta && conta.nome) || "Você"} />
          <strong>Bate Papo</strong>
          <button type="button" className="hg-zap-sino" onClick={() => setNotifAberta((v) => !v)} aria-label="Notificações de network" aria-expanded={notifAberta}>
            <Icon name="sino" />{pendentes.length ? <b>{pendentes.length}</b> : null}
          </button>
        </div>
        <label className="hg-zap-busca"><Icon name="busca" /><input type="search" placeholder="Pesquisar conversa" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
        <ul className="hg-zap-conversas">
          {listadas.map((c) => (
            <li key={c.id}>
              <button type="button" className={aberto === c.id ? "is-on" : ""} onClick={() => { setAberto(c.id); setMenuMobile(false); }}>
                {c.grupo ? <span className="hg-zap-grupo-ico"><Icon name="coroa" /></span> : <Avatar name={c.nome} />}
                <div><strong>{c.nome}</strong><span>{c.ultima ? c.ultima.texto : c.grupo ? "Nenhuma mensagem ainda" : "Diga oi!"}</span></div>
                <time>{c.ultima ? horaDe(c.ultima.criado_em) : ""}</time>
              </button>
            </li>
          ))}
        </ul>
        {aceitos.length ? null : <p className="hg-zap-dica"><Icon name="link" />Toque numa mensagem do grupo e escolha <b>Fazer network</b> para abrir um chat privado.</p>}
      </aside>

      {/* conversa */}
      <section className="hg-zap-conversa" aria-label={conversaAtual.nome}>
        <header className="hg-zap-cab">
          <button type="button" className="hg-zap-voltar" onClick={() => setMenuMobile(true)} aria-label="Conversas"><Icon name="menu" /></button>
          {conversaAtual.grupo ? <span className="hg-zap-grupo-ico"><Icon name="coroa" /></span> : <Avatar name={conversaAtual.nome} />}
          <div><strong>{conversaAtual.nome}</strong><span>{conversaAtual.sub}{aoVivo ? "" : " · reconectando…"}</span></div>
          <button type="button" className="hg-zap-sino is-cab" onClick={() => setNotifAberta((v) => !v)} aria-label="Notificações de network"><Icon name="sino" />{pendentes.length ? <b>{pendentes.length}</b> : null}</button>
        </header>

        <div className="hg-zap-msgs" onClick={() => setSelecionada(null)}>
          {carregando ? <span className="hg-zap-dia">Carregando conversa…</span> : null}
          {!carregando && msgs.length === 0 ? <span className="hg-zap-dia">{noGrupo ? "Seja o primeiro a falar no Reino" : "Chat privado aberto. Mande a primeira mensagem."}</span> : null}
          {msgs.map((m, i) => {
            const minha = m.autor === euId;
            const anterior = msgs[i - 1];
            const novoDia = !anterior || diaDe(anterior.criado_em) !== diaDe(m.criado_em);
            const mesmoAutor = !novoDia && anterior && anterior.autor === m.autor;
            const tocavel = !minha && noGrupo && podeNetwork;
            const p = tocavel ? pedidoCom(m.autor) : null;
            return (
              <React.Fragment key={m.id}>
                {novoDia ? <span className="hg-zap-dia">{diaDe(m.criado_em)}</span> : null}
                <div className={"hg-zap-msg" + (minha ? " is-eu" : "") + (mesmoAutor ? " is-seq" : "") + (selecionada === m.id ? " is-sel" : "")}>
                  {!minha && !mesmoAutor ? <Avatar name={m.autor_nome} size={30} /> : <span className="hg-zap-vazio" />}
                  <div className="hg-zap-bolha" onClick={(e) => { e.stopPropagation(); if (tocavel) setSelecionada(selecionada === m.id ? null : m.id); }} role={tocavel ? "button" : undefined} tabIndex={tocavel ? 0 : undefined}>
                    {!minha && !mesmoAutor ? <header><strong>{m.autor_nome}</strong>{m.autor_titulo ? <em>{m.autor_titulo}</em> : null}{m.autor_empresa ? <small>{m.autor_empresa}</small> : null}</header> : null}
                    <p>{m.texto}</p>
                    <time>{horaDe(m.criado_em)}</time>
                    {selecionada === m.id ? (
                      <div className="hg-zap-acoes" onClick={(e) => e.stopPropagation()}>
                        {p && p.estado === "aceito" ? <Button variant="cyan" icon="msg" onClick={() => { setSelecionada(null); abrirPrivado(p); }}>Abrir chat privado</Button>
                          : p && p.estado === "pendente" && p.de === euId ? <span className="hg-sub">Pedido de network enviado</span>
                          : p && p.estado === "pendente" ? <Button variant="cyan" icon="match" onClick={() => { setSelecionada(null); responder(p, true); }}>Aceitar network</Button>
                          : <Button variant="cyan" icon="match" onClick={() => fazerNetwork(m)}>Fazer network</Button>}
                        <Button variant="ghost" onClick={() => setSelecionada(null)}>Cancelar</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={fim} />
        </div>

        {erro ? <p className="hg-chat-aviso" role="alert" style={{ margin: ".6rem .6rem 0" }}><Icon name="x" />{erro}</p> : null}
        {podeFalar ? (
          <form className="hg-zap-compor is-sem-anexo" onSubmit={enviar}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} placeholder={noGrupo ? "Mensagem para o Reino" : "Mensagem para " + conversaAtual.nome} aria-label="Mensagem" />
            <button type="submit" className="hg-zap-enviar" aria-label="Enviar" disabled={!texto.trim() || enviando}><Icon name="rota" /></button>
          </form>
        ) : (
          <p className="hg-chat-aviso" style={{ margin: ".6rem" }}><Icon name="coroa" />{avisoSemFala}</p>
        )}
      </section>

      {/* notificações de network */}
      {notifAberta ? (
        <div className="hg-zap-notif" role="dialog" aria-label="Pedidos de network">
          <header><strong>Network</strong><button type="button" className="hg-x" onClick={() => setNotifAberta(false)} aria-label="Fechar"><Icon name="x" /></button></header>
          {visiveis.length === 0 ? <p className="hg-sub">Nenhum pedido ainda. Toque numa mensagem do grupo para começar.</p> : null}
          {visiveis.map((p) => {
            const o = outroDe(p); const primeiro = o.nome.split(" ")[0];
            const estado = p.estado === "aceito" ? "aceito" : p.para === euId ? "recebido" : "enviado";
            return (
              <article key={p.id} className={"hg-zap-pedido is-" + estado}>
                <Avatar name={o.nome} />
                <div>
                  <strong>{o.nome}</strong><span>{[o.empresa || o.titulo, horaDe(p.respondido_em || p.criado_em)].filter(Boolean).join(" · ")}</span>
                  {estado === "enviado" ? <p>Você pediu para fazer network. Aguardando resposta…</p> : null}
                  {estado === "recebido" ? <><p><b>{primeiro}</b> quer fazer network com você.</p><div className="hg-zap-pedido-acoes"><Button variant="cyan" onClick={() => responder(p, true)}>Aceitar</Button><Button variant="ghost" onClick={() => responder(p, false)}>Recusar</Button></div></> : null}
                  {estado === "aceito" ? <p>Network aceito. <a href="#" onClick={(e) => { e.preventDefault(); abrirPrivado(p); }}>Ir para a conversa com {primeiro}</a></p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, { ChatScreen });
