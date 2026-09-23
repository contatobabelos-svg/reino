/* Reino · Entrar — porta de entrada leve. Só carrega o login (LoginImersivo);
   o resto do Reino (dashboard + todas as telas) fica num iframe oculto,
   "dormindo": pré-aquecendo em segundo plano no tempo em que a pessoa está
   digitando, e só aparece quando o login termina de verdade.

   Sinais trocados com index.html?aquecendo=1 (mesma origem, via postMessage):
     reino:pronto   iframe → aqui   já carregou e transpilou tudo, pode acordar quando quiser
     reino:acordar  aqui → iframe   login OK, aqui está a sessão, pode mostrar o Reino

   Sem pré-aquecimento a tempo (rede lenta, iframe ainda carregando) ou se algo
   falhar, cai para a navegação normal (location.href = index.html) — o login
   nunca fica preso esperando o mecanismo. */
function EntrarApp() {
  const [conta, setConta] = React.useState(undefined); // undefined = conferindo sessão salva
  const [recuperacao, setRecuperacao] = React.useState(false);
  const [erroLogin, setErroLogin] = React.useState("");
  const [acordando, setAcordando] = React.useState(false);
  const iframeRef = React.useRef(null);
  const prontoRef = React.useRef(false);

  React.useEffect(() => {
    const C = window.ReinoContas;
    if (!C || !C.iniciar) { setErroLogin("Não foi possível carregar o login do Reino. Recarregue a página."); setConta(null); return; }
    C.iniciar().then((r) => {
      if (r.erro) setErroLogin("O link do e-mail não vale mais (" + r.erro + "). Peça outro.");
      else if (r.aviso) setErroLogin(r.aviso);
      if (r.recuperacao) { setRecuperacao(true); setConta(null); } else setConta(r.sessao && r.sessao.token ? r.sessao : null);
    }).catch((e) => { setErroLogin((e && e.message) || "Não foi possível conferir sua sessão agora. Tente de novo."); setConta(null); });
  }, []);

  // sem sessão salva ainda: cria o Reino dormindo, no tempo ocioso (não atrapalha o login)
  React.useEffect(() => {
    if (conta !== null || iframeRef.current) return;
    const criar = () => {
      if (iframeRef.current) return;
      const f = document.createElement("iframe");
      f.src = "index.html?aquecendo=1";
      f.title = "Reino (pré-carregando)";
      f.setAttribute("aria-hidden", "true");
      f.tabIndex = -1;
      f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:-1;";
      document.body.appendChild(f);
      iframeRef.current = f;
    };
    const ocioso = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    ocioso(criar);
  }, [conta]);

  React.useEffect(() => {
    const ouvir = (e) => {
      if (e.origin !== window.location.origin) return;
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      if (e.data && e.data.tipo === "reino:pronto") prontoRef.current = true;
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, []);

  // login OK: acorda o Reino que já está pronto (ou, sem tempo de aquecer, navega normal)
  function acordar(sessaoConta) {
    setAcordando(true);
    let desistiu = false;
    const semTempo = setTimeout(() => { desistiu = true; window.location.href = "index.html"; }, 6000);
    const tentar = () => {
      if (desistiu) return;
      const f = iframeRef.current;
      if (!f || !f.contentWindow) { clearTimeout(semTempo); window.location.href = "index.html"; return; }
      if (!prontoRef.current) { setTimeout(tentar, 80); return; }
      clearTimeout(semTempo);
      f.contentWindow.postMessage({ tipo: "reino:acordar", sessao: sessaoConta }, window.location.origin);
      f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;opacity:1;pointer-events:auto;z-index:1;";
    };
    tentar();
  }

  if (conta === undefined) return <div className="hg-moldura hg-moldura-login" aria-busy="true"><p className="hg-carregando-conta">Conferindo sua sessão…</p></div>;
  if (conta) { window.location.href = "index.html"; return <div className="hg-moldura hg-moldura-login" aria-busy="true"><p className="hg-carregando-conta">Entrando…</p></div>; }

  return (
    <div className="hg-moldura hg-moldura-login" style={acordando ? { visibility: "hidden" } : undefined}>
      <window.LoginImersivo recuperacao={recuperacao} erroInicial={erroLogin}
        onEntrar={(s) => {
          const c = s || (window.ReinoContas && window.ReinoContas.sessao()) || null;
          if (c && c.token) acordar(c); else setConta(null);
        }} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<EntrarApp />);
