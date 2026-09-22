const { PageHead, Panel, Button, Input, Field, Switch, Toolbar, Toast } = window.BabelOSDesignSystem_5ad360;

/* app/configuracoes.html + paginas.configuracoes().
   No kit nada é gravado: o botão só confirma com o aviso, como faria o produto. */
function ConfiguracoesScreen() {
  const [aviso, setAviso] = React.useState("");
  const confirmar = (texto) => (e) => {
    e.preventDefault();
    setAviso(texto);
    setTimeout(() => setAviso(""), 2200);
  };
  return (
    <>
      <PageHead title="Configurações" subtitle="Fonte de dados e perfil." />
      <div className="hg-duas hg-encher">
        <Panel fill className="hg-rolar" title="Conexão com a API" subtitle="Os painéis leem os endpoints descritos em API.md.">
          <form className="hg-form" onSubmit={confirmar("Configurações salvas. Recarregando…")}>
            <Field label="URL base da API" htmlFor="api" hint="Fica salva apenas neste navegador.">
              <Input id="api" name="api" type="url" placeholder="https://api.suaempresa.com/v1" />
            </Field>
            <Field label="Token de acesso (opcional)" htmlFor="token" hint="Enviado como Authorization: Bearer.">
              <Input id="token" name="token" type="password" autoComplete="off" />
            </Field>
            <Field label="Seu nome" htmlFor="usuario">
              <Input id="usuario" name="usuario" type="text" autoComplete="name" defaultValue="" />
            </Field>
            <Field label="Seu endereço no Reino" htmlFor="cidade" hint="Ao logar, o globo voa até o seu bairro.">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 2fr", gap: ".5rem" }}>
                <Input id="cidade" name="cidade" placeholder="Cidade" autoComplete="address-level2" defaultValue="" />
                <Input id="uf" name="uf" placeholder="UF" maxLength={2} autoComplete="address-level1" defaultValue="" />
                <Input id="bairro" name="bairro" placeholder="Bairro" defaultValue="" />
              </div>
            </Field>
            <Toolbar>
              <Button variant="cyan" type="submit">Salvar</Button>
              <Button variant="ghost" type="button" onClick={confirmar("✅ API respondeu corretamente.")}>Testar conexão</Button>
            </Toolbar>
          </form>
        </Panel>
        <Panel fill className="hg-rolar" title="Notificações">
          <Switch id="demo" label="Dados de demonstração" hint="Usa 10 pessoas e 29 empresas fictícias quando não há API." defaultChecked />
          <Switch id="n-match" label="Novos matches" defaultChecked />
          <Switch id="n-conq" label="Conquistas desbloqueadas" defaultChecked />
          <Switch id="n-rev" label="Novas edições da Revista" />
        </Panel>
      </div>
      <Toast open={!!aviso}>{aviso}</Toast>
    </>
  );
}

Object.assign(window, { ConfiguracoesScreen });
