const { Sidebar, TopBar, TabBar, Drawer, ListRow, DemoBadge, Panel, PageHead, EmptyState } = window.BabelOSDesignSystem_5ad360;

const TELAS = {
  "index.html": DashboardScreen,
  "guildas.html": GuildasScreen,
  "rede-social.html": RedeSocialScreen,
  "conquistas.html": ConquistasScreen,
  "bolsa.html": BolsaScreen,
  "mapa.html": MapaScreen,
  "match.html": MatchScreen,
  "revista.html": RevistaScreen,
  "vitrine.html": VitrineScreen,
  "hierarquia.html": HierarquiaScreen,
  "pesquisa.html": PesquisaScreen,
  "configuracoes.html": ConfiguracoesScreen,
  "perfil.html": PerfilScreen,
  "clube.html": ClubeScreen,
  "rede-completa.html": RedeCompletaScreen,
  "meus-acessos.html": AcessosScreen,
  "admin.html": AdminScreen,
  "chat.html": ChatScreen,
  "niveis.html": NiveisScreen,
  "academy.html": AcademyScreen,
  "eventos.html": EventosScreen,
  "noticias.html": NoticiasScreen,
  "musica.html": MusicaScreen,
  "assistente.html": AssistenteScreen,
};
const PAGINA = { "index.html": "inicio", "bolsa.html": "bolsa" };

function EmBreve({ titulo }) {
  return (
    <>
      <PageHead title={titulo} subtitle="Módulo existente no produto, fora do escopo deste kit." />
      <Panel fill>
        <EmptyState icon="camadas" title={titulo}
          description="Esta tela existe no produto (app/*.html) mas não foi recriada neste UI kit." />
      </Panel>
    </>
  );
}

/* Tela que ainda não tem dado no banco pode quebrar ao receber lista vazia.
   Em vez de tela em branco, mostra o estado vazio (TODO AH/AI). */
class TelaSegura extends React.Component {
  constructor(p) { super(p); this.state = { erro: null }; }
  static getDerivedStateFromError(erro) { return { erro }; }
  componentDidCatch(erro) { try { console.warn("[Reino] tela sem dados:", erro && erro.message); } catch (e) {} }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <Panel fill>
        <EmptyState icon="camadas" title="Ainda não há dados aqui"
          description="Esta parte do Reino ainda não tem dados no banco. Assim que tiver, ela aparece aqui." />
      </Panel>
    );
  }
}

