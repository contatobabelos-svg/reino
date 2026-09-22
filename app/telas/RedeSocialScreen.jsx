const { Button, Icon, ListRow, Pill, Avatar } = window.BabelOSDesignSystem_5ad360;

/* Rede social em linha do tempo: navegação do feed · publicações · lateral.
   SocialPost e SocialComposer vêm do design system quando o bundle os incluir;
   até lá, as versões locais abaixo são idênticas às de components/reino/. */
const arrobaRS = (nome) => "@" + String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const numRS = (n) => (n >= 1000 ? (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : String(n ?? 0));

function PostRS({ autor, empresa, titulo, quando, texto, curtidas = 0, comentarios = 0, repostagens = 0, onAbrir }) {
  const [liked, setLiked] = React.useState(false);
  const [likes, setLikes] = React.useState(curtidas);
  const [rep, setRep] = React.useState(false);
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(); };
  return (
    <article className={"hg-tweet" + (onAbrir ? " is-clicavel" : "")} onClick={onAbrir}>
      <FotoAvatar nome={autor} />
      <div className="hg-tweet-corpo">
        <header className="hg-tweet-cab">
          <strong>{autor}</strong>
          {titulo ? <span className="hg-tweet-selo" title={"Título: " + titulo}><Icon name="coroa" /></span> : null}
          <span className="hg-tweet-meta">{arrobaRS(autor)}{empresa ? " · " + empresa : ""}{quando ? " · " + quando : ""}</span>
        </header>
        {titulo ? <span className="hg-tweet-titulo">{titulo}</span> : null}
        <p className="hg-tweet-texto">{texto}</p>
        <footer className="hg-tweet-acoes">
          <button type="button" onClick={stop()} aria-label="Responder"><Icon name="msg" /><span>{numRS(comentarios)}</span></button>
          <button type="button" className={rep ? "is-on is-verde" : ""} onClick={stop(() => setRep((v) => !v))} aria-label="Repostar"><Icon name="rota" /><span>{numRS(repostagens + (rep ? 1 : 0))}</span></button>
          <button type="button" className={liked ? "is-on is-rosa" : ""} onClick={stop(() => { setLikes((n) => n + (liked ? -1 : 1)); setLiked((v) => !v); })} aria-label="Curtir" aria-pressed={liked}>
            <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 20.8 8.6 19.5 11.7 17.5 16.4 12 21 12 21z" /></svg>
            <span>{numRS(likes)}</span>
          </button>
          <button type="button" onClick={stop()} aria-label="Compartilhar"><Icon name="link" /></button>
        </footer>
      </div>
    </article>
  );
}

function ComporRS({ autor, onPublicar }) {
  const [texto, setTexto] = React.useState("");
  const resto = 280 - texto.length;
  const enviar = (e) => { e.preventDefault(); if (!texto.trim() || resto < 0) return; onPublicar(texto.trim()); setTexto(""); };
  return (
    <form className="hg-compor" onSubmit={enviar}>
      <FotoAvatar nome={autor} />
      <div className="hg-compor-corpo">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que está acontecendo no Reino?" rows={texto ? 3 : 2} aria-label="Nova publicação" />
        <div className="hg-compor-rodape">
          <div className="hg-compor-extras">
            <button type="button" aria-label="Imagem"><Icon name="vitrine" /></button>
            <button type="button" aria-label="Localização"><Icon name="pin" /></button>
            <button type="button" aria-label="Empresa"><Icon name="camadas" /></button>
          </div>
          <div className="hg-compor-envio">
            {texto ? <span className={"hg-compor-conta" + (resto < 20 ? " is-alerta" : "")}>{resto}</span> : null}
            <Button variant="cyan" type="submit" disabled={!texto.trim() || resto < 0}>Publicar</Button>
          </div>
        </div>
      </div>
    </form>
  );
}

const TITULO_POR_AUTOR = { "Ana Ribeiro": "Rei", "Camila Duarte": "Duque", "Eduarda Lopes": "Conde", "Henrique Alves": "Príncipe", "Gabriela Rocha": "Duque", "Felipe Nunes": "Duque" };
const NAV_RS = [["inicio", "visao", "Início"], ["explorar", "busca", "Explorar"], ["notificacoes", "sino", "Notificações"], ["mensagens", "msg", "Mensagens"], ["guildas", "guilda", "Guildas"], ["perfil", "tecnicos", "Perfil"]];

