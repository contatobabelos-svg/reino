const { Icon } = window.BabelOSDesignSystem_5ad360;

/* Tela de entrada: o globo imersivo do produto ao fundo e um cartão de vidro
   azul-claro na frente. Login de verdade no Supabase — só entra quem tem conta.
   Modos: entrar · cadastro · esqueci (pede o link por e-mail) · nova-senha (veio do link). */
function LoginScreen({ onEntrar, recuperacao, avisoInicial, erroInicial }) {
  const [aba, setAba] = React.useState(recuperacao ? "nova-senha" : "entrar");
  const [f, setF] = React.useState({ usuario: "", senha: "", senha2: "", nome: "", email: "", afiliado: "" });
  const [aviso, setAviso] = React.useState(avisoInicial || "");
  const [mostraAfiliado, setMostraAfiliado] = React.useState(false);
  // código de quem indicou: ?ref= na URL ou colado no campo
  const refUrl = React.useMemo(() => (window.ReinoAfiliados ? window.ReinoAfiliados.codigoDaUrl() : "") || sessionStorage.getItem("reino.ref") || new URLSearchParams(location.search).get("ref") || "", []);
  const codigoRef = (v) => { const s = String(v || ""); const m = s.match(/[?&]ref=([^&#\s]+)/) || s.match(/\/r\/([A-Za-z0-9_-]+)/); return (m ? decodeURIComponent(m[1]) : s.trim()).toLowerCase(); };
  const codigo = codigoRef(f.afiliado) || refUrl;
  const colar = async () => { try { const t = await navigator.clipboard.readText(); if (t) setF((v) => ({ ...v, afiliado: t })); } catch (e) { /* sem permissão: o usuário cola manualmente */ } };
  const [erro, setErro] = React.useState(erroInicial || "");
  const [indo, setIndo] = React.useState(false);
  const campo = (k) => (e) => { setF((v) => ({ ...v, [k]: e.target.value })); setErro(""); };
  const trocarAba = (a) => { setAba(a); setErro(""); setAviso(""); };
  const enviar = async (e) => {
    e.preventDefault();
    const C = window.ReinoContas;
    if (!C) { setErro("Não foi possível conectar ao Reino agora. Recarregue a página."); return; }
    const email = (aba === "cadastro" ? f.email : f.usuario).trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (aba === "esqueci") {
      if (!emailOk) { setErro("Digite o e-mail da sua conta."); return; }
      setIndo(true);
      try {
        await C.recuperarSenha(email);
        setAba("entrar"); setErro("");
        setAviso("Se esse e-mail tiver conta no Reino, enviamos um link para criar uma nova senha.");
      } catch (err) { setErro(err.message); }
      setIndo(false);
      return;
    }
    if (aba === "nova-senha") {
      if (f.senha.length < 6) { setErro("A senha precisa de pelo menos 6 caracteres."); return; }
      if (f.senha !== f.senha2) { setErro("As duas senhas não são iguais."); return; }
      setIndo(true);
      try { await C.trocarSenha(f.senha); onEntrar(C.sessao()); } catch (err) { setErro(err.message); setIndo(false); }
      return;
    }

    const ok = aba === "entrar" ? email && f.senha : f.nome.trim() && email && f.senha;
    if (!ok) { setErro("Preencha os campos para continuar."); return; }
    if (!emailOk) { setErro("Digite um e-mail válido."); return; }
    if (aba === "cadastro" && f.senha.length < 6) { setErro("A senha precisa de pelo menos 6 caracteres."); return; }
    setIndo(true);
    let conta = null;
    try {
      if (aba === "entrar") {
        conta = await C.entrar(email, f.senha);
      } else {
        const r = await C.cadastrar({ nome: f.nome.trim(), email, senha: f.senha, titulo: localStorage.getItem("reino.tituloEscolhido") || undefined, indicadoPor: codigo || undefined });
        // registra o indicado e a foto só depois que a conta existe de verdade
        if (window.ReinoAfiliados) {
          const perfil = window.BABEL_DEMO && window.BABEL_DEMO.perfil;
          window.ReinoAfiliados.registrarCadastro({ nome: f.nome.trim(), email, titulo: localStorage.getItem("reino.tituloEscolhido") || (perfil && perfil.titulo) });
        }
        if (window.ReinoFotos) {
          const provisoria = window.ReinoFotos.obter("novo-cadastro");
          if (provisoria && f.nome.trim()) { window.ReinoFotos.definir(f.nome.trim(), provisoria); window.ReinoFotos.remover("novo-cadastro"); }
        }
        if (r.confirmar) {
          // o Supabase exige confirmar o e-mail antes do primeiro login
          setIndo(false); setAba("entrar"); setErro("");
          setF((v) => ({ ...v, usuario: email, senha: "" }));
          setAviso("Conta criada! Enviamos um link de confirmação para " + email + ". Confirme e depois entre aqui.");
          return;
        }
        conta = (C.carregarConta && (await C.carregarConta())) || r.sessao;
      }
    } catch (err) { setIndo(false); setErro(err.message); return; }
    if (codigo) { localStorage.setItem("reino.indicadoPor", codigo); sessionStorage.setItem("reino.ref", codigo); }
    setTimeout(() => onEntrar(conta), 650);
  };
  return (
    <div className={"hg-login" + (indo ? " is-indo" : "")}>
      <div className="hg-login-globo" aria-hidden="true"><Globo imersivo /></div>
      <div className="hg-login-veu" aria-hidden="true" />
      <form className="hg-login-cartao" onSubmit={enviar} noValidate>
        <div className="hg-login-marca"><span className="hg-brand-coroa"><Icon name="coroa" /></span><span>Rei<b>no</b></span></div>
        {aba === "entrar" || aba === "cadastro" ? (
          <div className="hg-login-abas" role="tablist">
            <button type="button" role="tab" aria-selected={aba === "entrar"} onClick={() => trocarAba("entrar")}>Entrar</button>
            <button type="button" role="tab" aria-selected={aba === "cadastro"} onClick={() => trocarAba("cadastro")}>Criar conta</button>
          </div>
        ) : (
          <p className="hg-login-titulo">{aba === "esqueci" ? "Recuperar acesso" : "Crie uma nova senha"}</p>
        )}
        {aviso ? <p className="hg-login-aviso" role="status">{aviso}</p> : null}
        {aba === "entrar" ? (
          <>
            <label className="hg-login-campo"><span>E-mail</span><input type="email" value={f.usuario} onChange={campo("usuario")} autoComplete="username" autoFocus /></label>
            <label className="hg-login-campo"><span>Senha</span><input type="password" value={f.senha} onChange={campo("senha")} autoComplete="current-password" /></label>
            <button type="button" className="hg-login-link" onClick={() => trocarAba("esqueci")}>Esqueci minha senha</button>
          </>
        ) : aba === "esqueci" ? (
          <>
            <label className="hg-login-campo"><span>E-mail da sua conta</span><input type="email" value={f.usuario} onChange={campo("usuario")} autoComplete="username" autoFocus /></label>
            <button type="button" className="hg-login-link" onClick={() => trocarAba("entrar")}>Voltar para entrar</button>
          </>
        ) : aba === "nova-senha" ? (
          <>
            <label className="hg-login-campo"><span>Nova senha</span><input type="password" value={f.senha} onChange={campo("senha")} autoComplete="new-password" autoFocus /></label>
            <label className="hg-login-campo"><span>Repita a nova senha</span><input type="password" value={f.senha2} onChange={campo("senha2")} autoComplete="new-password" /></label>
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
        {aba === "cadastro" ? <div className="hg-login-afiliado">
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
        </div> : null}
        {erro ? <p className="hg-login-erro" role="alert">{erro}</p> : null}
        <button type="submit" className="hg-login-btn" disabled={indo}>
          {indo ? "Aguarde…" : { entrar: "Entrar no Reino", cadastro: "Criar minha conta", esqueci: "Enviar link por e-mail", "nova-senha": "Salvar nova senha" }[aba]}
        </button>
        <p className="hg-login-nota">{{
          entrar: "Entre com o e-mail e a senha da sua conta.",
          cadastro: "Sua conta entra como aguardando aprovação de um administrador.",
          esqueci: "Você recebe um link para criar uma nova senha.",
          "nova-senha": "Mínimo de 6 caracteres.",
        }[aba]}</p>
      </form>
    </div>
  );
}

Object.assign(window, { LoginScreen });
