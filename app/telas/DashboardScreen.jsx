const { PageHead, Panel, Button, Input, KpiCard, ProgressRing, MetricRow, ListRow, Pill, Icon,
  FeedPost, AffiliateLink, AffiliateLevel, DonutChart, LineChart, BarMetric, Stars, Tabs } = window.BabelOSDesignSystem_5ad360;

/* Widgets do Dashboard. Cada um pode ser ocultado no ✕ e volta pelo botão
   Personalizar; a escolha fica salva neste navegador. A grade recalcula as
   colunas conforme o que sobrou, então nada fica em cima de nada nem deixa buraco. */
const WIDGETS = {
  "kpi-afiliados": "Afiliados ativos", "kpi-bonus": "Bônus acumulado", "kpi-negocios": "Negócios fechados", "kpi-cidades": "Cidades ativas",
  social: "Rede social", mapa: "Mapa Reino", noticias: "Notícias de tecnologia", ranking: "Ranking de afiliados", chat: "Bate Papo",
  musica: "Música", assistente: "Assistente",
  conquistas: "Conquistas", match: "Match e alertas",
  reputacao: "Score de reputação", bolsa: "Bolsa de Valores", vendas: "Vendas", afiliado: "Link de afiliado",
};
const CHAVE = "reino.widgets.ocultos";

/* Os três blocos abaixo (Notícias, Música, Assistente) falam com a mesma
   Edge Function pública reino-apis que já alimenta as telas cheias — cada
   widget busca só o essencial (5 manchetes, 3 faixas, 1 resposta) e tem um
   botão para "ver tudo" na tela completa. */
const FUNC_URL_APIS = "https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis";
const cabecalhosApi = () => ({ apikey: window.REINO_SUPABASE.anon, Authorization: "Bearer " + window.REINO_SUPABASE.anon, "Content-Type": "application/json" });
function chamarReinoApis(corpo) {
  return fetch(FUNC_URL_APIS, { method: "POST", headers: cabecalhosApi(), body: JSON.stringify(corpo) })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "Indisponível agora."); return j; });
}

function IconPausar() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14 }}><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>; }

/* Bloco Notícias: compacto (fica no topo da coluna da direita), sempre de
   Tecnologia. Mesmo serviço, mesmo cache, mesmos salvos e lidos da tela cheia;
   as matérias com foto vêm primeiro. Abre na hora com o que estava guardado e
   atualiza por trás. */
