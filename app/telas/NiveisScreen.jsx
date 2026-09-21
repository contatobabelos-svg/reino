const { PageHead, Panel, Button, Icon, RankList, AchievementBadge } = window.BabelOSDesignSystem_5ad360;

/* Do mapa mental: a escada de títulos, o que cada um libera e o alcance do mapa. */
function NiveisScreen() {
  const d = window.BABEL_DEMO;
  const meu = d.perfil.titulo;
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + "/mês";
  return (
    <>
      <PageHead title="Níveis" subtitle="Cada título amplia o mapa que você comanda e o que você pode fazer no Reino." />
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "minmax(0,1fr)" }}>
        <Panel tone="conquistas" fill title="Títulos do Reino" subtitle={"Seu título: " + meu}>
          <div className="hg-rolar">
            <ul className="hg-niveis">
              {d.titulos.map((t) => (
                <li key={t.nome} className={t.nome === meu ? "is-meu" : ""}>
                  <span className="hg-nivel-selo"><Icon name="coroa" /></span>
                  <div className="hg-niveis-info">
                    <strong>{t.nome}{t.nome === meu ? <em> · seu título</em> : null}</strong>
                    <span>{t.descricao}</span>
                    <ul className="hg-niveis-ben">
                      {t.beneficios.map((b) => <li key={b}><Icon name="estrela" />{b}</li>)}
                    </ul>
                  </div>
                  <div className="hg-niveis-preco">
                    <b>{brl(t.mensalidade)}</b>
                    <span className="hg-sub">{t.mapa}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <div className="hg-col">
          <Panel title="Alcance do mapa" headingLevel={3} subtitle="O que o seu título mostra no globo">
            <div className="hg-grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <AchievementBadge icon="mapa" name="Imperador" meta="Brasil inteiro" unlocked={meu === "Imperador"} />
              <AchievementBadge icon="mapa" name="Rei" meta="Brasil por regiões" unlocked={meu === "Rei"} />
              <AchievementBadge icon="mapa" name="Príncipe" meta="Região com estados" unlocked={meu === "Príncipe"} />
              <AchievementBadge icon="mapa" name="Duque e abaixo" meta="Estado com cidades" unlocked={["Duque", "Marquês", "Conde", "Visconde", "Barão"].includes(meu)} />
            </div>
          </Panel>
          <Panel tone="afiliado" fill title="Mensalidades" headingLevel={3}>
            <div className="hg-rolar"><RankList items={d.titulos} /></div>
            <Button variant="green" block>Subir de título</Button>
          </Panel>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { NiveisScreen });
