const { PageHead, Panel, Button, ProgressRing, MetricRow, AchievementBadge, RankList } = window.BabelOSDesignSystem_5ad360;

function ConquistasScreen() {
  const d = window.BABEL_DEMO;
  return (
    <>
      <PageHead title="Conquistas" subtitle="Evolua no Reino avaliando, cadastrando empresas e fazendo matches." />
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "320px" }}>
        <Panel tone="conquistas" title="Conquistas" subtitle="Sua evolução no Reino">
          <ProgressRing value={64} label="até Príncipe" />
          {d.metricas.map((m) => <MetricRow key={m.nome} name={m.nome} label={m.rotulo} value={m.percentual} />)}
          <Button variant="ghost" block>Ver hierarquia</Button>
        </Panel>
        <Panel fill title="Todas as conquistas">
          <div className="hg-rolar">
            <div className="hg-grid-3">
              {d.conquistas.map((c) => (
                <AchievementBadge key={c.nome} name={c.nome} description={c.descricao} unlocked={c.desbloqueada} progress={c.progresso} />
              ))}
            </div>
            <h3 className="hg-title" style={{ margin: "1.2rem 0 .6rem" }}>Hierarquia do Reino</h3>
            <RankList items={d.titulos} />
          </div>
        </Panel>
      </div>
    </>
  );
}

Object.assign(window, { ConquistasScreen });
