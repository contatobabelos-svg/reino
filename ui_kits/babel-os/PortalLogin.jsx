/* Portal de entrada do Reino — composição de "primeira dobra" em tela cheia:
   céu holográfico animado (canvas próprio: estrelas, globo em grade e piso de grade),
   névoa ciano/violeta/azul derivando, barra fixa no topo, letreiro neon "REINO",
   painel largo de vidro com o login e a definição de dicionário no canto.
   Mesmas props do LoginScreen: onEntrar(conta), recuperacao, avisoInicial, erroInicial.
   Modos: entrar · cadastro · esqueci (link por e-mail) · nova-senha (veio do link).
   Fundo em vídeo (TODO Q): o vídeo toca uma vez; em VIDEO_LOGIN.cardEm o card sobe junto
   com a cena e o fundo desfoca. Céu em canvas + névoa + letreiro CSS viram reserva. */

/* Vídeo de fundo do login. Para trocar o vídeo: rode assets/login/preparar-video.sh <novo.mp4>
   e ajuste cardEm (segundo em que o card começa a subir) e subidaDur (duração da subida). */
const VIDEO_LOGIN = {
  src: { webm: "assets/login/fundo-login.webm", mp4: "assets/login/fundo-login.mp4" },
  final: "assets/login/fundo-login-final.jpg", // último quadro: movimento reduzido e card direto
  cardEm: 4.5,        // s — provisório (0.mp4 tem 5,875 s); no vídeo final: quando a torre de água sobe
  subidaDur: 1.2,     // s — subida do card e entrada do desfoque
  pularDur: 0.45,     // s — subida curta quando a pessoa pula ou o vídeo falha
  esperaMax: 2.5,     // s sem começar a tocar → desiste do vídeo e usa o fundo de reserva
  foco: "50% 50%",        // object-position no computador
  focoCelular: "50% 50%", // object-position no celular (cover corta as laterais)
};

const PORTAL_TITULOS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];

/* Céu do portal: um canvas só, 30 quadros/s no máximo, pausa com a aba escondida.
   Com prefers-reduced-motion desenha um quadro parado e não anima. */
