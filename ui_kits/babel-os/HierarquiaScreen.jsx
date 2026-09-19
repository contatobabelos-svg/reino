const { PageHead, Panel, RankList, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* app/hierarquia.html + paginas.hierarquia() */
function HierarquiaScreen() {
  const t = window.BabelDemo("reino/titulos", {});
  return (
    <>
      <PageHead title="Hierarquia" subtitle="Títulos e nobreza do Reino." />
      <Panel tone="conquistas" fill>
        <div className="hg-rolar">
          {t.length ? <RankList items={t} />
            : <EmptyState icon="coroa" title="Nenhum título cadastrado" description="Os títulos de nobreza do Reino aparecem em ordem." />}
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { HierarquiaScreen });
