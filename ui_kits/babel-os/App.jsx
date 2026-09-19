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
const USUARIO = { ...(window.BABEL_DEMO ? window.BABEL_DEMO.perfil : {}), uf: "SP", cidade: "Campinas", bairro: "Cambuí" };

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

function App() {
  const d = window.BABEL_DEMO;
  const [logado, setLogado] = React.useState(() => sessionStorage.getItem("reino.logado") === "1");
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
  const ehAdm = React.useMemo(() => {
    try {
      const s = (window.ReinoContas && window.ReinoContas.sessao && window.ReinoContas.sessao()) || {};
      return !!s.token && s.situacao === "admin"; /* situação lida do banco no login */
    } catch (e) { return false; }
  }, []);
  const tituloAtual = ehAdm ? "Imperador" : d.perfil.titulo;
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
    document.body.dataset.page = PAGINA[rota] || rota.replace(".html", "");
    document.body.classList.toggle("is-imersivo", rota === "mapa.html");
  }, [rota]);

  if (!logado) return (
    <div className="hg-moldura hg-moldura-login">
      <LoginScreen onEntrar={() => { sessionStorage.setItem("reino.logado", "1"); setLogado(true); }} />
      <div className="hg-modo hg-modo-login" role="group" aria-label="Modo de exibição">
        <button type="button" aria-pressed={modo === "pc"} onClick={() => setModo("pc")}>PC</button>
        <button type="button" aria-pressed={modo === "app"} onClick={() => setModo("app")}>App</button>
      </div>
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
          <TopBar user={d.perfil.nome} role={tituloAtual + " · " + d.perfil.cidade} notifications messages
            onMenu={() => setMenu((v) => !v)} onNotifications={() => setGaveta("notificacoes")} onMessages={() => ir("chat.html")}
            actions={<>{SeloImperador}{Modo}<DemoBadge inline href="#">Dados fictícios</DemoBadge></>} />
          <main className="hg-content">
            {Tela ? <Tela ir={ir} usuario={USUARIO} /> : <EmBreve titulo={titulo} />}
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