function MiniFoto({ n }) {
  const [falhou, setFalhou] = React.useState(false);
  const tem = !!n.imagem && !falhou;
  return (
    <span className="hg-nt-foto" data-tom={window.ReinoNoticias.tomDaFonte(n.fonte)}>
      {tem ? <img src={n.imagem} alt="" width="320" height="180" loading="lazy" decoding="async"
        referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
        : <span className="hg-nt-semfoto" aria-hidden="true"><span>{window.ReinoNoticias.iniciais(n.fonte)}</span></span>}
    </span>
  );
}
function NoticiasWidget({ onClose, ir }) {
  const N = window.ReinoNoticias;
  const pedido = React.useMemo(() => ({ tema: "tecnologia" }), []);
  const [itens, setItens] = React.useState(() => { const g = N.doCache(pedido); return g ? g.itens : null; });
  const [erro, setErro] = React.useState(null);
  const [lidas, setLidas] = React.useState(() => N.lidas());
  React.useEffect(() => {
    const ctrl = new AbortController();
    N.buscar(pedido, ctrl.signal)
      .then((d) => setItens(d.itens))
      .catch((e) => { if (e.name !== "AbortError") { setErro(e.message); setItens((v) => v || []); } });
    return () => ctrl.abort();
  }, [pedido, N]);
  const abrir = (n) => { N.marcarLida(n.link); setLidas(N.lidas()); };
  const lista = N.comFotoPrimeiro(itens || []).slice(0, 2);
  return (
    <Panel title="Notícias de tecnologia" headingLevel={3} onClose={onClose}>
      {itens === null ? <p className="hg-sub">Buscando manchetes…</p>
        : !lista.length ? <p className="hg-sub">{erro || "Nenhuma manchete agora."}</p>
        : (
          <div className="hg-nt hg-nt-mini hg-nt-compacto">
            <ul className="hg-nt-mini-lista">
              {lista.map((n) => (
                <li key={n.link} data-lida={lidas.indexOf(n.link) >= 0 ? "1" : "0"}>
                  <a href={n.link} target="_blank" rel="noopener noreferrer" onClick={() => abrir(n)}>
                    <MiniFoto n={n} />
                    <span style={{ display: "grid", gap: ".15rem" }}>
                      <strong>{n.titulo}</strong>
                      <span className="hg-nt-meta"><span className="hg-nt-veiculo">{n.fonte}</span>
                        {N.tempoRelativo(n.publicado) ? <><span aria-hidden="true">·</span><time dateTime={n.publicado}>{N.tempoRelativo(n.publicado)}</time></> : null}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      <Button variant="ghost" block onClick={() => ir("noticias.html")}>Ver todas</Button>
    </Panel>
  );
}

/* Bloco Ranking de afiliados: quem mais trouxe gente para o Reino. A função do
   banco devolve só o código e o total de cadastros; a própria conta aparece marcada. */
function RankingWidget({ onClose, ir, meuCodigo }) {
  const [estado, setEstado] = React.useState({ carregando: true, linhas: null });
  React.useEffect(() => {
    let vivo = true;
    const A = window.ReinoAfiliados;
    (A && A.ranking ? A.ranking(5) : Promise.resolve(null)).then((linhas) => { if (vivo) setEstado({ carregando: false, linhas }); });
    return () => { vivo = false; };
  }, []);
  const { carregando, linhas } = estado;
  return (
    <Panel tone="afiliado" title="Ranking de afiliados" subtitle="Cadastros por afiliado" headingLevel={3} onClose={onClose}>
      {carregando ? <p className="hg-sub">Carregando o ranking…</p>
        : linhas && linhas.length ? (
          <ol className="hg-titulos hg-rank-lista">
            {linhas.map((r, i) => (
              <li key={r.codigo}>
                <span className="hg-rank">{i + 1}</span>
                <strong className={r.codigo === meuCodigo ? "hg-gold" : ""}>{r.codigo}{r.codigo === meuCodigo ? " (você)" : ""}</strong>
                <b className="hg-rank-n" title={r.cadastros + (r.cadastros === 1 ? " cadastro" : " cadastros")}>{r.cadastros}</b>
              </li>
            ))}
          </ol>
        ) : <p className="hg-sub hg-rank-vazio">{linhas ? "O ranking aparece quando houver cadastros." : "O ranking não carregou agora. Tente de novo em instantes."}</p>}
      <Button variant="ghost" block onClick={() => ir("meus-acessos.html")}>Meus acessos e ranking</Button>
    </Panel>
  );
}

/* Lista que ocupa a altura livre do painel: renderiza todas as linhas, mede quantas cabem
   inteiras e mostra só essas (nada cortado ao meio, sem espaço enorme entre linhas). Onde o
   painel não estica (telas estreitas) a lista não é limitada e mostra tudo. */
function ListaQueEnche({ itens, tag = "ul", className = "hg-list" }) {
  const ref = React.useRef(null);
  const [n, setN] = React.useState(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    let t = 0, ultimo = Math.round(el.clientHeight);
    const ro = new ResizeObserver(() => {
      const h = Math.round(el.clientHeight);
      if (h === ultimo) return;
      ultimo = h; clearTimeout(t); t = setTimeout(() => setN(null), 80);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  React.useLayoutEffect(() => {
    if (n !== null) return;
    const el = ref.current;
    if (!el) return;
    const fim = el.getBoundingClientRect().bottom + 1;
    let cabem = 0;
    for (const f of el.children) { if (f.getBoundingClientRect().bottom <= fim) cabem++; else break; }
    setN(Math.max(1, cabem));
  }, [n, itens.length]);
  const Tag = tag;
  return <Tag ref={ref} className={className + " hg-lista-enche"}>{n === null ? itens : itens.slice(0, n)}</Tag>;
}

/* Distribuição dos painéis nas três colunas, sem buraco no fim de nenhuma delas.
   Cada painel tem uma altura estimada (o mapa conta a altura que ele cresce até ocupar a
   sobra). O desenho padrão já fica equilibrado; se alguém ocultar painéis, o último painel da
   coluna mais alta passa para a mais baixa enquanto isso deixar as colunas mais parecidas.
   O último painel de cada coluna estica até o fim da grade (app-shell.css). */
const ALTURA_PAINEL = { social: 465, conquistas: 392, chat: 440, mapa: 620, musica: 367, assistente: 239, noticias: 246, ranking: 372, match: 620 };
const COLUNAS_PADRAO = { esquerda: ["social", "musica", "chat"], centro: ["mapa", "conquistas", "assistente"], direita: ["noticias", "ranking", "match"] };
const ZONAS = ["esquerda", "centro", "direita"];
/* quem se adapta melhor à folga do fim da coluna (lista que se distribui): fica por último */
const ESTICA = { match: 9, chat: 8, ranking: 7, musica: 5, social: 4, conquistas: 3, assistente: 2, noticias: 1, mapa: 0 };
function distribuirPaineis(visivel) {
  const cols = {};
  ZONAS.forEach((z) => { cols[z] = COLUNAS_PADRAO[z].filter(visivel); });
  const alt = (ids) => ids.reduce((t, id) => t + ALTURA_PAINEL[id], 0) + Math.max(0, ids.length - 1) * 13;
  for (let i = 0; i < 8; i++) {
    const ordem = ZONAS.slice().sort((a, b) => alt(cols[b]) - alt(cols[a]));
    const alta = ordem[0], baixa = ordem[2];
    const movivel = cols[alta].filter((id) => id !== "mapa");
    if (!movivel.length) break;
    const mover = movivel[movivel.length - 1];
    if (alt(cols[alta]) - alt(cols[baixa]) <= ALTURA_PAINEL[mover] + 13) break;
    cols[alta] = cols[alta].filter((id) => id !== mover);
    cols[baixa] = cols[baixa].concat(mover);
  }
  ZONAS.forEach((z) => {
    const ids = cols[z];
    if (ids.length < 2 || ids.indexOf("mapa") >= 0) return;   // na coluna do mapa, é o mapa que absorve a folga
    const melhor = ids.reduce((a, b) => (ESTICA[b] > ESTICA[a] ? b : a));
    cols[z] = ids.filter((id) => id !== melhor).concat(melhor);
  });
  return cols;
}

const SUGESTOES_MUSICA_MINI = ["samba", "lo-fi para trabalhar", "sertanejo"];
/* Bloco Música: mini player com um único <audio> — some quando o Dashboard
   desmonta (troca de tela) ou quando o bloco é fechado. */
function MusicaWidget({ onClose, ir }) {
  const [busca, setBusca] = React.useState(SUGESTOES_MUSICA_MINI[0]);
  const [faixas, setFaixas] = React.useState(null);
  const [tocandoId, setTocandoId] = React.useState(null);
  const audioRef = React.useRef(null);
  if (!audioRef.current && typeof Audio !== "undefined") audioRef.current = new Audio();

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const aoTerminar = () => setTocandoId(null);
    a.addEventListener("ended", aoTerminar);
    return () => a.removeEventListener("ended", aoTerminar);
  }, []);
  React.useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []); // sai do Dashboard = para o som

  React.useEffect(() => {
    let vivo = true;
    setFaixas(null);
    chamarReinoApis({ rota: "musica", q: busca })
      .then((j) => { if (vivo) setFaixas((j.itens || []).slice(0, 3)); })
      .catch(() => { if (vivo) setFaixas([]); });
    return () => { vivo = false; };
  }, [busca]);

  const tocar = (f) => {
    const a = audioRef.current;
    if (!a) return;
    if (tocandoId === f.link) { a.pause(); setTocandoId(null); return; }
    a.pause(); a.src = f.previa; a.play().catch(() => {}); setTocandoId(f.link);
  };

  return (
    <Panel title="Música do Reino" subtitle="Prévias de 30 s" headingLevel={3} onClose={onClose}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", marginBottom: ".6rem" }}>
        {SUGESTOES_MUSICA_MINI.map((s) => (
          <button key={s} type="button" className="hg-pill" onClick={() => setBusca(s)}
            style={busca === s ? { color: "var(--cyan)", borderColor: "var(--cyan)" } : undefined}>{s}</button>
        ))}
      </div>
      {faixas === null ? <p className="hg-sub">Buscando faixas…</p>
        : !faixas.length ? <p className="hg-sub">Nada encontrado.</p>
        : (
          <ul className="hg-list">
            {faixas.map((f) => (
              <ListRow key={f.link} title={f.titulo} subtitle={f.artista}
                right={
                  <button type="button" className="hg-icon-btn" aria-label={tocandoId === f.link ? "Pausar prévia" : "Tocar prévia"} onClick={() => tocar(f)}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}>
                    {tocandoId === f.link ? <IconPausar /> : <Icon name="play" size={14} />}
                  </button>
                } />
            ))}
          </ul>
        )}
      <Button variant="ghost" block onClick={() => ir("musica.html")}>Abrir Música</Button>
    </Panel>
  );
}

/* Bloco Assistente: o rosto em pixel art + a última resposta, com atalho
   para a tela quando a resposta aponta para um lugar do app. */
function AssistenteWidget({ onClose, ir }) {
  const [campo, setCampo] = React.useState("");
  const [resposta, setResposta] = React.useState(null); // { texto, ir }
  const [estadoRosto, setEstadoRosto] = React.useState("repouso");
  const [enviando, setEnviando] = React.useState(false);

  const perguntar = (e) => {
    e.preventDefault();
    const pergunta = campo.trim();
    if (!pergunta || enviando) return;
    setEnviando(true);
    setEstadoRosto("pensando");
    chamarReinoApis({ rota: "assistente", pergunta })
      .then((j) => { setResposta({ texto: j.resposta, ir: j.ir || null }); setEstadoRosto("falando"); setTimeout(() => setEstadoRosto("repouso"), 900); })
      .catch((err) => { setResposta({ texto: err.message || "Não consegui responder agora.", ir: null }); setEstadoRosto("repouso"); })
      .finally(() => setEnviando(false));
    setCampo("");
  };

  const nome = resposta && resposta.ir ? nomeDaTelaMenu(resposta.ir) : null;

  return (
    <Panel title="Assistente do Reino" subtitle="Pergunte sobre o app" headingLevel={3} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: ".6rem" }}>
        <RostoPixel estado={estadoRosto} tamanho={48} />
        <p className="hg-sub" style={{ margin: 0 }} aria-live="polite">
          {resposta ? resposta.texto : "Oi! Pergunte sobre o mapa, as guildas, o match ou qualquer outra tela do app."}
        </p>
      </div>
      {nome ? <Button variant="cyan" block style={{ marginBottom: ".6rem" }} onClick={() => ir(resposta.ir)}>Abrir {nome}</Button> : null}
      <form onSubmit={perguntar} style={{ display: "flex", gap: ".4rem" }}>
        <label className="sr-only" htmlFor="assistente-widget-campo">Sua pergunta</label>
        <Input id="assistente-widget-campo" value={campo} onChange={(e) => setCampo(e.target.value)} placeholder="Pergunte algo…" style={{ flex: 1, minWidth: 0 }} disabled={enviando} />
        <Button type="submit" variant="cyan" disabled={enviando || !campo.trim()}>Ir</Button>
      </form>
      <Button variant="ghost" block style={{ marginTop: ".5rem" }} onClick={() => ir("assistente.html")}>Abrir Assistente</Button>
    </Panel>
  );
}
function nomeDaTelaMenu(href) {
  const menu = window.BabelOSDesignSystem_5ad360.MENU_BABEL || [];
  const item = menu.find(([h]) => h === href);
  return item ? item[2] : null;
}

function useWidgets() {
  const [ocultos, setOcultos] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CHAVE) || "[]")); } catch (e) { return new Set(); }
  });
  React.useEffect(() => { try { localStorage.setItem(CHAVE, JSON.stringify([...ocultos])); } catch (e) {} }, [ocultos]);
  const ve = (id) => !ocultos.has(id);
  const esconder = (id) => setOcultos((s) => new Set([...s, id]));
  const mostrar = (id) => setOcultos((s) => { const n = new Set(s); n.delete(id); return n; });
  const restaurar = () => setOcultos(new Set());
  return { ocultos, ve, esconder, mostrar, restaurar };
}

