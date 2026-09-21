const { PageHead, Panel, Stars, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* app/vitrine.html + paginas.vitrine() */
function VitrineScreen() {
  const v = window.BabelDemo("reino/vitrine", {});
  if (!v.length) {
    return (
      <>
        <PageHead title="Vitrine" subtitle="Uma empresa em destaque por região." />
        <Panel fill><EmptyState icon="vitrine" title="Vitrine vazia" description="Uma empresa em destaque por região aparece aqui." /></Panel>
      </>
    );
  }
  return (
    <>
      <PageHead title="Vitrine" subtitle="Uma empresa em destaque por região." />
      <div className="hg-encher hg-rolar">
        <div className="hg-grid-3">
          {v.map((e) => (
            <Panel key={e.nome}>
              <p className="hg-sub">{e.regiao}</p>
              <h2 className="hg-title">{e.nome}</h2>
              <p style={{ color: "var(--text-2)" }}>{(e.nicho || "") + " · " + (e.cidade || "")}</p>
              {e.nota != null ? <Stars value={e.nota} /> : null}
            </Panel>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { VitrineScreen });