function PortalCeu() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const ctx = cv.getContext("2d");
    const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const cor = (nome, reserva) => (css.getPropertyValue(nome).trim() || reserva);
    const CIANO = cor("--cyan", "#3fe3ff"), AZUL = cor("--blue", "#3b82ff"), VIOLETA = cor("--violet", "#8b5cff");
    let w = 0, h = 0, dpr = 1, raf = 0, ultimo = 0, t0 = performance.now();
    let estrelas = [];
    const rgba = (hex, a) => { const n = parseInt(hex.replace("#", ""), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };

    const medir = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const qtd = Math.round(Math.min(220, (w * h) / 6500));
      estrelas = Array.from({ length: qtd }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.78, r: Math.random() * 1.2 + 0.25, f: Math.random() * Math.PI * 2, v: 0.6 + Math.random() * 1.6 }));
    };

    const desenhar = (t) => {
      ctx.clearRect(0, 0, w, h);
      // estrelas piscando devagar
      for (const s of estrelas) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.f + t * s.v * 0.8));
        ctx.fillStyle = rgba("#e6efff", a.toFixed(3));
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      // globo em grade (projeção ortográfica), girando no eixo inclinado
      const R = Math.min(w * 0.36, h * 0.46, 460);
      const cx = w / 2, cy = h * 0.5;
      const giro = t * 0.08, incl = 0.38;
      const ci = Math.cos(incl), si = Math.sin(incl);
      const proj = (lat, lon) => {
        const x = Math.cos(lat) * Math.sin(lon + giro), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon + giro);
        const y2 = y * ci - z * si, z2 = y * si + z * ci;
        return [cx + x * R, cy - y2 * R, z2];
      };
      const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.25);
      halo.addColorStop(0, rgba(AZUL, 0.10)); halo.addColorStop(0.75, rgba(VIOLETA, 0.06)); halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1;
      const linha = (pontos) => {
        for (let i = 1; i < pontos.length; i++) {
          const a = pontos[i - 1], b = pontos[i];
          const z = (a[2] + b[2]) / 2;
          ctx.strokeStyle = z > 0 ? rgba(CIANO, (0.10 + 0.32 * z).toFixed(3)) : rgba(AZUL, (0.05 + 0.05 * (1 + z)).toFixed(3));
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
      };
      const PASSO = Math.PI / 36;
      for (let la = -60; la <= 60; la += 30) { const lat = (la * Math.PI) / 180, p = []; for (let lo = 0; lo <= Math.PI * 2 + 0.001; lo += PASSO) p.push(proj(lat, lo)); linha(p); }
      for (let m = 0; m < 12; m++) { const lon = (m * Math.PI) / 6, p = []; for (let la = -Math.PI / 2; la <= Math.PI / 2 + 0.001; la += PASSO) p.push(proj(la, lon)); linha(p); }
      // "cidades" acesas sobre o globo
      for (let k = 0; k < 26; k++) {
        const lat = Math.sin(k * 12.9898) * 1.1, lon = k * 2.399;
        const [x, y, z] = proj(lat, lon);
        if (z <= 0.05) continue;
        const pulso = 0.5 + 0.5 * Math.sin(t * 1.4 + k);
        ctx.fillStyle = rgba(k % 3 === 0 ? VIOLETA : CIANO, (0.35 + 0.55 * z * pulso).toFixed(3));
        ctx.beginPath(); ctx.arc(x, y, 1.4 + 1.4 * z, 0, Math.PI * 2); ctx.fill();
      }
      // piso de grade holográfica em perspectiva, rolando para a frente
      const hz = h * 0.72, fundo = h;
      ctx.strokeStyle = rgba(CIANO, 0.16);
      const desloc = (t * 0.35) % 1;
      for (let i = 0; i < 14; i++) {
        const z = (i + 1 - desloc) / 14; const y = hz + (fundo - hz) * z * z;
        ctx.globalAlpha = Math.min(1, z * 1.4); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (let i = -16; i <= 16; i++) {
        ctx.strokeStyle = rgba(i % 4 === 0 ? VIOLETA : CIANO, 0.12);
        ctx.beginPath(); ctx.moveTo(cx + i * 14, hz); ctx.lineTo(cx + i * w * 0.12, fundo); ctx.stroke();
      }
      const brilho = ctx.createLinearGradient(0, hz - 2, 0, hz + 40);
      brilho.addColorStop(0, rgba(CIANO, 0.18)); brilho.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = brilho; ctx.fillRect(0, hz - 2, w, 42);
    };

    const quadro = (agora) => {
      raf = requestAnimationFrame(quadro);
      if (document.hidden || agora - ultimo < 33) return;
      ultimo = agora;
      desenhar((agora - t0) / 1000);
    };
    const aoMudar = () => { medir(); if (quieto) desenhar(4); };
    medir();
    if (quieto) desenhar(4); else raf = requestAnimationFrame(quadro);
    window.addEventListener("resize", aoMudar);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", aoMudar); };
  }, []);
  return <canvas ref={ref} className="hg-portal-canvas" aria-hidden="true" />;
}