function RedeSocialScreen({ ir, conta }) {
  const d = window.BABEL_DEMO;
  /* a conta logada (os dados de exemplo foram apagados, TODO AI) */
  const eu = (conta && conta.nome) || "Você";
  const meuTitulo = (conta && (conta.situacao === "admin" ? "Imperador" : conta.titulo)) || "";
  const st = useStories(eu);
  const [combina, setCombina] = React.useState([]);
  React.useEffect(() => { if (window.ReinoRede) window.ReinoRede.matches(conta && conta.id).then((m) => setCombina(m.filter((x) => x.meu).slice(0, 3))).catch(() => {}); }, []);
  const empresasMarcaveis = React.useMemo(() => [...new Set([...d.feed.map((p) => p.empresa), ...d.match.map((m) => m.nome), ...d.guildas.map((g) => g.nome)].filter(Boolean))], []);
  const [aba, setAba] = React.useState("para-voce");
  const [nav, setNav] = React.useState("inicio");
  const [feed, setFeed] = React.useState(() => d.feed.map((p, i) => ({ ...p, titulo: TITULO_POR_AUTOR[p.autor], repostagens: [3, 5, 11, 1, 7, 2][i % 6] })));
  const publicar = (texto) => setFeed((f) => [{ autor: eu, empresa: "Você", titulo: meuTitulo, quando: "agora", texto, curtidas: 0, comentarios: 0, repostagens: 0 }, ...f]);
  const lista = aba === "seguindo" ? feed.filter((p) => ["Ana Ribeiro", "Felipe Nunes", eu].includes(p.autor)) : aba === "grupo" ? feed.filter((p) => p.titulo === meuTitulo) : feed;
  const tendencias = []; /* as tendências de exemplo foram apagadas (TODO AI); sem tabela de hashtags ainda */
  return (
    <div className="hg-social">
      <nav className="hg-social-nav" aria-label="Rede social">
        {NAV_RS.map(([id, icone, rotulo]) => (
          <button key={id} type="button" aria-pressed={nav === id} onClick={() => { setNav(id); if (id === "guildas") ir("guildas.html"); if (id === "mensagens") ir("chat.html"); }}>
            <Icon name={icone} /><span>{rotulo}</span>
          </button>
        ))}
        <Button variant="primary" onClick={() => document.querySelector(".hg-compor textarea")?.focus()}><Icon name="mais" /><span>Publicar</span></Button>
      </nav>

      <section className="hg-social-feed" aria-label="Linha do tempo">
        <div className="hg-social-topo">
          <h1>Rede social</h1>
          <div className="hg-social-abas" role="tablist">
            <button role="tab" aria-selected={aba === "para-voce"} onClick={() => setAba("para-voce")}>Para você</button>
            <button role="tab" aria-selected={aba === "seguindo"} onClick={() => setAba("seguindo")}>Seguindo</button>
            <button role="tab" aria-selected={aba === "grupo"} onClick={() => setAba("grupo")}>Grupo de {meuTitulo}</button>
          </div>
        </div>
        <StoriesBar stories={st.stories} eu={eu} onAbrir={st.abrir} onCriar={st.criar} />
        <ComporRS autor={eu} onPublicar={publicar} />
        <div className="hg-timeline">
          {lista.map((p, i) => <PostRS key={p.autor + i} {...p} />)}
          {lista.length === 0 ? <p className="hg-sub" style={{ padding: "2rem 1rem", textAlign: "center" }}>Ninguém do seu grupo publicou ainda. Seja o primeiro.</p> : null}
        </div>
      </section>

      <aside className="hg-social-lado">
        <label className="hg-social-busca"><Icon name="busca" /><input type="search" placeholder="Buscar no Reino" /></label>
        <div className="hg-social-bloco">
          <h3>Quem combina com você</h3>
          {combina.map((m) => (
            <ListRow key={m.id} title={m.nome} subtitle={m.nicho + " · " + m.cidade} avatarGradient="match" right={<Button variant="ghost" onClick={() => ir("chat.html")}>Network</Button>} />
          ))}
          {combina.length ? null : <p className="hg-sub">Seus matches aparecem aqui.</p>}
          <a href="#" onClick={(e) => { e.preventDefault(); ir("match.html"); }}>Ver todos os matches</a>
        </div>
        <div className="hg-social-bloco">
          <h3>Em alta no Reino</h3>
          {tendencias.map(([cat, tag, qtd]) => (<a key={tag} className="hg-social-tend" href="#" onClick={(e) => e.preventDefault()}><small>{cat}</small><b>{tag}</b><span>{qtd}</span></a>))}
          <a href="#" onClick={(e) => { e.preventDefault(); ir("pesquisa.html"); }}>Mostrar mais</a>
        </div>
      </aside>
      {st.aberto ? ReactDOM.createPortal(<StoryViewer stories={st.stories} autor={st.aberto} eu={eu} onFechar={st.fechar} onTrocarAutor={st.abrir} onVisto={st.visto} onCurtir={st.curtir} onResponder={st.responder} onRepostar={st.repostar} onApagar={st.apagar} />, document.body) : null}
      {st.criando ? ReactDOM.createPortal(<StoryComposer eu={eu} empresas={empresasMarcaveis} inicial={st.criando.inicial} onPublicar={st.publicar} onFechar={st.cancelar} />, document.body) : null}
    </div>
  );
}

Object.assign(window, { RedeSocialScreen, PostRS });