function DashboardScreen({ ir, usuario, conta }) {
  const d = window.BABEL_DEMO;
  /* quem está logado: o nome (e o código de afiliado que sai dele) vem da conta, não do perfil de demonstração */
  const nomeConta = (conta && String(conta.nome || "").trim()) || (conta && conta.email ? String(conta.email).split("@")[0] : "");
  const perfil = { ...d.perfil, nome: nomeConta || d.perfil.nome };
  const a = d.afiliado;
  const w = useWidgets();
  const [grupo, setGrupo] = React.useState(d.gruposFeed[0]);
  // seletor ‹ › entre os grupos de título; o feed mostra só autores daquele título
  const TITULO_AUTOR = { "Ana Ribeiro": "Rei", "Camila Duarte": "Duque", "Eduarda Lopes": "Conde", "Henrique Alves": "Príncipe", "Gabriela Rocha": "Duque", "Felipe Nunes": "Duque", "Marcelo": "Imperador" };
  // Pré-cadastro: enquanto o ingresso não é confirmado, os módulos sociais ficam
  // fechados e o painel explica o que falta. A situação vem do perfil.
  // quem entra por "Criar conta" fica em pré-cadastro até o ingresso ser confirmado
  const preCadastro = ((typeof localStorage !== "undefined" && localStorage.getItem("reino.situacao")) || d.perfil.situacao || "") === "pre-cadastro";
  const escolhido = (typeof localStorage !== "undefined" && localStorage.getItem("reino.tituloEscolhido")) || d.perfil.titulo;
  const [travaAviso, setTravaAviso] = React.useState("");
  // no pré-cadastro os módulos pagos ficam trancados: o toque explica o que falta
  const travar = (nome) => (e) => { e.preventDefault(); setTravaAviso(nome); setTimeout(() => setTravaAviso(""), 3200); };
  const gi = d.gruposFeed.indexOf(grupo);
  const mudarGrupo = (dir) => setGrupo(d.gruposFeed[(gi + dir + d.gruposFeed.length) % d.gruposFeed.length]);
  const tituloGrupo = grupo.replace("Grupo de ", "");
  const feedGrupo = d.feed.filter((p) => TITULO_AUTOR[p.autor] === tituloGrupo);
  const SeletorGrupo = (
    <div className="hg-seletor" role="group" aria-label="Grupo de título">
      <button type="button" onClick={() => mudarGrupo(-1)} aria-label="Grupo anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg></button>
      <span key={grupo} className="hg-seletor-valor"><Icon name="coroa" size={13} />{tituloGrupo}<small>{gi + 1}/{d.gruposFeed.length}</small></span>
      <button type="button" onClick={() => mudarGrupo(1)} aria-label="Próximo grupo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button>
    </div>
  );
  const [personalizando, setPersonalizando] = React.useState(false);
  const alcance = d.regras.alcanceMapa[d.perfil.titulo] || d.regras.alcanceMapaPadrao;

  /* colunas de operação: só as que têm algum widget visível entram na grade */
  const cols = distribuirPaineis(w.ve);
  const colunas = ZONAS.filter((z) => cols[z].length).join(" ");
  const kpis = ["kpi-afiliados", "kpi-bonus", "kpi-negocios", "kpi-cidades"].filter(w.ve);
  const analytics = ["reputacao", "bolsa", "vendas"].filter(w.ve);
  const escondidos = [...w.ocultos].filter((id) => WIDGETS[id]);

  /* resumo do gráfico da Bolsa, calculado dos próprios pontos: enche o painel com informação */
  const resumoBolsa = (() => {
    const pts = d.negociosSemana.pontos, rot = d.negociosSemana.rotulos, soma = pts.reduce((t, v) => t + v, 0);
    return { total: soma.toLocaleString("pt-BR"), media: Math.round(soma / pts.length).toLocaleString("pt-BR"), melhor: rot[pts.indexOf(Math.max(...pts))] };
  })();

  /* matches e alertas intercalados: mesmo com poucas linhas visíveis aparece um pouco de cada */
  const linhasMatch = (() => {
    const m = d.match.map((x) => <ListRow key={"m" + x.nome} title={x.nome} subtitle={x.nicho + " · " + x.cidade} avatarGradient="match" right={<Pill>{x.compatibilidade}%</Pill>} />);
    const a = d.alertas.map((al) => (
      <li className="hg-row" key={"a" + al.titulo}>
        <span className="hg-avatar" style={{ background: al.tipo === "alta" ? "linear-gradient(135deg,#ff4d7a,#e04bff)" : "linear-gradient(135deg,#3b82ff,#8b5cff)" }}>
          <Icon name={al.tipo === "alta" ? "alerta" : "agenda"} />
        </span>
        <div><strong>{al.titulo}</strong><span>{al.texto}</span></div>
        <time>{al.quando}</time>
      </li>
    ));
    const out = [];
    for (let k = 0; k < Math.max(m.length, a.length); k++) { if (m[k]) out.push(m[k]); if (a[k]) out.push(a[k]); }
    return out;
  })();

  const paineis = {
    social: () => (
      <Panel tone="social" fill title="Rede social e feed de negócios" subtitle="Publicações do seu grupo de título" onClose={() => w.esconder("social")}
        actions={SeletorGrupo}>
        <div className={"hg-timeline hg-rolar" + (preCadastro ? " is-bloqueada" : "")} key={grupo} aria-hidden={preCadastro || undefined}>
          {feedGrupo.length ? feedGrupo.slice(0, 4).map((p) => <PostRS key={p.autor} {...p} titulo={TITULO_AUTOR[p.autor]} />)
            : <p className="hg-sub" style={{ padding: "1.2rem .6rem", textAlign: "center" }}>Ninguém do grupo de {tituloGrupo} publicou ainda. Seja o primeiro na rede social.</p>}
        </div>
        {preCadastro ? (
          <div className="hg-pre-aviso" role="note">
            <span className="hg-pre-aviso-ico"><Icon name="coroa" /></span>
            <strong>Seu ingresso está em análise</strong>
            <p>Você está no pré-cadastro: já reservou {escolhido ? <b>{escolhido}</b> : "seu título"} e o território. A rede social, as guildas e o Match abrem quando seu ingresso no Reino for confirmado.</p>
            <Button variant="cyan" block icon="coroa" onClick={() => ir("pre-cadastro.html")}>Concluir meu ingresso</Button>
            <span className="hg-sub">Enquanto isso, você pode explorar o mapa e acompanhar a bolsa.</span>
          </div>
        ) : <Button block onClick={() => ir("rede-social.html")}>Abrir rede social</Button>}
      </Panel>
    ),
    conquistas: () => (
      <Panel tone="conquistas" title="Conquistas" subtitle="Sua evolução no Reino" onClose={() => w.esconder("conquistas")}>
        <ProgressRing value={64} label="até Príncipe" />
        {d.metricas.map((m) => <MetricRow key={m.nome} name={m.nome} label={m.rotulo} value={m.percentual} />)}
        <Button variant="ghost" block onClick={() => ir("conquistas.html")}>Ver conquistas</Button>
      </Panel>
    ),
    chat: () => (
      <Panel className="hg-painel-chat" title="Bate Papo do Reino" subtitle="Só Marquês para cima envia mensagem" headingLevel={3} onClose={() => w.esconder("chat")}>
        <ListaQueEnche itens={d.conversas.map((c) => (
          <ListRow key={c.nome} title={c.nome} subtitle={c.ultima} avatar={c.nome}
            right={c.naoLidas ? <Pill>{c.naoLidas}</Pill> : <time>{c.quando}</time>} />
        ))} />
        <Button variant="ghost" block onClick={() => ir("chat.html")}>Abrir o Bate Papo</Button>
      </Panel>
    ),
    mapa: () => <MapaPanel usuario={usuario} subtitle={"Seu título mostra: " + alcance + ". Desça até o bairro para ver a rede de empresas."} onClose={() => w.esconder("mapa")} />,
    musica: () => <MusicaWidget ir={ir} onClose={() => w.esconder("musica")} />,
    assistente: () => <AssistenteWidget ir={ir} onClose={() => w.esconder("assistente")} />,
    noticias: () => <NoticiasWidget ir={ir} onClose={() => w.esconder("noticias")} />,
    ranking: () => <RankingWidget ir={ir} meuCodigo={window.ReinoAfiliados ? window.ReinoAfiliados.meuCodigo(perfil.nome) : ""} onClose={() => w.esconder("ranking")} />,
    match: () => (
      <Panel className="hg-painel-match" tone="match" fill title="Match e alertas" subtitle="Empresas complementares e o que pede atenção" onClose={() => w.esconder("match")}>
        <ListaQueEnche itens={linhasMatch} />
        <Button block onClick={() => ir("match.html")}>Ver todos os matches</Button>
      </Panel>
    ),
  };

  return (
    <>
      <PageHead title={"Olá, " + perfil.nome.split(" ")[0]} subtitle="Veja o que está acontecendo no seu Reino hoje.">
        <div className="hg-head-acoes">
          <AffiliateLevel level={a.nivel} indicados={a.indicados} proximo={a.proximo} progress={a.progresso} compact />
          <Button variant={personalizando ? "cyan" : "ghost"} icon="visao" onClick={() => setPersonalizando((v) => !v)} aria-expanded={personalizando}>
            Personalizar{escondidos.length ? " (" + escondidos.length + ")" : ""}
          </Button>
        </div>
      </PageHead>

      {personalizando ? (
        <div className="hg-widgets-barra" role="region" aria-label="Widgets ocultos">
          {escondidos.length ? (
            <>
              <span className="hg-sub">Mostrar de novo:</span>
              {escondidos.map((id) => <button key={id} className="hg-widget-chip" onClick={() => w.mostrar(id)}><Icon name="mais" />{WIDGETS[id]}</button>)}
              <Button variant="ghost" onClick={w.restaurar}>Restaurar tudo</Button>
            </>
          ) : <span className="hg-sub">Todos os widgets estão visíveis. Use o ✕ de cada um para ocultar; a grade fecha o espaço sozinha.</span>}
        </div>
      ) : null}

      {kpis.length ? (
        <section className="hg-kpis" aria-label="Indicadores do Reino" data-itens={kpis.length}>
          {w.ve("kpi-afiliados") ? <KpiCard label="Afiliados ativos" value={String(a.indicados)} trend={12} foot="nesta semana" onClose={() => w.esconder("kpi-afiliados")} /> : null}
          {w.ve("kpi-bonus") ? <KpiCard label="Bônus acumulado" value={"R$ " + a.comissoesPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} size="1.5rem" trend={8} foot="a receber" onClose={() => w.esconder("kpi-bonus")} /> : null}
          {w.ve("kpi-negocios") ? <KpiCard label="Negócios fechados" value="32" trend={6} foot="nesta semana" onClose={() => w.esconder("kpi-negocios")} /> : null}
          {w.ve("kpi-cidades") ? <KpiCard label="Cidades ativas" value="346" trend={4} foot="nesta semana" onClose={() => w.esconder("kpi-cidades")} /> : null}
        </section>
      ) : null}

      {colunas ? (
        <section className="hg-ops" data-colunas={colunas}>
          {ZONAS.filter((z) => cols[z].length).map((z) => (
            <div className="hg-col" data-zona={z} key={z}>
              {cols[z].map((id) => <React.Fragment key={id}>{paineis[id]()}</React.Fragment>)}
            </div>
          ))}
        </section>
      ) : null}

      {analytics.length ? (
        <section className="hg-analytics" aria-label="Analytics do Reino" data-itens={analytics.length}>
          {w.ve("reputacao") ? (
            <Panel tone="reputacao" title="Score de reputação" subtitle="Comentários e classificação recebidos" headingLevel={3} onClose={() => w.esconder("reputacao")}>
              <DonutChart segments={d.statusNegocios} total="100" label="negócios" />
              <div className="hg-rep-resumo">
                <div><span className="hg-sub">Classificação</span><Stars value={4.6} showValue /></div>
                <div><span className="hg-sub">Comentários</span><b>184</b></div>
              </div>
            </Panel>
          ) : null}
          {w.ve("bolsa") ? (
            <Panel title="Bolsa de Valores" subtitle="Negócios fechados por dia" headingLevel={3} onClose={() => w.esconder("bolsa")}>
              <div className={"hg-analise-corpo" + (preCadastro ? " hg-trava-conteudo" : "")}>
                <LineChart points={d.negociosSemana.pontos} labels={d.negociosSemana.rotulos} highlight="342" />
                <div className="hg-resumo-3">
                  <div><span className="hg-sub">Total da semana</span><b>{resumoBolsa.total}</b></div>
                  <div><span className="hg-sub">Média por dia</span><b>{resumoBolsa.media}</b></div>
                  <div><span className="hg-sub">Melhor dia</span><b>{resumoBolsa.melhor}</b></div>
                </div>
              </div>
              {preCadastro
                ? <Button variant="ghost" block className="is-travado" icon="coroa" onClick={travar("A Bolsa de Valores")}>Desbloqueado ao ingressar no Reino</Button>
                : <Button variant="ghost" block onClick={() => ir("bolsa.html")}>Abrir a Bolsa</Button>}
            </Panel>
          ) : null}
          {w.ve("vendas") ? (
            <Panel tone="afiliado" title="Vendas" subtitle="Faturamento e eficiência de aquisição" headingLevel={3} onClose={() => w.esconder("vendas")}>
              <div className={"hg-analise-corpo" + (preCadastro ? " hg-trava-conteudo" : "")}><BarMetric items={d.vendas} /></div>
              {preCadastro
                ? <Button variant="green" block className="is-travado" icon="coroa" onClick={travar("Suas vendas e estatísticas")}>Desbloqueado ao ingressar no Reino</Button>
                : <Button variant="green" block onClick={() => ir("meus-acessos.html")}>Meus acessos e estatísticas</Button>}
            </Panel>
          ) : null}
        </section>
      ) : null}

      {w.ve("afiliado") ? <AffiliateLink link={window.ReinoAfiliados ? window.ReinoAfiliados.linkDe(window.ReinoAfiliados.meuCodigo(perfil.nome)) : a.link} indicados={a.indicados} comissoes={a.comissoesPendentes} onCopy={() => { const l = window.ReinoAfiliados.linkDe(window.ReinoAfiliados.meuCodigo(perfil.nome)); navigator.clipboard && navigator.clipboard.writeText(l).catch(() => {}); }} onClose={() => w.esconder("afiliado")} /> : null}
      {travaAviso ? (
        <div className="hg-trava-toast" role="status">
          <span className="hg-pre-aviso-ico"><Icon name="coroa" /></span>
          <div>
            <strong>{travaAviso} está trancada</strong>
            <span>Desbloqueia quando seu ingresso no Reino for confirmado.</span>
          </div>
          <Button variant="cyan" onClick={() => ir("pre-cadastro.html")}>Concluir ingresso</Button>
        </div>
      ) : null}
    </>
  );
}

Object.assign(window, { DashboardScreen });
