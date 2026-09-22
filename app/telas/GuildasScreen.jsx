const { PageHead, Panel, Button, GuildSummary, AchievementBadge, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* Guildas do banco (servicos/rede.js). "Minha guilda" = a primeira em que a conta é membro. */
function GuildasScreen({ conta }) {
  const [gs, setGs] = React.useState(null);
  const [erro, setErro] = React.useState("");
  const [aberta, setAberta] = React.useState(null);
  React.useEffect(() => {
    if (!window.ReinoRede) { setGs([]); return; }
    window.ReinoRede.guildas().then(setGs).catch((e) => { setErro(e.message); setGs([]); });
  }, []);
  const euId = conta && conta.id;
  const minha = (gs || []).find((g) => g.membros.some((m) => m.membro === euId));
  const foco = aberta || minha;
  return (
    <>
      <PageHead title="Guildas" subtitle="Grupos de empresas e membros do Reino que somam pontos juntos." />
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "380px" }}>
        <Panel tone="conquistas" fill title={foco && foco !== minha ? foco.nome : "Minha guilda"}>
          <div className="hg-rolar">
            {foco ? <>
              <GuildSummary nome={foco.nome} lider={foco.lider_nome} pontos={foco.pontos}
                membros={foco.membros.map((m) => ({ nome: m.nome, titulo: m.titulo }))} />
              {foco.descricao ? <p className="hg-sub" style={{ marginTop: ".8rem" }}>{foco.descricao}</p> : null}
              <ul className="hg-list" style={{ marginTop: ".6rem" }}>
                {foco.membros.map((m) => <li key={m.membro} className="hg-sub">{m.nome} · {m.empresa} · {m.cidade}/{m.uf}{m.papel === "lider" ? " · líder" : ""}</li>)}
              </ul>
            </> : <EmptyState icon="guilda" title="Você ainda não está numa guilda" description="Escolha uma guilda ao lado para ver quem participa." />}
          </div>
        </Panel>
        <Panel fill title="Explorar guildas">
          <div className="hg-rolar">
            {gs === null ? <p className="hg-sub">Carregando guildas…</p> : null}
            {erro ? <p className="hg-sub" role="alert">{erro}</p> : null}
            {gs && gs.length === 0 && !erro ? <EmptyState icon="guilda" title="Nenhuma guilda ainda" description="Quando as primeiras guildas forem criadas, elas aparecem aqui." /> : null}
            <div className="hg-grid-3">
              {(gs || []).map((g) => (
                <AchievementBadge key={g.id} icon="guilda" name={g.nome} description={g.nicho + " · " + g.regiao}
                  meta={g.membros.length + " membros · " + Number(g.pontos || 0).toLocaleString("pt-BR") + " pts"} unlocked
                  action={<Button variant="ghost" onClick={() => setAberta(g)}>Ver membros</Button>} />
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

Object.assign(window, { GuildasScreen });
