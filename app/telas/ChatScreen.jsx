const { Button, Avatar, Icon, Pill } = window.BabelOSDesignSystem_5ad360;

/* Bate Papo do Reino — um grupo só, estilo WhatsApp.
   Toque numa mensagem → "Fazer network" → pedido vai para as notificações da
   outra pessoa → ela aceita → convite de chat privado → conversa 1:1.
   Na demonstração o outro lado responde sozinho depois de alguns segundos. */
const TITULO_CHAT = { "Ana Ribeiro": "Rei", "Camila Duarte": "Duque", "Eduarda Lopes": "Conde", "Henrique Alves": "Príncipe", "Gabriela Rocha": "Duque", "Felipe Nunes": "Duque", "Diego Martins": "Barão" };
const GRUPO_INICIAL = [
  { id: 1, de: "Ana Ribeiro", empresa: "Pulso Marketing Digital", texto: "Bom dia, Reino! Alguém de contabilidade em Campinas para uma parceria?", quando: "09:02" },
  { id: 2, de: "Felipe Nunes", empresa: "Orla Saúde Integrada", texto: "Aqui no Rio estamos fechando campanha de check-up. Se alguém tiver agência boa, indica.", quando: "09:05" },
  { id: 3, de: "Camila Duarte", empresa: "Pinheiro Tech Solutions", texto: "@Ana Ribeiro conheço a Conta Certa, são ótimos. Posso apresentar.", quando: "09:07" },
  { id: 4, de: "Henrique Alves", empresa: "Planalto Consultoria", texto: "A Guilda Planalto abriu 3 vagas para escritórios do Centro-Oeste. Quem quiser, me chama.", quando: "09:11" },
  { id: 5, de: "Eduarda Lopes", empresa: "Capibaribe Clínica", texto: "Inauguramos a unidade da Boa Vista ontem. Obrigada a quem passou por lá!", quando: "09:15" },
  { id: 6, de: "Gabriela Rocha", empresa: "Pampa Marketing", texto: "Case novo: +38% de leads pra uma imobiliária em 60 dias. Quem quiser o passo a passo, fala comigo.", quando: "09:18" },
];
const horaAgora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function ChatScreen() {
  const d = window.BABEL_DEMO;
  const eu = d.perfil.nome;
  const podeFalar = d.regras.chatFala.includes(d.perfil.titulo);
  const [grupo, setGrupo] = React.useState(GRUPO_INICIAL);
  const [privados, setPrivados] = React.useState({}); // nome -> mensagens
  const [aberto, setAberto] = React.useState("grupo"); // "grupo" | nome
  const [selecionada, setSelecionada] = React.useState(null); // id da mensagem tocada
  const [pedidos, setPedidos] = React.useState([]); // {de, estado: "enviado"|"aceito"|"convite"|"recebido"}
  const [notifAberta, setNotifAberta] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [menuMobile, setMenuMobile] = React.useState(false);
  const fim = React.useRef(null);

  React.useEffect(() => { fim.current && fim.current.scrollIntoView && fim.current.scrollTo && 0; const el = fim.current; if (el && el.parentElement) el.parentElement.scrollTop = el.parentElement.scrollHeight; }, [grupo, privados, aberto]);

  // pedido recebido de fora, para mostrar o outro lado do fluxo
  React.useEffect(() => {
    const t = setTimeout(() => setPedidos((p) => (p.some((x) => x.de === "Diego Martins") ? p : [...p, { de: "Diego Martins", empresa: "Martins Logística", estado: "recebido", quando: horaAgora() }])), 6000);
    return () => clearTimeout(t);
  }, []);

  const pedirNetwork = (nome, empresa) => {
    setSelecionada(null);
    setPedidos((p) => (p.some((x) => x.de === nome) ? p : [...p, { de: nome, empresa, estado: "enviado", quando: horaAgora() }]));
    // demonstração: a outra pessoa aceita em ~4s e o convite de chat privado chega
    setTimeout(() => setPedidos((p) => p.map((x) => (x.de === nome && x.estado === "enviado" ? { ...x, estado: "convite", quando: horaAgora() } : x))), 4000);
  };
  const aceitarRecebido = (nome) => setPedidos((p) => p.map((x) => (x.de === nome ? { ...x, estado: "convite" } : x)));
  const recusar = (nome) => setPedidos((p) => p.filter((x) => x.de !== nome));
  const abrirPrivado = (nome) => {
    setPedidos((p) => p.map((x) => (x.de === nome ? { ...x, estado: "aceito" } : x)));
    setPrivados((pv) => (pv[nome] ? pv : { ...pv, [nome]: [{ de: nome, texto: "Oi! Vi seu pedido de network. Vamos conversar?", quando: horaAgora() }] }));
    setAberto(nome); setNotifAberta(false); setMenuMobile(false);
  };
  const enviar = (e) => {
    e.preventDefault();
    const t = texto.trim(); if (!t) return;
    const msg = { id: Date.now(), de: eu, empresa: "Você", texto: t, quando: horaAgora() };
    if (aberto === "grupo") setGrupo((g) => [...g, msg]); else setPrivados((pv) => ({ ...pv, [aberto]: [...(pv[aberto] || []), msg] }));
    setTexto("");
  };

  const pendentes = pedidos.filter((p) => p.estado !== "aceito");
  const conversas = [{ id: "grupo", nome: "Bate Papo do Reino", sub: `${new Set(grupo.map((m) => m.de)).size} participantes · todos os títulos`, ultima: grupo[grupo.length - 1].texto, quando: grupo[grupo.length - 1].quando, grupo: true },
    ...Object.keys(privados).map((n) => { const ms = privados[n]; return { id: n, nome: n, sub: TITULO_CHAT[n] || "Membro", ultima: ms[ms.length - 1].texto, quando: ms[ms.length - 1].quando }; })];
  const msgs = aberto === "grupo" ? grupo : privados[aberto] || [];
  const conversaAtual = conversas.find((c) => c.id === aberto) || conversas[0];

  return (
    <div className={"hg-zap" + (menuMobile ? " is-lista" : "")}>
      {/* coluna de conversas */}
      <aside className="hg-zap-lista">
        <div className="hg-zap-lista-topo">
          <Avatar name={eu} />
          <strong>Bate Papo</strong>
          <button type="button" className="hg-zap-sino" onClick={() => setNotifAberta((v) => !v)} aria-label="Notificações de network" aria-expanded={notifAberta}>
            <Icon name="sino" />{pendentes.length ? <b>{pendentes.length}</b> : null}
          </button>
        </div>
        <label className="hg-zap-busca"><Icon name="busca" /><input type="search" placeholder="Pesquisar conversa" /></label>
        <ul className="hg-zap-conversas">
          {conversas.map((c) => (
            <li key={c.id}>
              <button type="button" className={aberto === c.id ? "is-on" : ""} onClick={() => { setAberto(c.id); setMenuMobile(false); }}>
                {c.grupo ? <span className="hg-zap-grupo-ico"><Icon name="coroa" /></span> : <Avatar name={c.nome} />}
                <div><strong>{c.nome}</strong><span>{c.ultima}</span></div>
                <time>{c.quando}</time>
              </button>
            </li>
          ))}
        </ul>
        {pedidos.some((p) => p.estado === "aceito") ? null : <p className="hg-zap-dica"><Icon name="link" />Toque numa mensagem do grupo e escolha <b>Fazer network</b> para abrir um chat privado.</p>}
      </aside>

      {/* conversa */}
      <section className="hg-zap-conversa" aria-label={conversaAtual.nome}>
        <header className="hg-zap-cab">
          <button type="button" className="hg-zap-voltar" onClick={() => setMenuMobile(true)} aria-label="Conversas"><Icon name="menu" /></button>
          {conversaAtual.grupo ? <span className="hg-zap-grupo-ico"><Icon name="coroa" /></span> : <Avatar name={conversaAtual.nome} />}
          <div><strong>{conversaAtual.nome}</strong><span>{conversaAtual.sub}</span></div>
          <button type="button" className="hg-zap-sino is-cab" onClick={() => setNotifAberta((v) => !v)} aria-label="Notificações de network"><Icon name="sino" />{pendentes.length ? <b>{pendentes.length}</b> : null}</button>
        </header>

        <div className="hg-zap-msgs" onClick={() => setSelecionada(null)}>
          <span className="hg-zap-dia">Hoje</span>
          {msgs.map((m, i) => {
            const minha = m.de === eu;
            const anterior = msgs[i - 1];
            const mesmoAutor = anterior && anterior.de === m.de;
            const jaPedi = pedidos.some((p) => p.de === m.de);
            return (
              <div key={m.id || i} className={"hg-zap-msg" + (minha ? " is-eu" : "") + (mesmoAutor ? " is-seq" : "") + (selecionada === m.id ? " is-sel" : "")}>
                {!minha && !mesmoAutor ? <Avatar name={m.de} size={30} /> : <span className="hg-zap-vazio" />}
                <div className="hg-zap-bolha" onClick={(e) => { e.stopPropagation(); if (!minha && aberto === "grupo") setSelecionada(selecionada === m.id ? null : m.id); }} role={!minha && aberto === "grupo" ? "button" : undefined} tabIndex={!minha && aberto === "grupo" ? 0 : undefined}>
                  {!minha && !mesmoAutor ? <header><strong>{m.de}</strong>{TITULO_CHAT[m.de] ? <em>{TITULO_CHAT[m.de]}</em> : null}{m.empresa ? <small>{m.empresa}</small> : null}</header> : null}
                  <p>{m.texto}</p>
                  <time>{m.quando}{minha ? <Icon name="link" /> : null}</time>
                  {selecionada === m.id ? (
                    <div className="hg-zap-acoes" onClick={(e) => e.stopPropagation()}>
                      {jaPedi ? <span className="hg-sub">Pedido de network enviado</span> : <Button variant="cyan" icon="match" onClick={() => pedirNetwork(m.de, m.empresa)}>Fazer network</Button>}
                      <Button variant="ghost" onClick={() => setSelecionada(null)}>Cancelar</Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div ref={fim} />
        </div>

        {podeFalar ? (
          <form className="hg-zap-compor" onSubmit={enviar}>
            <button type="button" aria-label="Anexar"><Icon name="mais" /></button>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={aberto === "grupo" ? "Mensagem para o Reino" : "Mensagem para " + aberto} aria-label="Mensagem" />
            <button type="submit" className="hg-zap-enviar" aria-label="Enviar" disabled={!texto.trim()}><Icon name="rota" /></button>
          </form>
        ) : (
          <p className="hg-chat-aviso" style={{ margin: ".6rem" }}><Icon name="coroa" />Só Marquês para cima envia mensagem no Bate Papo. Suba de título para participar.</p>
        )}
      </section>

      {/* notificações de network */}
      {notifAberta ? (
        <div className="hg-zap-notif" role="dialog" aria-label="Pedidos de network">
          <header><strong>Network</strong><button type="button" className="hg-x" onClick={() => setNotifAberta(false)} aria-label="Fechar"><Icon name="x" /></button></header>
          {pedidos.length === 0 ? <p className="hg-sub">Nenhum pedido ainda. Toque numa mensagem do grupo para começar.</p> : null}
          {pedidos.map((p) => (
            <article key={p.de} className={"hg-zap-pedido is-" + p.estado}>
              <Avatar name={p.de} />
              <div>
                <strong>{p.de}</strong><span>{[p.empresa || TITULO_CHAT[p.de], p.quando].filter(Boolean).join(" · ")}</span>
                {p.estado === "enviado" ? <p>Você pediu para fazer network. Aguardando resposta…</p> : null}
                {p.estado === "recebido" ? <><p><b>{p.de.split(" ")[0]}</b> quer fazer network com você.</p><div className="hg-zap-pedido-acoes"><Button variant="cyan" onClick={() => aceitarRecebido(p.de)}>Aceitar</Button><Button variant="ghost" onClick={() => recusar(p.de)}>Recusar</Button></div></> : null}
                {p.estado === "convite" ? <><p>Network aceito. Quer entrar em um chat privado com <b>{p.de.split(" ")[0]}</b>?</p><div className="hg-zap-pedido-acoes"><Button variant="cyan" icon="msg" onClick={() => abrirPrivado(p.de)}>Sim, abrir chat</Button><Button variant="ghost" onClick={() => recusar(p.de)}>Agora não</Button></div></> : null}
                {p.estado === "aceito" ? <p>Chat privado aberto. <a href="#" onClick={(e) => { e.preventDefault(); abrirPrivado(p.de); }}>Ir para a conversa</a></p> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, { ChatScreen });
