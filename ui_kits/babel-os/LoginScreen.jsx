const { Icon } = window.BabelOSDesignSystem_5ad360;

/* Tela de entrada: o globo imersivo do produto ao fundo e um cartão de vidro
   azul-claro na frente. Qualquer usuário e senha entram (demonstração). */
function LoginScreen({ onEntrar }) {
  const [aba, setAba] = React.useState("entrar");
  const [f, setF] = React.useState({ usuario: "", senha: "", nome: "", email: "", afiliado: "" });
  const [mostraAfiliado, setMostraAfiliado] = React.useState(false);
  // código de quem indicou: ?ref= na URL ou colado no campo
  const refUrl = React.useMemo(() => (window.ReinoAfiliados ? window.ReinoAfiliados.codigoDaUrl() : "") || sessionStorage.getItem("reino.ref") || new URLSearchParams(location.search).get("ref") || "", []);
  const codigoRef = (v) => { const s = String(v || ""); const m = s.match(/[?&]ref=([^&#\s]+)/) || s.match(/\/r\/([A-Za-z0-9_-]+)/); return (m ? decodeURIComponent(m[1]) : s.trim()).toLowerCase(); };
  const codigo = codigoRef(f.afiliado) || refUrl;
  const colar = async () => { try { const t = await navigator.clipboard.readText(); if (t) setF((v) => ({ ...v, afiliado: t })); } catch (e) { /* sem permissão: o usuário cola manualmente */ } };
  const [erro, setErro] = React.useState("");
  const [indo, setIndo] = React.useState(false);
  const campo = (k) => (e) => { setF((v) => ({ ...v, [k]: e.target.value })); setErro(""); };
  const enviar = async (e) => {
    e.preventDefault();
    const ok = aba === "entrar" ? f.usuario.trim() && f.senha : f.nome.trim() && f.email.trim() && f.senha;
    if (!ok) { setErro("Preencha os campos para continuar."); return; }
    setIndo(true);
    // valida no banco quando há conta configurada; sem banco, segue em demonstração
    const C = window.ReinoContas;
    if (C) {
      try {
        if (aba === "entrar") await C.entrar(f.usuario.trim(), f.senha);
        else await C.cadastrar({ nome: f.nome.trim(), email: f.email.trim(), senha: f.senha, titulo: localStorage.getItem("reino.tituloEscolhido") || undefined, indicadoPor: codigoRef(f.afiliado) || refUrl || undefined });
      } catch (err) {
        // demonstração: qualquer usuário e senha entram. O banco só é usado quando confere.
        if (aba === "entrar") { try { C.entrarLocal(f.usuario.trim()); } catch (e) {} }
        else { setIndo(false); setErro(err.message); return; }
      }
    }
    if (codigo) { localStorage.setItem("reino.indicadoPor", codigo); sessionStorage.setItem("reino.ref", codigo); }
    // cadastro novo: registra o indicado (cidade/UF/título vêm do perfil de demonstração até o pré-cadastro real)
    if (aba === "cadastro" && window.ReinoAfiliados) {
      const perfil = window.BABEL_DEMO && window.BABEL_DEMO.perfil;
      // cidade e UF vêm da localização real de quem se cadastra (afiliados.js → geo)
      window.ReinoAfiliados.registrarCadastro({ nome: f.nome.trim(), email: f.email.trim(), titulo: localStorage.getItem("reino.tituloEscolhido") || (perfil && perfil.titulo) });
    }
    // conta nova entra como pré-cadastro; quem já tem conta entra liberado
    try { localStorage.setItem("reino.situacao", aba === "cadastro" ? "aguardando" : "membro"); } catch (e) {}
    if (aba === "cadastro" && window.ReinoFotos) {
      const provisoria = window.ReinoFotos.obter("novo-cadastro");
      if (provisoria && f.nome.trim()) { window.ReinoFotos.definir(f.nome.trim(), provisoria); window.ReinoFotos.remover("novo-cadastro"); }
    }
    setTimeout(() => onEntrar({ nome: aba === "entrar" ? f.usuario.trim() : f.nome.trim(), indicadoPor: codigo || null }), 650);
  };
  return (
    <div className={"hg-login" + (indo ? " is-indo" : "")}>
      <div className="hg-login-globo" aria-hidden="true"><Globo imersivo /></div>
      <div className="hg-login-veu" aria-hidden="true" />
      <form className="hg-login-cartao" onSubmit={enviar} noValidate>
        <div className="hg-login-marca"><span className="hg-brand-coroa"><Icon name="coroa" /></span><span>Rei<b>no</b></span></div>
        <div className="hg-login-abas" role="tablist">
          <button type="button" role="tab" aria-selected={aba === "entrar"} onClick={() => setAba("entrar")}>Entrar</button>
          <button type="button" role="tab" aria-selected={aba === "cadastro"} onClick={() => setAba("cadastro")}>Criar conta</button>
        </div>
        {aba === "entrar" ? (
          <>
            <label className="hg-login-campo"><span>Usuário ou e-mail</span><input value={f.usuario} onChange={campo("usuario")} autoComplete="username" autoFocus /></label>
            <label className="hg-login-campo"><span>Senha</span><input type="password" value={f.senha} onChange={campo("senha")} autoComplete="current-password" /></label>
          </>
        ) : (
          <>
            <div className="hg-login-foto">
              <FotoAvatar chave={f.nome.trim() || "novo-cadastro"} nome={f.nome.trim() || "?"} size={72} editavel camera />
              <div><b>Sua foto</b><span>Toque para usar a câmera ou escolher da galeria. Ela aparece no mapa, no feed e na rede.</span></div>
            </div>
            <label className="hg-login-campo"><span>Nome</span><input value={f.nome} onChange={campo("nome")} autoComplete="name" autoFocus /></label>
            <label className="hg-login-campo"><span>E-mail</span><input type="email" value={f.email} onChange={campo("email")} autoComplete="email" /></label>
            <label className="hg-login-campo"><span>Senha</span><input type="password" value={f.senha} onChange={campo("senha")} autoComplete="new-password" /></label>
          </>
        )}
        <div className="hg-login-afiliado">
          {mostraAfiliado || f.afiliado ? (
            <>
              <label className="hg-login-campo"><span>Link de afiliado</span>
                <div className="hg-login-afiliado-linha">
                  <input value={f.afiliado} onChange={campo("afiliado")} placeholder={(window.REINO_DOMINIO || location.origin) + "/r/…"} autoComplete="off" />
                  <button type="button" className="hg-login-colar" onClick={colar}>Colar</button>
                </div>
              </label>
              {codigo ? <p className="hg-login-afiliado-ok">Indicado por <b>{codigo}</b> — a comissão vai para quem te convidou.</p> : null}
            </>
          ) : (
            <button type="button" onClick={() => setMostraAfiliado(true)}><Icon name="link" />{refUrl ? "Indicado por " + refUrl + " · alterar" : "Tenho um link de afiliado"}</button>
          )}
        </div>
        {erro ? <p className="hg-login-erro" role="alert">{erro}</p> : null}
        <button type="submit" className="hg-login-btn" disabled={indo}>{indo ? "Entrando…" : aba === "entrar" ? "Entrar no Reino" : "Criar minha conta"}</button>
        <p className="hg-login-nota">{aba === "entrar" ? "Demonstração: qualquer usuário e senha entram." : "Ao continuar você escolhe seu título e território."}</p>
      </form>
    </div>
  );
}

Object.assign(window, { LoginScreen });
