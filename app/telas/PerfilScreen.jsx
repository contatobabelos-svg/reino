const { PageHead, Panel, Button, Input, Select, Field, Toolbar, Pill, Icon, Toast, EmptyState, AffiliateLevel } = window.BabelOSDesignSystem_5ad360;

/* Minha conta — dados do login validado, foto, senha e os links de afiliado.
   O código base é único por pessoa; cada campanha gera um link próprio
   (?ref=codigo&c=campanha) para você saber de onde veio cada cadastro. */
const CAMPANHAS = ["instagram", "whatsapp", "youtube", "evento", "indicacao"];

function PerfilScreen({ ir }) {
  const C = window.ReinoContas, A = window.ReinoAfiliados, F = window.ReinoFotos;
  const d = window.BABEL_DEMO;
  const s = (C && C.sessao()) || {};
  const nome = s.nome || d.perfil.nome;
  const [f, setF] = React.useState({ nome, email: s.email || "", cidade: s.cidade || d.perfil.cidade, uf: s.uf || d.perfil.uf, titulo: s.titulo || d.perfil.titulo });
  const [codigo, setCodigo] = React.useState(() => (A ? A.meuCodigo(nome) : ""));
  const [checando, setChecando] = React.useState(null); // null | "ok" | "erro"
  const [motivo, setMotivo] = React.useState("");
  const [campanha, setCampanha] = React.useState("instagram");
  const [links, setLinks] = React.useState(() => { try { return JSON.parse(localStorage.getItem("reino.links") || "[]"); } catch (e) { return []; } });
  const [aviso, setAviso] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const campo = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  const dizer = (t) => { setAviso(t); setTimeout(() => setAviso(""), 2200); };
  React.useEffect(() => { try { localStorage.setItem("reino.links", JSON.stringify(links)); } catch (e) {} }, [links]);

  const situacao = (localStorage.getItem("reino.situacao") || s.situacao || "membro");
  const linkBase = A ? A.linkDe(codigo) : "";
  const linkCom = (c) => linkBase + (linkBase.includes("?") ? "&" : "?") + "c=" + encodeURIComponent(c);

  const verificar = async () => {
    const v = await C.codigoLivre(codigo);
    setChecando(v.ok ? "ok" : "erro"); setMotivo(v.ok ? "" : v.motivo);
    if (v.ok) setCodigo(v.codigo);
  };
  const salvarCodigo = async () => {
    const v = await C.reservarCodigo(codigo);
    if (!v.ok) { setChecando("erro"); setMotivo(v.motivo); return; }
    setCodigo(v.codigo); setChecando("ok"); dizer("Código salvo: " + v.codigo);
  };
  const salvarDados = async () => { await C.salvarPerfil({ ...f }); dizer("Dados salvos."); };
  const copiar = async (url) => { try { await navigator.clipboard.writeText(url); dizer("Link copiado."); } catch (e) {} };
  const criarLink = () => {
    const c = C.limpar(campanha);
    if (!c) return;
    if (links.some((l) => l.campanha === c)) { dizer("Você já tem um link dessa campanha."); return; }
    setLinks([{ campanha: c, url: linkCom(c), criado: new Date().toISOString() }, ...links]);
  };
  const trocarSenha = async () => {
    if (senha.length < 6) { dizer("A senha precisa de 6 caracteres."); return; }
    try { await C.trocarSenha(senha); setSenha(""); dizer("Senha trocada."); } catch (e) { dizer(e.message); }
  };
  const sair = () => { Promise.resolve(C.sair()).finally(() => location.reload()); };

  return (
    <>
      <PageHead title="Minha conta" subtitle="Seus dados, sua foto e os links que trazem gente para o Reino.">
        <div className="hg-head-acoes">
          <Pill as="span">{situacao === "pre-cadastro" ? "Pré-cadastro" : "Membro do Reino"}</Pill>
          <Button variant="ghost" onClick={sair}>Sair</Button>
        </div>
      </PageHead>

      {!C.online() ? <p className="hg-af-aviso"><Icon name="alerta" />Login em modo demonstração: sem banco conectado, qualquer senha entra e os dados ficam neste navegador.</p> : null}
      {s.confirmar ? <p className="hg-af-aviso"><Icon name="alerta" />Confirme o e-mail que enviamos para <b>{s.email}</b> para validar seu login.</p> : null}

      <div className="hg-duas">
        <Panel title="Quem você é" subtitle="Aparece no mapa, no feed e para quem você indica" headingLevel={3}>
          <div className="hg-perfil-topo">
            <FotoAvatar chave={f.nome || nome} nome={f.nome || nome} size={84} editavel camera />
            <div>
              <strong>{f.nome || nome}</strong>
              <span>{f.titulo} · {f.cidade} · {f.uf}</span>
              <span className="hg-sub">{s.email || "sem e-mail cadastrado"}</span>
            </div>
          </div>
          <form className="hg-form" onSubmit={(e) => { e.preventDefault(); salvarDados(); }}>
            <Field label="Nome" htmlFor="p-nome"><Input id="p-nome" value={f.nome} onChange={campo("nome")} autoComplete="name" /></Field>
            <Field label="E-mail" htmlFor="p-email" hint={C.online() ? "É o que valida seu login." : undefined}><Input id="p-email" type="email" value={f.email} onChange={campo("email")} autoComplete="email" /></Field>
            <Field label="Título" htmlFor="p-titulo">
              <Select id="p-titulo" value={f.titulo} onChange={campo("titulo")}>
                {["Imperador", "Rei", "Príncipe", "Duque", "Marquês", "Conde", "Visconde", "Barão"].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Onde você atua" htmlFor="p-cidade">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px", gap: ".5rem" }}>
                <Input id="p-cidade" value={f.cidade} onChange={campo("cidade")} placeholder="Cidade" />
                <Input value={f.uf} onChange={campo("uf")} placeholder="UF" maxLength={2} />
              </div>
            </Field>
            <Toolbar><Button variant="cyan" type="submit">Salvar dados</Button></Toolbar>
          </form>
        </Panel>

        <Panel tone="afiliado" title="Seu código de afiliado" subtitle="Escolha o nome que aparece no seu link" headingLevel={3}>
          <div className="hg-cod">
            <span className="hg-cod-fixo">{(window.REINO_DOMINIO || location.origin).replace(/^https?:\/\//, "")}/?ref=</span>
            <Input value={codigo} onChange={(e) => { setCodigo(e.target.value); setChecando(null); }} aria-label="Código" spellCheck={false} />
            <Button variant="ghost" onClick={verificar}>Verificar</Button>
          </div>
          {checando === "ok" ? <p className="hg-cod-ok"><Icon name="coroa" />Código livre. Pode salvar.</p> : null}
          {checando === "erro" ? <p className="hg-cod-erro"><Icon name="alerta" />{motivo}</p> : null}
          <Toolbar>
            <Button variant="green" onClick={salvarCodigo}>Salvar código</Button>
            <Button variant="ghost" onClick={() => copiar(linkBase)}>Copiar link</Button>
          </Toolbar>
          <p className="hg-sub">Só letras, números e hífen. Quem entrar por esse link fica ligado a você.</p>
          <hr className="hg-filete" />
          <h4 className="hg-title" style={{ fontSize: ".9rem" }}>Trocar senha</h4>
          <Toolbar>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha" autoComplete="new-password" />
            <Button variant="ghost" onClick={trocarSenha} disabled={!C.online()}>Trocar</Button>
          </Toolbar>
        </Panel>
      </div>

      <Panel title="Links por campanha" subtitle="Um link para cada lugar onde você divulga — você vê de onde cada cadastro veio" headingLevel={3}>
        <Toolbar>
          <Input value={campanha} onChange={(e) => setCampanha(e.target.value)} placeholder="instagram, evento, whatsapp…" aria-label="Campanha" list="hg-campanhas" />
          <datalist id="hg-campanhas">{CAMPANHAS.map((c) => <option key={c} value={c} />)}</datalist>
          <Button variant="cyan" icon="mais" onClick={criarLink}>Criar link</Button>
        </Toolbar>
        {links.length ? (
          <ul className="hg-links">
            {links.map((l) => (
              <li key={l.campanha}>
                <span className="hg-links-tag">{l.campanha}</span>
                <code>{l.url}</code>
                <div className="hg-links-acoes">
                  <Button variant="ghost" onClick={() => copiar(l.url)}>Copiar</Button>
                  <button className="hg-x" onClick={() => setLinks(links.filter((x) => x.campanha !== l.campanha))} aria-label={"Apagar link " + l.campanha}><Icon name="x" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="link" title="Nenhum link de campanha" description="Crie um link por canal (Instagram, WhatsApp, evento) para comparar os resultados." />}
        <Toolbar style={{ marginTop: ".6rem" }}>
          <Button variant="ghost" icon="grafico" onClick={() => ir("meus-acessos.html")}>Ver meus indicados</Button>
        </Toolbar>
      </Panel>
      {aviso ? <Toast open>{aviso}</Toast> : null}
    </>
  );
}

Object.assign(window, { PerfilScreen });
