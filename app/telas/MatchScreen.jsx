const { PageHead, Panel, ListRow, Pill, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* Matches do banco (servicos/rede.js): empresas de nichos complementares ou da mesma região. */
function MatchScreen({ conta }) {
  const [m, setM] = React.useState(null);
  const [erro, setErro] = React.useState("");
  React.useEffect(() => {
    if (!window.ReinoRede) { setM([]); return; }
    window.ReinoRede.matches(conta && conta.id).then(setM).catch((e) => { setErro(e.message); setM([]); });
  }, []);
  const lista = m || [];
  const meus = lista.filter((x) => x.meu);
  const mostrar = meus.length ? meus : lista;
  const soPares = !meus.length && lista.length > 0;
  return (
    <>
      <PageHead title="Match Reino" subtitle={soPares ? "Você ainda não tem match próprio. Como administrador, você vê os matches entre as contas de teste."
        : "Empresas de nichos complementares: primeiro da sua cidade, depois do estado e do restante do Reino."} />
      <Panel tone="match" fill>
        <div className="hg-rolar">
          {m === null ? <p className="hg-sub">Carregando matches…</p> : null}
          {erro ? <p className="hg-sub" role="alert">{erro}</p> : null}
          {mostrar.length ? (
            <ul className="hg-list">
              {mostrar.map((x) => (
                <ListRow key={x.id} title={x.nome} subtitle={[x.pessoa, x.nicho, x.meu ? x.cidade + "/" + x.uf : x.cidade, x.motivo].filter(Boolean).join(" · ")} avatarGradient="match"
                  right={<Pill>{x.compatibilidade}%</Pill>} />
              ))}
            </ul>
          ) : m !== null && !erro ? (
            <EmptyState icon="match" title="Nenhum match no momento"
              description="Empresas de nichos complementares, próximas de você, aparecem aqui." />
          ) : null}
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { MatchScreen });
