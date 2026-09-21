const { Panel, Button, Select, Field, Toolbar, Pill, TitleChip, AffiliateLink, Icon } = window.BabelOSDesignSystem_5ad360;

/* Tela pública: cabeçalho próprio (sem menu lateral) e o mapa do Brasil. */
function PreCadastroScreen({ ir }) {
  const d = window.BABEL_DEMO;
  const [titulo, setTitulo] = React.useState("Duque");
  React.useEffect(() => { localStorage.setItem("reino.tituloEscolhido", titulo); }, [titulo]);
  const escolhido = d.titulos.find((t) => t.nome === titulo);
  return (
    <>
      <header className="hg-top hg-top-publico">
        <a className="hg-brand" href="#" style={{ padding: 0 }}>
          <span className="hg-brand-coroa"><Icon name="coroa" /></span>
          <span>Rei<b>no</b></span>
        </a>
        <span className="hg-sub">Pré-cadastro no Reino</span>
        <Button variant="ghost" style={{ marginLeft: "auto" }} onClick={() => ir("index.html")}>Já tenho conta</Button>
      </header>
      <main className="hg-content hg-pre">
        <div className="hg-page-head">
          <div><h1>Escolha seu território no Reino</h1><p>O seu título define o tamanho do mapa que você comanda.</p></div>
          <div className="hg-topo"><AffiliateLink link={d.afiliado.link} aviso="Indicado por Ana Ribeiro." onCopy={() => {}} /></div>
        </div>

        <Panel title="1 · Seu título" subtitle="Imperador vê o Brasil · Rei, o Brasil por regiões · Príncipe, uma região · Duque ou abaixo, um estado com as cidades">
          <div className="hg-titulos-nivel" role="radiogroup" aria-label="Título">
            {d.titulos.map((t) => (
              <TitleChip key={t.nome} nome={t.nome} descricao={t.descricao} mensalidade={t.mensalidade}
                selected={titulo === t.nome} onSelect={() => setTitulo(t.nome)} />
            ))}
          </div>
        </Panel>

        <Panel className="hg-map-panel hg-pre-mapa" fill title="2 · Mapa do Reino"
          subtitle="Clique no estado para ver as cidades com empresas cadastradas"
          actions={<Pill as="span">{escolhido.nome} · um estado</Pill>}>
          <Toolbar className="hg-pre-filtros" aria-label="Filtros">
            <span className="hg-sub" style={{ display: "flex", alignItems: "center", gap: ".35rem" }}><Icon name="filtro" size={16} />Filtros</span>
            <Field inline label="Região"><Select defaultValue="Sudeste">{d.regioes.map((r) => <option key={r.nome}>{r.nome}</option>)}</Select></Field>
            <Field inline label="Estado"><Select defaultValue="São Paulo"><option>São Paulo</option><option>Minas Gerais</option><option>Rio de Janeiro</option></Select></Field>
            <Field inline label="Cidade"><Select defaultValue="Campinas"><option>Campinas</option><option>São Paulo</option><option>Santos</option></Select></Field>
            <Field inline label="Nicho"><Select><option>Todos os nichos</option><option>Contabilidade</option><option>Advocacia</option></Select></Field>
          </Toolbar>
          <div className="hg-br-wrap">
            <div className="hg-map-scan" />
            <div className="hg-empty">
              <span className="hg-empty-ico"><Icon name="mapa" /></span>
              <strong>Mapa do Brasil</strong>
              <span>Os contornos vêm de svg-maps (Victor Cazanave, CC BY 4.0) via brasil.js no produto; não foram recriados neste kit.</span>
            </div>
          </div>
          <p className="hg-credito">Contornos: svg-maps (Victor Cazanave), CC BY 4.0</p>
        </Panel>

        <Panel className="hg-resumo" aria-live="polite">
          <div><span className="hg-sub">Título</span><b>{escolhido.nome}</b></div>
          <div><span className="hg-sub">Território</span><b>São Paulo · 402 empresas</b></div>
          <span className="hg-sub">R$ {escolhido.mensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</span>
          <Button variant="cyan" onClick={() => { try { localStorage.setItem("reino.situacao", "membro"); } catch (e) {} ir("index.html"); }}>Confirmar ingresso no Reino →</Button>
        </Panel>
      </main>
    </>
  );
}

Object.assign(window, { PreCadastroScreen });
