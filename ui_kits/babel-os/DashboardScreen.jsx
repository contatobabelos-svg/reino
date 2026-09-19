const { PageHead, Panel, Button, KpiCard, ProgressRing, MetricRow, ListRow, Pill, Icon,
  FeedPost, AffiliateLink, AffiliateLevel, DonutChart, LineChart, BarMetric, Stars, Tabs } = window.BabelOSDesignSystem_5ad360;

/* Widgets do Dashboard. Cada um pode ser ocultado no ✕ e volta pelo botão
   Personalizar; a escolha fica salva neste navegador. A grade recalcula as
   colunas conforme o que sobrou, então nada fica em cima de nada nem deixa buraco. */
const WIDGETS = {
  "kpi-afiliados": "Afiliados ativos", "kpi-bonus": "Bônus acumulado", "kpi-negocios": "Negócios fechados", "kpi-cidades": "Cidades ativas",
  social: "Rede social", mapa: "Mapa Reino", noticias: "Notícias", chat: "Bate Papo",
  conquistas: "Conquistas", match: "Match e alertas",
  reputacao: "Score de reputação", bolsa: "Bolsa de Valores", vendas: "Vendas", afiliado: "Link de afiliado",
};
const CHAVE = "reino.widgets.ocultos";

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

function DashboardScreen({ ir, usuario }) {
  const d = window.BABEL_DEMO;
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
  const colEsq = w.ve("social");
  const colCentro = w.ve("mapa") || w.ve("noticias") || w.ve("chat");
  const colDir = w.ve("conquistas") || w.ve("match");
  const colunas = [colEsq && "esquerda", colCentro && "centro", colDir && "direita"].filter(Boolean).join(" ");
  const kpis = ["kpi-afiliados", "kpi-bonus", "kpi-negocios", "kpi-cidades"].filter(w.ve);
  const analytics = ["reputacao", "bolsa", "vendas"].filter(w.ve);
  const escondidos = [...w.ocultos].filter((id) => WIDGETS[id]);

  return (
    <>
      <PageHead title={"Olá, " + d.perfil.nome.split(" ")[0]} subtitle="Veja o que está acontecendo no seu Reino hoje.">
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
          {colEsq ? (
            <div className="hg-col" data-zona="esquerda">
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
            </div>
          ) : null}

          {colCentro ? (
            <div className="hg-col" data-zona="centro">
              {w.ve("mapa") ? <MapaPanel usuario={usuario} subtitle={"Seu título mostra: " + alcance + ". Desça até o bairro para ver a rede de empresas."} onClose={() => w.esconder("mapa")} /> : null}
              {w.ve("noticias") ? (
                <Panel title="Notícias de afiliados e finanças" subtitle="Atualizado agora" headingLevel={3} onClose={() => w.esconder("noticias")}>
                  <ul className="hg-noticias">
                    {d.noticias.slice(0, 3).map((n) => (
                      <li key={n.titulo}><strong>{n.titulo}</strong><span><em>{n.tag}</em>{n.fonte} · {n.quando}</span></li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
              {w.ve("chat") ? (
                <Panel title="Bate Papo do Reino" subtitle="Só Marquês para cima envia mensagem" headingLevel={3} onClose={() => w.esconder("chat")}>
                  <ul className="hg-list">
                    {d.conversas.slice(0, 2).map((c) => (
                      <ListRow key={c.nome} title={c.nome} subtitle={c.ultima} avatar={c.nome}
                        right={c.naoLidas ? <Pill>{c.naoLidas}</Pill> : <time>{c.quando}</time>} />
                    ))}
                  </ul>
                  <Button variant="ghost" block onClick={() => ir("chat.html")}>Abrir o Bate Papo</Button>
                </Panel>
              ) : null}
            </div>
          ) : null}

          {colDir ? (
            <div className="hg-col" data-zona="direita">
              {w.ve("conquistas") ? (
                <Panel tone="conquistas" title="Conquistas" subtitle="Sua evolução no Reino" onClose={() => w.esconder("conquistas")}>
                  <ProgressRing value={64} label="até Príncipe" />
                  {d.metricas.map((m) => <MetricRow key={m.nome} name={m.nome} label={m.rotulo} value={m.percentual} />)}
                  <Button variant="ghost" block onClick={() => ir("conquistas.html")}>Ver conquistas</Button>
                </Panel>
              ) : null}
              {w.ve("match") ? (
                <Panel tone="match" fill title="Match e alertas" subtitle="Empresas complementares e o que pede atenção" onClose={() => w.esconder("match")}>
                  <div className="hg-rolar">
                    <ul className="hg-list">
                      {d.match.slice(0, 2).map((m) => (
                        <ListRow key={m.nome} title={m.nome} subtitle={m.nicho + " · " + m.cidade} avatarGradient="match" right={<Pill>{m.compatibilidade}%</Pill>} />
                      ))}
                      {d.alertas.map((al) => (
                        <li className="hg-row" key={al.titulo}>
                          <span className="hg-avatar" style={{ background: al.tipo === "alta" ? "linear-gradient(135deg,#ff4d7a,#e04bff)" : "linear-gradient(135deg,#3b82ff,#8b5cff)" }}>
                            <Icon name={al.tipo === "alta" ? "alerta" : "agenda"} />
                          </span>
                          <div><strong>{al.titulo}</strong><span>{al.texto}</span></div>
                          <time>{al.quando}</time>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button block onClick={() => ir("match.html")}>Ver todos os matches</Button>
                </Panel>
              ) : null}
            </div>
          ) : null}
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
              <div className={preCadastro ? "hg-trava-conteudo" : undefined}><LineChart points={d.negociosSemana.pontos} labels={d.negociosSemana.rotulos} highlight="342" /></div>
              {preCadastro
                ? <Button variant="ghost" block className="is-travado" icon="coroa" onClick={travar("A Bolsa de Valores")}>Desbloqueado ao ingressar no Reino</Button>
                : <Button variant="ghost" block onClick={() => ir("bolsa.html")}>Abrir a Bolsa</Button>}
            </Panel>
          ) : null}
          {w.ve("vendas") ? (
            <Panel tone="afiliado" title="Vendas" subtitle="Faturamento e eficiência de aquisição" headingLevel={3} onClose={() => w.esconder("vendas")}>
              <div className={preCadastro ? "hg-trava-conteudo" : undefined}><BarMetric items={d.vendas} /></div>
              {preCadastro
                ? <Button variant="green" block className="is-travado" icon="coroa" onClick={travar("Suas vendas e estatísticas")}>Desbloqueado ao ingressar no Reino</Button>
                : <Button variant="green" block onClick={() => ir("meus-acessos.html")}>Meus acessos e estatísticas</Button>}
            </Panel>
          ) : null}
        </section>
      ) : null}

      {w.ve("afiliado") ? <AffiliateLink link={window.ReinoAfiliados ? window.ReinoAfiliados.linkDe(window.ReinoAfiliados.meuCodigo(d.perfil.nome)) : a.link} indicados={a.indicados} comissoes={a.comissoesPendentes} onCopy={() => { const l = window.ReinoAfiliados.linkDe(window.ReinoAfiliados.meuCodigo(d.perfil.nome)); navigator.clipboard && navigator.clipboard.writeText(l).catch(() => {}); }} onClose={() => w.esconder("afiliado")} /> : null}
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
