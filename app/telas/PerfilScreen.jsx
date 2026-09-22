const { PageHead, Panel, Button, Input, Select, Field, Toolbar, Pill, Icon, Toast, EmptyState, AffiliateLevel } = window.BabelOSDesignSystem_5ad360;

/* Minha conta — dados da conta, foto, senha e os links de afiliado.
   Desde AJ2 (22/09) o cadastro só pede nome, WhatsApp, foto, usuário e senha: empresa, CNPJ e
   cidade/UF são completados aqui (sem cidade/UF a empresa não aparece no mapa do Reino).
   O CNPJ é gravado uma vez; depois só um administrador troca.
   O código base é único por pessoa; cada campanha gera um link próprio
   (?ref=codigo&c=campanha) para você saber de onde veio cada cadastro. */
const CAMPANHAS = ["instagram", "whatsapp", "youtube", "evento", "indicacao"];

function PerfilScreen({ ir }) {
  const C = window.ReinoContas, A = window.ReinoAfiliados, F = window.ReinoFotos;
  const d = window.BABEL_DEMO;
  const s = (C && C.sessao()) || {};
  const nome = s.nome || d.perfil.nome;
  const V = window.ReinoValidar;
  const [f, setF] = React.useState({
    nome, titulo: s.titulo || d.perfil.titulo || "",
    whatsapp: V && s.whatsapp ? V.mascaraWhatsapp(s.whatsapp) : "",
    empresa: s.empresa || "", cnpj: V && s.cnpj ? V.mascaraCnpj(s.cnpj) : "",
    local: s.cidade ? s.cidade + (s.uf ? ", " + s.uf : "") : "",
  });
  const [erroDados, setErroDados] = React.useState("");
  const [salvando, setSalvando] = React.useState(false);
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
  const falta = [!s.empresa && "empresa", !s.cnpj && "CNPJ", !s.cidade && "cidade e UF", !s.whatsapp && "WhatsApp"].filter(Boolean);
  const salvarDados = async () => {
    setErroDados("");
    const muda = { nome: f.nome.replace(/\s+/g, " ").trim(), titulo: f.titulo || null };
    if (muda.nome.length < 5) return setErroDados("Digite nome e sobrenome.");
    if (f.whatsapp.trim()) {
      const w = V.normalizarWhatsapp(f.whatsapp);
      if (!w) return setErroDados("WhatsApp com DDD, assim: (11) 91234-5678.");
      muda.whatsapp = w;
    }
    const emp = f.empresa.replace(/\s+/g, " ").trim();
    if (emp && (emp.length < 2 || emp.length > 120)) return setErroDados("Digite o nome da empresa.");
    muda.empresa = emp || null;
    if (!s.cnpj && V.soDigitos(f.cnpj)) {
      const c = V.soDigitos(f.cnpj);
      if (!V.cnpjValido(c)) return setErroDados("Esse CNPJ não é válido. Confira os números.");
      muda.cnpj = c;
    }
    if (f.local.trim()) {
      const r = V.lerCidadeUf(f.local);
      if (r.erro) return setErroDados(r.erro);
      muda.cidade = r.cidade; muda.uf = r.uf;
    }
    setSalvando(true);
    try {
      const novo = await C.salvarPerfil(muda);
      if (muda.cnpj && novo.cnpj !== muda.cnpj) setErroDados("O CNPJ não foi gravado. Fale com um administrador.");
      else dizer("Dados salvos.");
      setF((v) => ({ ...v, cnpj: novo.cnpj ? V.mascaraCnpj(novo.cnpj) : v.cnpj, local: novo.cidade ? novo.cidade + ", " + novo.uf : v.local }));
    } catch (e) {
      const m = String(e.message || "");
      setErroDados(/whatsapp/i.test(m) ? "Esse WhatsApp já está em outra conta." : /cnpj/i.test(m) ? "Esse CNPJ já tem cadastro no Reino." : "Não foi possível salvar agora. Tente de novo.");
    }
    setSalvando(false);
  };
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
      {falta.length ? <p className="hg-af-aviso" role="status"><Icon name="alerta" />Falta completar: <b>{falta.join(", ")}</b>. Sem cidade e UF sua empresa não aparece no mapa do Reino.</p> : null}

      <div className="hg-duas">
        <Panel title="Quem você é" subtitle="Aparece no mapa, no feed e para quem você indica" headingLevel={3}>
          <div className="hg-perfil-topo">
            <FotoAvatar chave={f.nome || nome} nome={f.nome || nome} size={84} editavel camera />
            <div>
              <strong>{f.nome || nome}</strong>
              <span>{[f.titulo, s.cidade, s.uf].filter(Boolean).join(" · ")}</span>
              <span className="hg-sub">{s.usuario ? "Login: @" + s.usuario : s.email ? "Login: " + s.email : ""}</span>
            </div>
          </div>
          <form className="hg-form" onSubmit={(e) => { e.preventDefault(); salvarDados(); }}>
            <Field label="Nome" htmlFor="p-nome"><Input id="p-nome" value={f.nome} onChange={campo("nome")} autoComplete="name" /></Field>
            <Field label="WhatsApp" htmlFor="p-wpp" hint="Só você e os administradores veem."><Input id="p-wpp" type="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => setF((v) => ({ ...v, whatsapp: V.mascaraWhatsapp(e.target.value) }))} autoComplete="tel-national" placeholder="(11) 91234-5678" /></Field>
            <Field label="Empresa" htmlFor="p-empresa"><Input id="p-empresa" value={f.empresa} onChange={campo("empresa")} autoComplete="organization" placeholder="Nome da empresa" /></Field>
            <Field label="CNPJ" htmlFor="p-cnpj" hint={s.cnpj ? "Para trocar o CNPJ, fale com um administrador." : "Grava uma vez só. Confira antes de salvar."}>
              <Input id="p-cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => setF((v) => ({ ...v, cnpj: V.mascaraCnpj(e.target.value) }))} placeholder="00.000.000/0000-00" disabled={!!s.cnpj} />
            </Field>
            <Field label="Título" htmlFor="p-titulo">
              <Select id="p-titulo" value={f.titulo} onChange={campo("titulo")}>
                {["Imperador", "Rei", "Príncipe", "Duque", "Marquês", "Conde", "Visconde", "Barão"].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Cidade e UF da empresa" htmlFor="p-cidade" hint="É daí que sai o seu lugar no mapa do Reino.">
              <Input id="p-cidade" value={f.local} onChange={campo("local")} autoComplete="address-level2" placeholder="Campinas, SP" />
            </Field>
            {erroDados ? <p className="hg-cod-erro" role="alert"><Icon name="alerta" />{erroDados}</p> : null}
            <Toolbar><Button variant="cyan" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar dados"}</Button></Toolbar>
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