function App() {
  const d = window.BABEL_DEMO;
  /* login real: undefined = conferindo a sessão salva; null = pedir login; objeto = conta do banco */
  const [conta, setConta] = React.useState(undefined);
  const [recuperacao, setRecuperacao] = React.useState(false);
  const [erroLogin, setErroLogin] = React.useState(""); /* motivo de não ter entrado: sem banco, fora do ar, link vencido */
  const [rota, setRota] = React.useState("index.html");
  const [menu, setMenu] = React.useState(false);
  const [gaveta, setGaveta] = React.useState(null);
  const [recolhido, setRecolhido] = React.useState(() => localStorage.getItem("reino.menu") === "recolhido");
  const [modo, setModo] = React.useState(() => localStorage.getItem("reino.modo") || "pc");
  // o item "Minha conta" é inserido aqui para não depender da versão compilada do menu
  const MENU = React.useMemo(() => {
    const base = window.BabelOSDesignSystem_5ad360.MENU_BABEL;
    const novo = base.slice();
    const por = (h) => novo.findIndex(([x]) => x === h);
    const antes = (item) => { const i = por("configuracoes.html"); novo.splice(i < 0 ? novo.length : i, 0, item); };
    // três telas novas que consomem a Edge Function reino-apis (dados públicos, sem login)
    if (por("noticias.html") < 0) antes(["noticias.html", "noticias", "Notícias do Reino"]);
    if (por("musica.html") < 0) antes(["musica.html", "grafico", "Música do Reino"]);
    if (por("assistente.html") < 0) antes(["assistente.html", "buscaIA", "Assistente do Reino"]);
    if (por("perfil.html") < 0) antes(["perfil.html", "tecnicos", "Minha conta"]);
    if (por("admin.html") < 0) antes(["admin.html", "clientes", "Contas no banco"]);
    return novo;
  }, []);
  React.useEffect(() => { localStorage.setItem("reino.menu", recolhido ? "recolhido" : "aberto"); }, [recolhido]);
  React.useEffect(() => {
    localStorage.setItem("reino.modo", modo);
    document.documentElement.classList.toggle("is-modo-app", modo === "app");
    window.dispatchEvent(new Event("resize"));
  }, [modo]);
  const Modo = (
    <div className="hg-modo" role="group" aria-label="Modo de exibição">
      <button type="button" aria-pressed={modo === "pc"} onClick={() => setModo("pc")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>PC
      </button>
      <button type="button" aria-pressed={modo === "app"} onClick={() => setModo("app")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>App
      </button>
    </div>
  );
  const ir = (href) => { setRota(href); setMenu(false); };

  /* conta de administrador: reina como Imperador, com o selo destacado e pulsante */
  const ehAdm = !!(conta && conta.token && conta.situacao === "admin"); /* situação lida do banco no login */
  const SeloImperador = ehAdm ? (
    <span className="hg-selo-imperador" title="Conta de administrador">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l4.2 3L12 4l4.8 7L21 8l-1.6 10H4.6L3 8Z" /></svg>Imperador
    </span>
  ) : null;

  React.useEffect(() => {
    // o cartão do usuário é um link; aqui ele vira navegação interna
    const clique = (e) => { const a = e.target.closest && e.target.closest(".hg-user"); if (a) { e.preventDefault(); ir("perfil.html"); } };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, []);
  React.useEffect(() => {
    // ao abrir: trata o link do e-mail (confirmação / nova senha) e retoma a sessão salva
    const C = window.ReinoContas;
    // só entra conta real do banco: sem banco, fora do ar ou sem sessão válida, fica no login com o motivo
    if (!C || !C.iniciar) { setErroLogin("Não foi possível carregar o login do Reino. Recarregue a página."); setConta(null); return; }
    C.iniciar().then((r) => {
      if (r.erro) setErroLogin("O link do e-mail não vale mais (" + r.erro + "). Peça outro.");
      else if (r.aviso) setErroLogin(r.aviso);
      if (r.recuperacao) { setRecuperacao(true); setConta(null); } else setConta(r.sessao && r.sessao.token ? r.sessao : null);
    }).catch((e) => { setErroLogin((e && e.message) || "Não foi possível conferir sua sessão agora. Tente de novo."); setConta(null); });
  }, []);
  React.useEffect(() => {
    document.body.dataset.page = PAGINA[rota] || rota.replace(".html", "");
    document.body.classList.toggle("is-imersivo", rota === "mapa.html");
  }, [rota]);

  // login imersivo (W): conversa + barra de comando; PortalLogin (O3) e LoginScreen ficam de reserva
  const TelaLogin = window.LoginImersivo || window.PortalLogin || LoginScreen;
  if (conta === undefined) return <div className="hg-moldura hg-moldura-login" aria-busy="true"><p className="hg-carregando-conta">Conferindo sua sessão…</p></div>;
  if (!conta) return (
    <div className="hg-moldura hg-moldura-login">
      <TelaLogin recuperacao={recuperacao} erroInicial={erroLogin}
        onEntrar={(s) => { const c = s || (window.ReinoContas && window.ReinoContas.sessao()) || null; setRecuperacao(false); setConta(c && c.token ? c : null); }} />
      {TelaLogin === LoginScreen ? (
        <div className="hg-modo hg-modo-login" role="group" aria-label="Modo de exibição">
          <button type="button" aria-pressed={modo === "pc"} onClick={() => setModo("pc")}>PC</button>
          <button type="button" aria-pressed={modo === "app"} onClick={() => setModo("app")}>App</button>
        </div>
      ) : null}
    </div>
  );
  if (rota === "pre-cadastro.html") return <PreCadastroScreen ir={ir} />;

  const Tela = TELAS[rota];
  const titulo = (MENU.find(([h]) => h === rota) || [, , rota])[2];

  return (
    <div className="hg-moldura">
      <div className={"hg-app" + (menu ? " is-menu" : "") + (recolhido ? " is-recolhido" : "")}>
        <Sidebar current={rota} items={MENU} onNavigate={ir} collapsed={recolhido} />
        <button type="button" className="hg-side-seta" onClick={() => setRecolhido((v) => !v)} aria-label={recolhido ? "Expandir menu" : "Recolher menu"} aria-expanded={!recolhido}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <div className="hg-main">
          <TopBar user={conta.nome || conta.email} role={[ehAdm ? "Imperador" : conta.titulo || "Título a definir", conta.cidade].filter(Boolean).join(" · ")} notifications messages
            onMenu={() => setMenu((v) => !v)} onNotifications={() => setGaveta("notificacoes")} onMessages={() => ir("chat.html")}
            actions={<>{SeloImperador}{Modo}</>} />
          <main className="hg-content">
            {conta.situacao !== "membro" && conta.situacao !== "admin" ? (
              <p className="hg-aviso-aprovacao" role="status">Sua conta aguarda a aprovação de um administrador. Enquanto isso, você já pode explorar o Reino.</p>
            ) : null}
            {Tela ? <TelaSegura key={rota}><Tela ir={ir} usuario={{ nome: conta.nome, titulo: conta.titulo, cidade: conta.cidade || "", uf: conta.uf || "", bairro: "" }} conta={conta} /></TelaSegura> : <EmBreve titulo={titulo} />}
          </main>
        </div>
      </div>
      <TabBar current={rota} onNavigate={ir} />
      <Drawer open={gaveta === "notificacoes"} title="Notificações" onClose={() => setGaveta(null)}>
        <ul className="hg-list">{d.notificacoes.map((n) => <ListRow key={n.titulo} title={n.titulo} subtitle={n.texto} time={n.quando} avatar={n.autor} />)}</ul>
      </Drawer>
    </div>
  );
}

Object.assign(window, { App });
