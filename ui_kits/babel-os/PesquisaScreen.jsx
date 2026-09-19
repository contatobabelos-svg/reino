const { PageHead, Panel, Button, Input, Select, Toolbar, Table, Stars, EmptyState, ListRow, Pill } = window.BabelOSDesignSystem_5ad360;

/* app/pesquisa.html + paginas.pesquisa().
   O painel do Google Maps depende de RAPIDAPI_MAPS_KEY no servidor; aqui ele
   mostra o mesmo estado de indisponibilidade do produto. */
function PesquisaScreen() {
  const filtros = window.BabelDemo("reino/filtros", {});
  const [f, setF] = React.useState({ q: "", nicho: "", estado: "", cidade: "" });
  const [res, setRes] = React.useState(() => window.BabelDemo("reino/empresas", {}));
  const MAX = 80; // a demonstração tem 2.105 empresas; a tabela mostra as primeiras, como a lista de cidades do globo
  const visiveis = res.slice(0, MAX);
  const campo = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const pesquisar = (e) => { e.preventDefault(); setRes(window.BabelDemo("reino/empresas", f)); };
  return (
    <>
      <PageHead title="Busca Inteligente" subtitle="Encontre empresas por nicho, estado e cidade. A Vitrine Premium aparece no topo." />
      <div className="hg-duas hg-encher">
        <Panel fill>
          <Toolbar as="form" onSubmit={pesquisar} style={{ marginBottom: "1rem" }}>
            <Input name="q" type="search" placeholder="Nome ou descrição" aria-label="Texto" value={f.q} onChange={campo("q")} />
            <Select aria-label="Nicho" value={f.nicho} onChange={campo("nicho")}>
              <option value="">Todos os nichos</option>
              {(filtros.nichos || []).map((n) => <option key={n.nome}>{n.nome}</option>)}
            </Select>
            <Select aria-label="Estado" value={f.estado} onChange={campo("estado")}>
              <option value="">Todos os estados</option>
              {(filtros.estados || []).map((n) => <option key={n.nome}>{n.nome}</option>)}
            </Select>
            <Select aria-label="Cidade" value={f.cidade} onChange={campo("cidade")}>
              <option value="">Todas as cidades</option>
              {(filtros.cidades || []).map((n) => <option key={n.nome}>{n.nome}</option>)}
            </Select>
            <Button variant="cyan" type="submit">Pesquisar</Button>
          </Toolbar>
          <div className="hg-rolar">
            <p className="hg-globo-sobre" style={{ margin: "0 0 .4rem" }}>Vitrine Premium</p>
            <ul className="hg-list" style={{ marginBottom: "1rem" }}>
              {window.BABEL_DEMO.vitrinePremium.map((v) => (
                <ListRow key={v.nome} title={v.nome} subtitle={v.nicho + " · " + v.cidade}
                  right={<Pill>Premium</Pill>} />
              ))}
            </ul>
            <Table columns={["Empresa", "Nicho", "Cidade", "Abrangência", "Reputação"]}
              empty={<EmptyState icon="busca" title="Nenhuma empresa encontrada" description="Ajuste os filtros de nicho, estado e cidade." />}
              rows={visiveis.map((e) => [
                <strong style={{ color: "#fff" }}>{e.nome}</strong>,
                e.nicho || "—",
                (e.cidade || "—") + (e.estado ? " · " + e.estado : ""),
                e.abrangencia || "—",
                e.nota != null ? <><Stars value={e.nota} /> <small>({Number(e.avaliacoes || 0).toLocaleString("pt-BR")})</small></> : "—",
              ])} />
            {res.length > MAX ? (
              <p className="hg-sub" style={{ margin: ".6rem 0 0" }}>+ {(res.length - MAX).toLocaleString("pt-BR")} empresas — use os filtros para refinar.</p>
            ) : null}
          </div>
        </Panel>
        <Panel fill title="Empresas reais · Google Maps" subtitle="A mesma busca do cadastro do Reino, com os filtros acima.">
          <div className="hg-rolar">
            <EmptyState icon="alerta" title="Google Maps indisponível" description="Defina RAPIDAPI_MAPS_KEY no servidor." />
          </div>
        </Panel>
      </div>
    </>
  );
}

Object.assign(window, { PesquisaScreen });