function PortalSeta() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PortalLogin({ onEntrar, recuperacao, avisoInicial, erroInicial }) {
  const DS = window.BabelOSDesignSystem_5ad360 || {};
  const Icon = DS.Icon;
  const [aba, setAba] = React.useState(recuperacao ? "nova-senha" : "entrar");
  const [f, setF] = React.useState({ usuario: "", senha: "", senha2: "", nome: "", email: "", afiliado: "" });
  const [aviso, setAviso] = React.useState(avisoInicial || "");
  const [erro, setErro] = React.useState(erroInicial || "");
  const [indo, setIndo] = React.useState(false);
  const [saindo, setSaindo] = React.useState(false);
  const [mostraAfiliado, setMostraAfiliado] = React.useState(false);
  const primeiroCampo = React.useRef(null);

  /* ---------- fundo em vídeo ----------
     fundo: "video" (toca e revela o card) · "imagem" (último quadro parado, desfocado) · "reserva" (céu em canvas)
     card:  "espera" (invisível e inerte) · "entra" (subindo) · "pronto" (entrou sem esperar o vídeo) */
  const inicio = React.useMemo(() => {
    let quieto = false;
    try { quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { quieto = false; }
    return quieto || recuperacao || erroInicial || avisoInicial ? "imagem" : "video";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [fundo, setFundo] = React.useState(inicio);
  const [card, setCard] = React.useState(inicio === "video" ? "espera" : "pronto");
  const [desfoque, setDesfoque] = React.useState(false);
  const [subida, setSubida] = React.useState(VIDEO_LOGIN.subidaDur);
  const videoRef = React.useRef(null);
  const entrouRef = React.useRef(inicio !== "video");
  const tocouRef = React.useRef(false);
  const pularNoFimRef = React.useRef(false);
  const topoRef = React.useRef(null), centroRef = React.useRef(null), defRef = React.useRef(null);
  const esperando = card === "espera";

  const entrar = React.useCallback((rapido) => {
    if (entrouRef.current) return;
    entrouRef.current = true;
    setSubida(rapido ? VIDEO_LOGIN.pularDur : VIDEO_LOGIN.subidaDur);
    setDesfoque(true);
    setCard("entra");
  }, []);
  const irProFim = (v) => {
    if (!v || !isFinite(v.duration) || !v.duration) { pularNoFimRef.current = true; return; }
    const alvo = Math.max(0, v.duration - 0.05);
    let pode = false;
    try { for (let i = 0; i < v.seekable.length; i++) if (v.seekable.start(i) <= alvo && v.seekable.end(i) >= alvo) pode = true; } catch (e) { pode = false; }
    // servidor sem Range (vídeo não pesquisável): o JPG do último quadro faz o papel do fim do vídeo
    if (!pode) { setFundo("imagem"); return; }
    try { v.pause(); v.currentTime = alvo; } catch (e) { setFundo("imagem"); }
  };
  const pular = React.useCallback(() => { entrar(true); irProFim(videoRef.current); }, [entrar]);
  const falhar = React.useCallback(() => {
    if (tocouRef.current) return; // já tocou: um erro tardio não derruba a cena
    setFundo("reserva"); setDesfoque(false); entrar(true);
  }, [entrar]);

  // tempos do vídeo: requestVideoFrameCallback (preciso) com timeupdate de reserva
  React.useEffect(() => {
    if (fundo !== "video") return undefined;
    const v = videoRef.current;
    if (!v) return undefined;
    let vivo = true, idQuadro = 0, timer = 0;
    const checar = (t) => { if (t >= VIDEO_LOGIN.cardEm) { entrar(false); return true; } return false; };
    const temQuadro = typeof v.requestVideoFrameCallback === "function";
    const aoQuadro = (agora, meta) => { if (vivo && !checar(meta.mediaTime)) idQuadro = v.requestVideoFrameCallback(aoQuadro); };
    if (temQuadro) idQuadro = v.requestVideoFrameCallback(aoQuadro);
    const aoTempo = () => checar(v.currentTime);
    const aoFim = () => entrar(false);
    const aoTocar = () => { tocouRef.current = true; };
    const aoMeta = () => { if (pularNoFimRef.current) { pularNoFimRef.current = false; irProFim(v); } };
    v.addEventListener("timeupdate", aoTempo);
    v.addEventListener("ended", aoFim);
    v.addEventListener("playing", aoTocar);
    v.addEventListener("loadedmetadata", aoMeta);
    // mais de esperaMax sem tocar (rede lenta, autoplay bloqueado) → reserva; aba escondida não conta
    const armar = () => { timer = setTimeout(() => { if (!vivo || tocouRef.current) return; if (document.hidden) armar(); else falhar(); }, VIDEO_LOGIN.esperaMax * 1000); };
    armar();
    v.muted = true;
    const p = v.play && v.play();
    if (p && p.catch) p.catch((err) => { if (vivo && !(err && err.name === "AbortError") && !entrouRef.current) falhar(); });
    return () => {
      vivo = false; clearTimeout(timer);
      if (temQuadro && idQuadro && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(idQuadro);
      v.removeEventListener("timeupdate", aoTempo); v.removeEventListener("ended", aoFim);
      v.removeEventListener("playing", aoTocar); v.removeEventListener("loadedmetadata", aoMeta);
    };
  }, [fundo, entrar, falhar]);

  // qualquer clique, toque ou tecla antes do card pula para o estado final
  React.useEffect(() => {
    if (!esperando) return undefined;
    const aoGesto = () => pular();
    window.addEventListener("pointerdown", aoGesto, true);
    window.addEventListener("keydown", aoGesto, true);
    return () => { window.removeEventListener("pointerdown", aoGesto, true); window.removeEventListener("keydown", aoGesto, true); };
  }, [esperando, pular]);
  // aviso ou erro que chega depois (ex.: volta do link de confirmação) mostra o card na hora
  React.useEffect(() => { if ((aviso || erro) && esperando) pular(); }, [aviso, erro, esperando, pular]);

  // card invisível não recebe foco: inert (+ aria-hidden no JSX) até entrar
  React.useLayoutEffect(() => {
    [topoRef, centroRef, defRef].forEach((r) => { if (r.current) r.current.inert = esperando; });
  }, [esperando]);
  React.useEffect(() => {
    if (card !== "entra") return undefined;
    const t = setTimeout(() => {
      const ativo = document.activeElement;
      if ((!ativo || ativo === document.body) && primeiroCampo.current) primeiroCampo.current.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [card]);

  React.useEffect(() => { if (recuperacao) setAba("nova-senha"); }, [recuperacao]);
  React.useEffect(() => { if (avisoInicial) setAviso(avisoInicial); }, [avisoInicial]);
  React.useEffect(() => { if (erroInicial) setErro(erroInicial); }, [erroInicial]);

  // código de quem indicou: ?ref= na URL, /r/código ou colado no campo
  const refUrl = React.useMemo(() => {
    try {
      const A = window.ReinoAfiliados;
      const c = (A ? A.codigoDaUrl() : "") || sessionStorage.getItem("reino.ref") || new URLSearchParams(location.search).get("ref") || "";
      return A && A.ehPadrao && A.ehPadrao(c) ? "" : c;
    } catch (e) { return ""; }
  }, []);
  const codigoRef = (v) => { const s = String(v || ""); const m = s.match(/[?&]ref=([^&#\s]+)/) || s.match(/\/r\/([A-Za-z0-9_-]+)/); return (m ? decodeURIComponent(m[1]) : s.trim()).toLowerCase(); };
  const codigo = codigoRef(f.afiliado) || refUrl;

  const campo = (k) => (e) => { const v = e.target.value; setF((o) => ({ ...o, [k]: v })); setErro(""); };
  const trocarAba = (a) => {
    setAba(a); setErro(""); setAviso("");
    setTimeout(() => { if (primeiroCampo.current) primeiroCampo.current.focus(); }, 30);
  };
  const focarEntrar = () => { if (aba !== "entrar") trocarAba("entrar"); else if (primeiroCampo.current) primeiroCampo.current.focus(); };

  const enviar = async (e) => {
    e.preventDefault();
    if (indo) return;
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
      try { await C.trocarSenha(f.senha); setSaindo(true); setTimeout(() => onEntrar && onEntrar(C.sessao()), 600); }
      catch (err) { setErro(err.message); setIndo(false); }
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
        let titulo; try { titulo = localStorage.getItem("reino.tituloEscolhido") || undefined; } catch (e2) { titulo = undefined; }
        const r = await C.cadastrar({ nome: f.nome.trim(), email, senha: f.senha, titulo, indicadoPor: codigo || (window.ReinoAfiliados ? window.ReinoAfiliados.codigoDaUrl() : undefined) || undefined });
        // a foto escolhida antes da conta existir passa a valer para o nome
        if (window.ReinoFotos) {
          const provisoria = window.ReinoFotos.obter("novo-cadastro");
          if (provisoria && f.nome.trim()) { window.ReinoFotos.definir(f.nome.trim(), provisoria); window.ReinoFotos.remover("novo-cadastro"); }
        }
        // registra o indicado só depois que a conta existe de verdade
        if (window.ReinoAfiliados && window.ReinoAfiliados.registrarCadastro) {
          const perfil = window.BABEL_DEMO && window.BABEL_DEMO.perfil;
          window.ReinoAfiliados.registrarCadastro({ nome: f.nome.trim(), email, titulo: titulo || (perfil && perfil.titulo) });
        }
        if (r.confirmar) {
          // o Supabase exige confirmar o e-mail antes do primeiro login
          setIndo(false); setAba("entrar"); setErro("");
          setF((o) => ({ ...o, usuario: email, senha: "" }));
          setAviso("Conta criada! Enviamos um link de confirmação para " + email + ". Confirme seu e-mail e depois entre aqui.");
          return;
        }
        conta = (C.carregarConta && (await C.carregarConta())) || r.sessao;
      }
    } catch (err) { setIndo(false); setErro(err.message || "Não foi possível continuar."); return; }
    if (codigo) { try { localStorage.setItem("reino.indicadoPor", codigo); sessionStorage.setItem("reino.ref", codigo); } catch (e3) { /* sem armazenamento */ } }
    setSaindo(true);
    setTimeout(() => onEntrar && onEntrar(conta), 650);
  };

  const rotuloBotao = indo ? "Aguarde" : { entrar: "Entrar no Reino", cadastro: "Criar minha conta", esqueci: "Enviar link por e-mail", "nova-senha": "Salvar nova senha" }[aba];
  const tituloPainel = { entrar: "Entre no seu território", cadastro: "Crie sua conta no Reino", esqueci: "Recuperar acesso", "nova-senha": "Crie uma nova senha" }[aba];
  const nota = {
    entrar: "Entre com o e-mail e a senha da sua conta.",
    cadastro: "Sua conta entra como aguardando aprovação de um administrador.",
    esqueci: "Você recebe um link para criar uma nova senha.",
    "nova-senha": "Mínimo de 6 caracteres.",
  }[aba];

  return (
    <div className={"hg-portal" + (indo ? " is-indo" : "") + (saindo ? " is-saindo" : "")
        + (fundo !== "reserva" ? " tem-video" : "") + (esperando ? " is-espera" : "") + (card === "entra" ? " is-entra" : "")
        + (fundo === "imagem" || (fundo === "video" && desfoque) ? " is-desfocado" : "")}
      style={{ "--hg-portal-subida": subida + "s", "--hg-portal-foco": VIDEO_LOGIN.foco, "--hg-portal-foco-celular": VIDEO_LOGIN.focoCelular }}>
      <div className={"hg-portal-fundo" + (fundo !== "reserva" ? " is-video" : "")} aria-hidden="true">
        {fundo === "video" ? (
          <video ref={videoRef} className="hg-portal-video" muted playsInline autoPlay preload="auto"
            disablePictureInPicture disableRemotePlayback tabIndex={-1} onError={falhar}>
            <source src={VIDEO_LOGIN.src.webm} type="video/webm" />
            <source src={VIDEO_LOGIN.src.mp4} type="video/mp4" onError={falhar} />
          </video>
        ) : fundo === "imagem" ? (
          <img className="hg-portal-video" src={VIDEO_LOGIN.final} alt="" decoding="async" onError={() => setFundo("reserva")} />
        ) : (
          <>
            <PortalCeu />
            <span className="hg-portal-nevoa n1" /><span className="hg-portal-nevoa n2" /><span className="hg-portal-nevoa n3" /><span className="hg-portal-nevoa n4" />
          </>
        )}
        <span className="hg-portal-degrade" />
      </div>

      <header ref={topoRef} className="hg-portal-topo" aria-hidden={esperando || undefined}>
        <a className="hg-portal-marca" href="#portal-painel" aria-label="REINO · Babel OS — ir para o login">
          <span className="hg-brand-coroa">{Icon ? <Icon name="coroa" /> : null}</span>
          <span><b>REINO</b><i aria-hidden="true"> · </i><em>Babel OS</em></span>
        </a>
        {aba === "nova-senha" ? null : (
          <button type="button" className="hg-portal-pilula" aria-pressed={aba === "cadastro"}
            onClick={() => trocarAba(aba === "cadastro" ? "entrar" : "cadastro")}>
            {aba === "cadastro" ? "Já tenho conta" : "Criar conta"}
          </button>
        )}
      </header>

      <main ref={centroRef} className="hg-portal-centro" aria-hidden={esperando || undefined}>
        <h1 className="hg-portal-letreiro" aria-label="Reino">REINO</h1>

        <form id="portal-painel" className={"hg-portal-painel" + (aba === "cadastro" ? " is-cadastro" : "")} onSubmit={enviar} noValidate aria-busy={indo} aria-labelledby="portal-titulo">
          <p id="portal-titulo" className="hg-portal-titulo">{tituloPainel}</p>

          {aviso ? <p className="hg-portal-msg is-aviso" role="status">{aviso}</p> : null}

          {aba === "cadastro" && window.FotoAvatar ? (
            <div className="hg-portal-foto">
              <FotoAvatar chave={f.nome.trim() || "novo-cadastro"} nome={f.nome.trim() || "?"} size={56} editavel camera />
              <p><b>Sua foto</b><span>Toque para usar a câmera ou escolher da galeria. Ela aparece no mapa, no feed e na rede.</span></p>
            </div>
          ) : null}

          <div className={"hg-portal-campos" + (aba === "esqueci" ? " is-um" : "") + (aba === "cadastro" ? " is-tres" : "")}>
            {aba === "cadastro" ? (
              <label className="hg-portal-campo"><span>Nome</span>
                <input ref={primeiroCampo} value={f.nome} onChange={campo("nome")} autoComplete="name" placeholder="Seu nome" autoFocus={!esperando} />
              </label>
            ) : null}
            {aba === "entrar" || aba === "esqueci" ? (
              <label className="hg-portal-campo"><span>{aba === "esqueci" ? "E-mail da sua conta" : "E-mail"}</span>
                <input ref={primeiroCampo} type="email" inputMode="email" value={f.usuario} onChange={campo("usuario")} autoComplete="username" placeholder="voce@empresa.com.br" autoFocus={!esperando} />
              </label>
            ) : null}
            {aba === "cadastro" ? (
              <label className="hg-portal-campo"><span>E-mail</span>
                <input type="email" inputMode="email" value={f.email} onChange={campo("email")} autoComplete="email" placeholder="voce@empresa.com.br" />
              </label>
            ) : null}
            {aba === "entrar" || aba === "cadastro" ? (
              <label className="hg-portal-campo"><span>Senha</span>
                <input type="password" value={f.senha} onChange={campo("senha")} autoComplete={aba === "entrar" ? "current-password" : "new-password"} placeholder={aba === "cadastro" ? "Mínimo de 6 caracteres" : "Sua senha"} />
              </label>
            ) : null}
            {aba === "nova-senha" ? (
              <>
                <label className="hg-portal-campo"><span>Nova senha</span>
                  <input ref={primeiroCampo} type="password" value={f.senha} onChange={campo("senha")} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" autoFocus={!esperando} />
                </label>
                <label className="hg-portal-campo"><span>Repita a nova senha</span>
                  <input type="password" value={f.senha2} onChange={campo("senha2")} autoComplete="new-password" placeholder="Igual à de cima" />
                </label>
              </>
            ) : null}
          </div>

          {aba === "cadastro" ? (
            <div className="hg-portal-afiliado">
              {mostraAfiliado || f.afiliado ? (
                <label className="hg-portal-campo is-pequeno"><span>Link de afiliado (opcional)</span>
                  <input value={f.afiliado} onChange={campo("afiliado")} placeholder={(window.REINO_DOMINIO || location.origin) + "/r/…"} autoComplete="off" />
                </label>
              ) : (
                <button type="button" className="hg-portal-link" onClick={() => setMostraAfiliado(true)}>
                  {refUrl ? "Indicado por " + refUrl + " · alterar" : "Tenho um link de afiliado"}
                </button>
              )}
              {codigo && (mostraAfiliado || f.afiliado) ? <p className="hg-portal-indicado">Indicado por <b>{codigo}</b></p> : null}
            </div>
          ) : null}

          {erro ? <p className="hg-portal-msg is-erro" role="alert">{erro}</p> : null}

          <div className="hg-portal-base">
            <div className="hg-portal-escada">
            <ul className="hg-portal-titulos" aria-label="Títulos do Reino, de Barão a Imperador">
              {PORTAL_TITULOS.map((t, i) => (
                <li key={t} className={"hg-portal-chip" + (t === "Imperador" ? " is-ouro" : "")} style={{ "--i": i }} title={t}>
                  <span className="hg-portal-chip-bola" aria-hidden="true">{t.charAt(0)}</span>
                  <span className="hg-portal-chip-nome">{t}</span>
                </li>
              ))}
            </ul>
            <span className="hg-portal-escada-rotulo" aria-hidden="true">Barão → <b>Imperador</b></span>
            </div>
            <div className="hg-portal-acoes">
              <div className="hg-portal-links">
                {aba === "entrar" ? <button type="button" className="hg-portal-link" onClick={() => trocarAba("esqueci")}>Esqueci a senha</button> : null}
                {aba === "entrar" ? <button type="button" className="hg-portal-link" onClick={() => trocarAba("cadastro")}>Criar conta</button> : null}
                {aba === "cadastro" || aba === "esqueci" ? <button type="button" className="hg-portal-link" onClick={() => trocarAba("entrar")}>Voltar para entrar</button> : null}
              </div>
              <button type="submit" className="hg-portal-enviar" disabled={indo} aria-label={rotuloBotao} title={rotuloBotao}>
                {indo ? <span className="hg-portal-giro" aria-hidden="true" /> : <PortalSeta />}
              </button>
            </div>
          </div>
          <p className="hg-portal-nota" aria-live="polite">{indo ? "Conectando ao Reino…" : nota}</p>
        </form>

        <p className="hg-portal-novidades">
          <span className="rotulo">Novidades:</span> <span>Notícias</span><i aria-hidden="true">·</i><span>Música</span><i aria-hidden="true">·</i><span>Assistente</span><i aria-hidden="true">·</i>
          <button type="button" className="hg-portal-link is-destaque" onClick={focarEntrar}>Entrar</button>
        </p>
      </main>

      <aside ref={defRef} className="hg-portal-def" aria-label="Definição" aria-hidden={esperando || undefined}>
        <p className="hg-portal-def-termo"><span>Def.</span> reino<small>(bn)</small>:</p>
        <p className="hg-portal-def-pron"><span>/ˈʁej.nu/</span><span>substantivo</span></p>
        <p className="hg-portal-def-frase">rede de negócios brasileira onde cada empresa comanda o seu território</p>
      </aside>
    </div>
  );
}

Object.assign(window, { PortalLogin });
