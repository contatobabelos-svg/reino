const { PageHead, Panel, Button, Select, Toolbar, Field, AchievementBadge, EmptyState, AffiliateLevel } = window.BabelOSDesignSystem_5ad360;

/* Módulo novo: ofertas que as empresas do Reino abrem para os outros membros. */
function ClubeScreen() {
  const d = window.BABEL_DEMO;
  const [nicho, setNicho] = React.useState("");
  const lista = nicho ? d.beneficios.filter((b) => b.nicho === nicho) : d.beneficios;
  const nichos = [...new Set(d.beneficios.map((b) => b.nicho))];
  return (
    <>
      <PageHead title="Clube de Benefícios" subtitle="Ofertas que as empresas do Reino abrem para os outros membros.">
        <div className="hg-head-acoes"><AffiliateLevel level={d.afiliado.nivel} indicados={d.afiliado.indicados} proximo={d.afiliado.proximo} compact /></div>
      </PageHead>
      <Panel tone="afiliado" fill title="Ofertas disponíveis" subtitle={lista.length + " de " + d.beneficios.length + " ofertas"}
        actions={<Toolbar><Field inline label="Nicho">
          <Select value={nicho} onChange={(e) => setNicho(e.target.value)}>
            <option value="">Todos os nichos</option>
            {nichos.map((n) => <option key={n}>{n}</option>)}
          </Select>
        </Field></Toolbar>}>
        <div className="hg-rolar">
          {lista.length ? (
            <div className="hg-grid-3">
              {lista.map((b) => (
                <AchievementBadge key={b.nome} icon="estrela" name={b.oferta} description={b.nome}
                  meta={b.nicho + " · " + b.validade} unlocked action={<Button variant="green">Resgatar</Button>} />
              ))}
            </div>
          ) : <EmptyState icon="estrela" title="Nenhuma oferta neste nicho" description="Troque o filtro ou volte mais tarde." />}
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { ClubeScreen });
