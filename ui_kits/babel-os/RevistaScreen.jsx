const { PageHead, Panel, Button, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* app/revista.html + paginas.revista() */
function RevistaScreen() {
  const ed = window.BabelDemo("revista", {});
  if (!ed.length) {
    return (
      <>
        <PageHead title="Revista do Reino" subtitle="Edições, matérias e destaques das empresas." />
        <Panel fill><EmptyState icon="revista" title="Nenhuma edição publicada" description="Matérias e destaques das empresas do Reino aparecem aqui." /></Panel>
      </>
    );
  }
  return (
    <>
      <PageHead title="Revista do Reino" subtitle="Edições, matérias e destaques das empresas." />
      <div className="hg-encher hg-rolar">
        <div className="hg-grid-3">
          {ed.map((e) => (
            <Panel key={e.titulo}>
              <p className="hg-sub">{e.edicao || ""}{e.data ? " · " + e.data : ""}</p>
              <h2 className="hg-title">{e.titulo}</h2>
              <p style={{ color: "var(--text-2)" }}>{e.resumo || ""}</p>
              {e.url ? <Button variant="ghost" href={e.url}>Ler</Button> : null}
            </Panel>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { RevistaScreen });
