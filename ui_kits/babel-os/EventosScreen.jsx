const { PageHead, Panel, Button, Select, Field, Toolbar, Icon, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* Do mapa mental: encontros de guilda, lives e rodadas de negócios. */
function EventosScreen() {
  const d = window.BABEL_DEMO;
  const [tipo, setTipo] = React.useState("");
  const lista = tipo ? d.eventos.filter((e) => e.tipo === tipo) : d.eventos;
  return (
    <>
      <PageHead title="Eventos" subtitle="Encontros, lives e rodadas de negócios do Reino." />
      <Panel fill title="Próximos eventos" subtitle={lista.length + " de " + d.eventos.length}
        actions={<Toolbar><Field inline label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option><option>Presencial</option><option>Online</option>
          </Select>
        </Field></Toolbar>}>
        <div className="hg-rolar">
          {lista.length ? (
            <ul className="hg-eventos">
              {lista.map((e) => (
                <li key={e.nome}>
                  <span className="hg-eventos-data"><b>{e.data.split(" · ")[0]}</b><span>{e.data.split(" · ")[1]}</span></span>
                  <div>
                    <strong>{e.nome}</strong>
                    <span><Icon name="pin" />{e.local} · {e.vagas}</span>
                  </div>
                  <Button variant={e.tipo === "Online" ? "cyan" : "ghost"}>{e.tipo === "Online" ? "Entrar" : "Reservar"}</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon="agenda" title="Nenhum evento neste filtro" description="Troque o tipo para ver os outros encontros." />}
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { EventosScreen });
