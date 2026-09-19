const { PageHead, Panel, Button, GuildSummary, AchievementBadge } = window.BabelOSDesignSystem_5ad360;

function GuildasScreen() {
  const d = window.BABEL_DEMO;
  return (
    <>
      <PageHead title="Guildas" subtitle="Grupos de empresas e membros do Reino que somam pontos juntos.">
        <Button variant="cyan" icon="mais">Criar guilda</Button>
      </PageHead>
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "380px" }}>
        <Panel tone="conquistas" fill title="Minha guilda">
          <div className="hg-rolar"><GuildSummary {...d.minhaGuilda} /></div>
        </Panel>
        <Panel fill title="Explorar guildas">
          <div className="hg-rolar">
            <div className="hg-grid-3">
              {d.guildas.map((g) => (
                <AchievementBadge key={g.nome} icon="guilda" name={g.nome} description={g.nicho + " · " + g.regiao}
                  meta={g.membros + " membros · " + g.pontos.toLocaleString("pt-BR") + " pts"} unlocked
                  action={<Button variant="ghost">Entrar</Button>} />
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

Object.assign(window, { GuildasScreen });
