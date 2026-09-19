const { PageHead, Panel, ListRow, Pill, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* app/match.html + blocoMatch("#match", 30) */
function MatchScreen() {
  const m = window.BabelDemo("reino/match", { limite: 30 });
  return (
    <>
      <PageHead title="Match Reino" subtitle="Empresas de nichos complementares: primeiro da sua cidade, depois do estado e do restante do Reino." />
      <Panel tone="match" fill>
        <div className="hg-rolar">
          {m.length ? (
            <ul className="hg-list">
              {m.map((x) => (
                <ListRow key={x.nome} title={x.nome} subtitle={x.nicho + " · " + x.cidade} avatarGradient="match"
                  right={x.compatibilidade != null ? <Pill>{x.compatibilidade}%</Pill> : null} />
              ))}
            </ul>
          ) : (
            <EmptyState icon="match" title="Nenhum match no momento"
              description="Empresas de nichos complementares, próximas de você, aparecem aqui." />
          )}
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { MatchScreen });
