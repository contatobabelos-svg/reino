/* LoginImersivo — entrada do Reino no estilo da barra de comando do Babel OS (TODO W).
   Nada de caixa: fundo "Reino Animado" em tela cheia, conversa com bolhas e uma barra de
   comando embaixo, uma pergunta por vez.
   - Sempre abre no CADASTRO (carrossel): nome → empresa → CNPJ → cidade/UF → foto → e-mail →
     usuário → senha → confirmação → resumo → criar conta. Tudo obrigatório; validado aqui e de
     novo no servidor (função reino-cadastro). A cidade e a UF (AF11) são o lugar da empresa no
     mapa do Reino — o nome é conferido na lista de municípios do IBGE.
   - "Já tenho conta": usuário → enviar → senha → enviar (aceita o e-mail no lugar do usuário,
     porque contas antigas não têm usuário). Função reino-login.
   - E-mail não validado (depois do cadastro ou no login com a senha certa): "valide seu
     e-mail", e-mail mascarado, reenviar e a lista Gmail / Yahoo / Outlook (nova aba).
   - Também cobre "esqueci a senha" e "nova senha" (link do e-mail), como o PortalLogin.
   Mesmas props do PortalLogin: onEntrar(conta), recuperacao, avisoInicial, erroInicial.
   Reserva: se esta tela não carregar, o App usa o PortalLogin. */
(function () {
  const ASSETS = {
    reservaVideo: { webm: "assets/login/fundo-login.webm?v=juntos7", mp4: "assets/login/fundo-login.mp4?v=juntos7" },
    reservaImagem: "assets/login/fundo-login-final.jpg",
  };
  const CORREIOS = [
    { nome: "Gmail", url: "https://mail.google.com", letra: "G" },
    { nome: "Yahoo", url: "https://mail.yahoo.com", letra: "Y" },
    { nome: "Outlook", url: "https://outlook.live.com", letra: "O" },
  ];
  const FOTO_LADO = 512;

  /* ---------------------------------------------------------------- validações (iguais às do servidor) */
  const soDigitos = (v) => String(v || "").replace(/\D/g, "");
  const mascaraCnpj = (v) => {
    const d = soDigitos(v).slice(0, 14);
    let o = d.slice(0, 2);
    if (d.length > 2) o += "." + d.slice(2, 5);
    if (d.length > 5) o += "." + d.slice(5, 8);
    if (d.length > 8) o += "/" + d.slice(8, 12);
    if (d.length > 12) o += "-" + d.slice(12, 14);
    return o;
  };
  function cnpjValido(c) {
    if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
    const dv = (pesos) => { const s = pesos.reduce((t, p, i) => t + Number(c[i]) * p, 0) % 11; return s < 2 ? 0 : 11 - s; };
    return dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[12]) && dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[13]);
  }
  const USUARIO_RE = /^[a-z0-9][a-z0-9._]{2,23}$/;
  const RESERVADOS = ["admin", "administrador", "adm", "root", "reino", "babel", "babelos", "babel.os", "suporte", "ajuda", "contato", "sistema", "system", "api", "www", "imperador", "oficial", "moderador", "teste"];
  const limparUsuario = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 24);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const nomeOk = (n) => n.length >= 5 && n.length <= 80 && /^[\p{L}][\p{L}'’.\- ]+$/u.test(n) && n.split(/\s+/).filter((p) => p.length >= 2).length >= 2;
  const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";

  /* ---------------------------------------------------------------- cidade e UF (AF11)
     A empresa só aparece no mapa do Reino com cidade e UF. A pessoa escreve tudo
     numa linha ("Campinas, SP", "Campinas - SP" ou "Campinas SP") e conferimos o
     nome na lista de municípios do IBGE (dados/municipios-tudo.js): é dela que sai
     a posição no mapa. Sem a lista carregada, aceita o que foi escrito. */
  const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  function lerCidadeUf(valor) {
    const bruto = String(valor || "").replace(/\s+/g, " ").trim();
    if (!bruto) return { erro: "Escreva a cidade e a UF, assim: Campinas, SP." };
    const m = bruto.match(/^(.*?)[\s,;/•-]+([A-Za-z]{2})$/);
    if (!m) return { erro: "Falta a UF. Escreva assim: Campinas, SP." };
    const uf = m[2].toUpperCase();
    const cidade = m[1].replace(/[,;/-]+$/, "").trim();
    if (!UFS.includes(uf)) return { erro: `"${uf}" não é uma UF do Brasil. Escreva assim: Campinas, SP.` };
    if (cidade.length < 2) return { erro: "Faltou o nome da cidade. Escreva assim: Campinas, SP." };
    const lista = window.REINO_MUNICIPIOS && window.REINO_MUNICIPIOS[uf] && window.REINO_MUNICIPIOS[uf].cidades;
    if (!lista || !lista.length) return { cidade, uf };
    const alvo = semAcento(cidade);
    const exata = lista.find((c) => semAcento(c.nome) === alvo);
    if (exata) return { cidade: exata.nome, uf };
    const perto = lista.filter((c) => semAcento(c.nome).startsWith(alvo.slice(0, 4))).slice(0, 3).map((c) => c.nome);
    return { erro: `Não achei "${cidade}" em ${uf}.` + (perto.length ? ` Você quis dizer ${perto.join(", ")}?` : " Confira o nome da cidade.") };
  }

  /* ---------------------------------------------------------------- ícones (traço, herdam a cor) */
  const Svg = ({ children, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
  );
  const IcEnviar = () => <Svg><path d="M12 19V5M5 12l7-7 7 7" /></Svg>;
  const IcVoltar = () => <Svg><path d="m15 6-6 6 6 6" /></Svg>;
  const IcOlho = () => <Svg><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>;
  const IcOlhoFechado = () => <Svg><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>;
  const IcCamera = () => <Svg><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
  const IcGaleria = () => <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-8 9" /></Svg>;
  const IcReenviar = () => <Svg><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></Svg>;
  const IcSeta = () => <Svg size={16}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
  const IcGiro = () => <span className="hg-li-giro" aria-hidden="true" />;

  /* ---------------------------------------------------------------- fundo de reserva (vídeo antigo) */
  function FundoReserva() {
    const quieto = React.useMemo(() => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }, []);
    const [imagem, setImagem] = React.useState(quieto);
    const formato = React.useMemo(() => { try { return document.createElement("video").canPlayType('video/webm; codecs="vp9"') ? "webm" : "mp4"; } catch (e) { return "mp4"; } }, []);
    return (
      <div className="hg-li-reserva" aria-hidden="true">
        {imagem
          ? <img src={ASSETS.reservaImagem} alt="" />
          : <video src={ASSETS.reservaVideo[formato]} poster={ASSETS.reservaImagem} muted playsInline autoPlay loop preload="auto" tabIndex={-1} onError={() => setImagem(true)} />}
      </div>
    );
  }

  /* ---------------------------------------------------------------- recorte quadrado da foto */
  function Recorte({ fonte, onPronto, lado }) {
    // fonte = { url, w, h } · arrastar move, a barra de zoom aproxima; onPronto(api) entrega exportar()
    const [zoom, setZoom] = React.useState(1);
    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    const arr = React.useRef(null);
    const base = lado / Math.min(fonte.w, fonte.h);
    const dw = fonte.w * base * zoom, dh = fonte.h * base * zoom;
    const limitar = (p, z) => {
      const mx = (fonte.w * base * z - lado) / 2, my = (fonte.h * base * z - lado) / 2;
      return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
    };
    React.useEffect(() => {
      onPronto({
        exportar: () => new Promise((ok, falha) => {
          const img = new Image();
          img.onload = () => {
            const cv = document.createElement("canvas");
            cv.width = cv.height = FOTO_LADO;
            const k = FOTO_LADO / lado;
            const ctx = cv.getContext("2d");
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, (lado / 2 + pos.x - dw / 2) * k, (lado / 2 + pos.y - dh / 2) * k, dw * k, dh * k);
            cv.toBlob((b) => {
              if (b && b.type === "image/webp") return ok(b);
              cv.toBlob((j) => (j ? ok(j) : falha(new Error("sem imagem"))), "image/jpeg", 0.88);
            }, "image/webp", 0.86);
          };
          img.onerror = () => falha(new Error("imagem"));
          img.src = fonte.url;
        }),
      });
    }, [zoom, pos, fonte, lado]); // eslint-disable-line react-hooks/exhaustive-deps
    const baixar = (e) => { e.preventDefault(); arr.current = { x: e.clientX, y: e.clientY, p: pos }; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); };
    const mover = (e) => { const a = arr.current; if (!a) return; setPos(limitar({ x: a.p.x + e.clientX - a.x, y: a.p.y + e.clientY - a.y }, zoom)); };
    const soltar = () => { arr.current = null; };
    return (
      <div className="hg-li-recorte">
        <div className="hg-li-recorte-quadro" style={{ width: lado, height: lado }} onPointerDown={baixar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
          role="img" aria-label="Recorte da foto: arraste para ajustar">
          <img src={fonte.url} alt="" draggable={false} style={{ width: dw, height: dh, transform: `translate(${pos.x}px, ${pos.y}px)` }} />
          <span className="hg-li-recorte-mira" aria-hidden="true" />
        </div>
        <label className="hg-li-zoom"><span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom}
            onChange={(e) => { const z = Number(e.target.value); setZoom(z); setPos((p) => limitar(p, z)); }} />
        </label>
      </div>
    );
  }

  /* ---------------------------------------------------------------- a tela */
  function LoginImersivo({ onEntrar, recuperacao, avisoInicial, erroInicial }) {
    const DS = window.BabelOSDesignSystem_5ad360 || {};
    const Icon = DS.Icon;
    const C = window.ReinoContas;

    const [modo, setModo] = React.useState(recuperacao ? "nova-senha" : "cadastro");
    const [etapa, setEtapa] = React.useState(0);
    const [dir, setDir] = React.useState(1);
    const [dados, setDados] = React.useState({ nome: "", empresa: "", cnpj: "", cidade: "", uf: "", email: "", usuario: "", senha: "", senha2: "", afiliado: "" });
    const [texto, setTexto] = React.useState("");
    const [ver, setVer] = React.useState(false);
    const [erro, setErro] = React.useState(erroInicial || "");
    const [aviso, setAviso] = React.useState(avisoInicial || "");
    const [indo, setIndo] = React.useState(false);
    const [saindo, setSaindo] = React.useState(false);
    const [fundo, setFundo] = React.useState(window.FundoReino ? "reino" : "reserva");
    const [foto, setFoto] = React.useState(null);        // { blob, url }
    const [fonteFoto, setFonteFoto] = React.useState(null); // { url, w, h } em recorte
    const [camera, setCamera] = React.useState(null);    // MediaStream ao vivo (computador)
    const [disp, setDisp] = React.useState({ usuario: "", estado: "" }); // checando | livre | ocupado | invalido
    const [validar, setValidar] = React.useState(null);  // { emailMascarado, origem, reenviado }
    const [mostraAfiliado, setMostraAfiliado] = React.useState(false);
    const [teclado, setTeclado] = React.useState(0);
    const credRef = React.useRef({ usuario: "", senha: "" }); // só em memória, para "já validei" e "reenviar"
    const recorteRef = React.useRef(null);
    const editandoRef = React.useRef(false);
    const inputRef = React.useRef(null), acaoRef = React.useRef(null), videoRef = React.useRef(null);
    const galeriaRef = React.useRef(null), cameraInputRef = React.useRef(null);
    const ehToque = React.useMemo(() => { try { return window.matchMedia("(pointer: coarse)").matches; } catch (e) { return false; } }, []);
    const ladoRecorte = React.useMemo(() => (window.innerWidth < 480 ? 160 : 176), []);

    /* código de quem indicou: ?ref=, /r/código, localStorage reino.indicadoPor ou colado no resumo */
    const refUrl = React.useMemo(() => {
      try {
        const A = window.ReinoAfiliados;
        const c = (A ? A.codigoDaUrl() : "") || sessionStorage.getItem("reino.ref") || new URLSearchParams(location.search).get("ref") || "";
        return A && A.ehPadrao && A.ehPadrao(c) ? "" : c;
      } catch (e) { return ""; }
    }, []);
    const codigoRef = (v) => { const s = String(v || ""); const m = s.match(/[?&]ref=([^&#\s]+)/) || s.match(/\/r\/([A-Za-z0-9_-]+)/); return (m ? decodeURIComponent(m[1]) : s.trim()).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40); };
    const codigo = codigoRef(dados.afiliado) || refUrl;

    /* ---------- roteiro de cada modo ---------- */
    const ROTEIRO = {
      cadastro: ["nome", "empresa", "cnpj", "cidade", "foto", "email", "usuario", "senha", "senha2", "resumo"],
      entrar: ["l-usuario", "l-senha"],
      esqueci: ["e-email"],
      "nova-senha": ["n-senha", "n-senha2"],
      validar: ["validar"],
    };
    const passos = ROTEIRO[modo];
    const passo = passos[Math.min(etapa, passos.length - 1)];
    const ehSenha = /senha/.test(passo);
    const CAMPO = {
      nome: { chave: "nome", auto: "name", ph: "Nome e sobrenome", rotulo: "Nome completo" },
      empresa: { chave: "empresa", auto: "organization", ph: "Nome da empresa", rotulo: "Empresa" },
      cnpj: { chave: "cnpj", auto: "off", ph: "00.000.000/0000-00", modo: "numeric", rotulo: "CNPJ" },
      cidade: { chave: "cidade", auto: "address-level2", ph: "Campinas, SP", rotulo: "Cidade e UF" },
      email: { chave: "email", auto: "email", ph: "voce@empresa.com.br", tipo: "email", modo: "email", rotulo: "E-mail" },
      usuario: { chave: "usuario", auto: "username", ph: "seu.usuario", rotulo: "Usuário de login" },
      senha: { chave: "senha", auto: "new-password", ph: "Mínimo de 8 caracteres", rotulo: "Senha" },
      senha2: { chave: "senha2", auto: "new-password", ph: "Repita a senha", rotulo: "Confirmação da senha" },
      "l-usuario": { chave: "l-usuario", auto: "username", ph: "Usuário ou e-mail", rotulo: "Usuário ou e-mail" },
      "l-senha": { chave: "l-senha", auto: "current-password", ph: "Sua senha", rotulo: "Senha" },
      "e-email": { chave: "e-email", auto: "email", ph: "E-mail da sua conta", tipo: "email", modo: "email", rotulo: "E-mail" },
      "n-senha": { chave: "n-senha", auto: "new-password", ph: "Nova senha (mínimo de 8)", rotulo: "Nova senha" },
      "n-senha2": { chave: "n-senha2", auto: "new-password", ph: "Repita a nova senha", rotulo: "Confirmação" },
    }[passo];

    /* perguntas do Reino em cada etapa */
    const pergunta = () => {
      const pn = primeiroNome(dados.nome);
      switch (passo) {
        case "nome": return ["Bem-vindo ao Reino. Vamos criar sua conta — é rapidinho.", "Qual é o seu nome completo?"];
        case "empresa": return [`Prazer, ${pn}. Qual é o nome da sua empresa?`];
        case "cnpj": return ["Qual é o CNPJ da empresa?"];
        case "cidade": return ["Em que cidade a empresa fica?", "Escreva a cidade e a UF — é daí que sai o seu lugar no mapa do Reino. Ex.: Campinas, SP."];
        case "foto": return ["Agora uma foto de perfil. Ela aparece no mapa, no feed e na rede.", ehToque ? "Tire uma foto ou escolha da galeria." : "Use a câmera ou escolha um arquivo."];
        case "email": return ["Qual é o seu e-mail? Vamos mandar um link para validar."];
        case "usuario": return ["Escolha o seu usuário de login.", "Letras minúsculas, números, ponto ou sublinhado — de 3 a 24."];
        case "senha": return ["Crie uma senha com pelo menos 8 caracteres."];
        case "senha2": return ["Repita a senha para confirmar."];
        case "resumo": return ["Confira seus dados antes de criar a conta."];
        case "l-usuario": return ["Bem-vindo de volta ao Reino.", "Qual é o seu usuário? Se a conta é antiga, pode usar o e-mail."];
        case "l-senha": return ["Agora a sua senha."];
        case "e-email": return ["Sem problema. Digite o e-mail da sua conta e mandamos um link para criar uma nova senha."];
        case "n-senha": return ["Crie a sua nova senha (mínimo de 8 caracteres)."];
        case "n-senha2": return ["Repita a nova senha."];
        case "validar": return validar && validar.origem === "cadastro"
          ? ["Conta criada! Falta só validar o seu e-mail.", `Enviamos um link para ${validar.emailMascarado}. Abra, confirme e depois toque em "Já validei".`]
          : ["Sua senha confere, mas o e-mail ainda não foi validado.", `O link está em ${validar ? validar.emailMascarado : "seu e-mail"}. Abra, confirme e depois toque em "Já validei".`];
        default: return [];
      }
    };
    /* resposta anterior, mostrada como bolha da pessoa no alto da etapa */
    const anterior = () => {
      const p = passos[etapa - 1];
      if (!p || modo === "validar" || passo === "foto" || passo === "resumo") return null; // etapas altas: sem bolha anterior
      if (p === "foto") return foto ? { foto: foto.url } : null;
      if (/senha/.test(p)) return { texto: "••••••••" };
      if (p === "l-usuario") return { texto: "usuário: " + credRef.current.usuario };
      const v = dados[p];
      if (p === "cidade") return dados.cidade ? { texto: dados.cidade + (dados.uf ? " · " + dados.uf : "") } : null;
      return v ? { texto: p === "cnpj" ? mascaraCnpj(v) : p === "usuario" ? "@" + v : v } : null;
    };

    /* ---------- navegação ---------- */
    const irPara = (novoModo, novaEtapa, direcao) => {
      setDir(direcao || 1);
      setErro(""); setAviso(""); setVer(false);
      if (novoModo !== modo) setModo(novoModo);
      setEtapa(novaEtapa);
    };
    // texto da barra: ao entrar numa etapa, mostra o que já foi respondido (antes de desenhar,
    // para não apagar o que a pessoa começar a digitar)
    React.useLayoutEffect(() => {
      const k = CAMPO && CAMPO.chave;
      if (!k) { setTexto(""); return; }
      if (k === "cnpj") setTexto(mascaraCnpj(dados.cnpj));
      else if (k === "cidade") setTexto(dados.cidade ? dados.cidade + (dados.uf ? ", " + dados.uf : "") : "");
      else if (k in dados) setTexto(dados[k]);
      else if (k === "l-usuario") setTexto(credRef.current.usuario);
      else setTexto("");
    }, [modo, etapa]); // eslint-disable-line react-hooks/exhaustive-deps

    const focarBarra = React.useCallback(() => {
      const alvo = inputRef.current || acaoRef.current;
      if (alvo && document.activeElement !== alvo) { try { alvo.focus({ preventScroll: true }); } catch (e) { alvo.focus(); } }
    }, []);
    // foco na barra logo depois de desenhar a etapa (e de novo um instante depois, se algo roubar)
    React.useLayoutEffect(() => { focarBarra(); const t = setTimeout(focarBarra, 60); return () => clearTimeout(t); }, [modo, etapa, fonteFoto, foto, camera, indo, focarBarra]);

    const voltar = () => {
      if (indo) return;
      if (fonteFoto) { setFonteFoto(null); return; }
      if (camera) { pararCamera(); return; }
      if (etapa > 0) irPara(modo, etapa - 1, -1);
      else if (modo === "entrar" || modo === "esqueci") irPara(modo === "esqueci" ? "entrar" : "cadastro", 0, -1);
    };
    const trocarModo = () => {
      if (indo) return;
      pararCamera(); setFonteFoto(null); setAviso("");
      if (modo === "cadastro" || modo === "validar") irPara("entrar", 0, 1); else irPara("cadastro", 0, -1);
    };

    React.useEffect(() => { if (recuperacao) irPara("nova-senha", 0, 1); }, [recuperacao]); // eslint-disable-line react-hooks/exhaustive-deps
    React.useEffect(() => { if (avisoInicial) setAviso(avisoInicial); }, [avisoInicial]);
    React.useEffect(() => { if (erroInicial) setErro(erroInicial); }, [erroInicial]);

    /* teclado virtual no celular: a barra sobe junto */
    React.useEffect(() => {
      const vv = window.visualViewport;
      if (!vv) return undefined;
      const medir = () => setTeclado(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
      vv.addEventListener("resize", medir); vv.addEventListener("scroll", medir);
      return () => { vv.removeEventListener("resize", medir); vv.removeEventListener("scroll", medir); };
    }, []);

    /* ---------- usuário disponível (ao digitar) ---------- */
    React.useEffect(() => {
      if (passo !== "usuario") return undefined;
      const u = limparUsuario(texto);
      if (!u) { setDisp({ usuario: "", estado: "" }); return undefined; }
      if (!USUARIO_RE.test(u) || RESERVADOS.includes(u)) { setDisp({ usuario: u, estado: "invalido" }); return undefined; }
      setDisp({ usuario: u, estado: "checando" });
      let vivo = true;
      const t = setTimeout(async () => {
        const livre = C && C.usuarioDisponivel ? await C.usuarioDisponivel(u) : null;
        if (vivo) setDisp({ usuario: u, estado: livre === true ? "livre" : livre === false ? "ocupado" : "" });
      }, 350);
      return () => { vivo = false; clearTimeout(t); };
    }, [texto, passo]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ---------- foto ---------- */
    const pararCamera = () => { if (camera) { camera.getTracks().forEach((t) => t.stop()); setCamera(null); } };
    React.useEffect(() => () => { if (camera) camera.getTracks().forEach((t) => t.stop()); }, [camera]);
    React.useEffect(() => { if (camera && videoRef.current) { videoRef.current.srcObject = camera; videoRef.current.play().catch(() => {}); } }, [camera]);
    const abrirImagem = (url) => new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok({ url, w: i.naturalWidth, h: i.naturalHeight }); i.onerror = falha; i.src = url; });
    const aoEscolherArquivo = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      if (!/^image\//.test(f.type)) { setErro("Escolha um arquivo de imagem (foto)."); return; }
      if (f.size > 25 * 1024 * 1024) { setErro("Essa imagem é grande demais. Escolha outra."); return; }
      try { setErro(""); setFonteFoto(await abrirImagem(URL.createObjectURL(f))); }
      catch (err) { setErro("Não consegui abrir essa imagem. Tente outra."); }
    };
    const usarCamera = async () => {
      setErro("");
      if (ehToque || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { if (cameraInputRef.current) cameraInputRef.current.click(); return; }
      try { setFonteFoto(null); setCamera(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })); }
      catch (err) { setErro("Não foi possível abrir a câmera. Permita o acesso ou escolha um arquivo."); }
    };
    const tirarFoto = () => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      const cv = document.createElement("canvas");
      cv.width = v.videoWidth; cv.height = v.videoHeight;
      const ctx = cv.getContext("2d");
      ctx.translate(cv.width, 0); ctx.scale(-1, 1); // espelho, como a pessoa se vê
      ctx.drawImage(v, 0, 0);
      cv.toBlob(async (b) => { pararCamera(); if (b) setFonteFoto(await abrirImagem(URL.createObjectURL(b))); }, "image/jpeg", 0.92);
    };
    const confirmarRecorte = async () => {
      if (!recorteRef.current) return;
      try {
        const blob = await recorteRef.current.exportar();
        if (foto && foto.url) URL.revokeObjectURL(foto.url);
        setFoto({ blob, url: URL.createObjectURL(blob) });
        setFonteFoto(null);
        avancar();
      } catch (e) { setErro("Não consegui preparar a foto. Tente outra."); }
    };

    /* ---------- avançar etapa ---------- */
    const avancar = () => {
      if (editandoRef.current && modo === "cadastro") { editandoRef.current = false; irPara("cadastro", passos.indexOf("resumo"), 1); return; }
      irPara(modo, etapa + 1, 1);
    };
    const gravar = (k, v) => setDados((d) => ({ ...d, [k]: v }));

    const entrarComConta = (conta, texto) => {
      setAviso(texto || "Portão aberto. Bem-vindo ao Reino.");
      setSaindo(true);
      setTimeout(() => onEntrar && onEntrar(conta), 900);
    };

    const enviar = async (e) => {
      if (e) e.preventDefault();
      if (indo || saindo) return;
      if (!C) { setErro("Não foi possível conectar ao Reino agora. Recarregue a página."); return; }
      const v = texto.trim();
      setErro("");
      switch (passo) {
        case "nome": {
          const n = v.replace(/\s+/g, " ");
          if (!n) return setErro("Digite seu nome completo para continuar.");
          if (!nomeOk(n)) return setErro("Digite nome e sobrenome, só com letras.");
          gravar("nome", n); return avancar();
        }
        case "empresa": {
          const n = v.replace(/\s+/g, " ");
          if (n.length < 2 || n.length > 120 || !/[\p{L}\p{N}]/u.test(n)) return setErro("Digite o nome da sua empresa.");
          gravar("empresa", n); return avancar();
        }
        case "cnpj": {
          const d = soDigitos(v);
          if (d.length !== 14) return setErro("O CNPJ tem 14 números.");
          if (!cnpjValido(d)) return setErro("Esse CNPJ não é válido. Confira os números.");
          gravar("cnpj", d); return avancar();
        }
        case "cidade": {
          const r = lerCidadeUf(v);
          if (r.erro) return setErro(r.erro);
          gravar("cidade", r.cidade); gravar("uf", r.uf); return avancar();
        }
        case "foto": {
          if (camera) return tirarFoto();
          if (fonteFoto) return confirmarRecorte();
          if (!foto) return setErro("Escolha uma foto de perfil para continuar.");
          return avancar();
        }
        case "email": {
          const m = v.toLowerCase();
          if (!EMAIL_RE.test(m) || m.length > 254) return setErro("Digite um e-mail válido.");
          gravar("email", m); return avancar();
        }
        case "usuario": {
          const u = limparUsuario(v);
          if (!USUARIO_RE.test(u)) return setErro("Use de 3 a 24 letras minúsculas, números, ponto ou sublinhado, começando por letra ou número.");
          if (RESERVADOS.includes(u)) return setErro("Esse usuário é reservado. Escolha outro.");
          let livre = disp.usuario === u && disp.estado === "livre" ? true : disp.usuario === u && disp.estado === "ocupado" ? false : null;
          if (livre === null) { setIndo(true); livre = await C.usuarioDisponivel(u); setIndo(false); }
          if (livre === false) { setDisp({ usuario: u, estado: "ocupado" }); return setErro("Esse usuário já existe. Escolha outro."); }
          gravar("usuario", u); return avancar();
        }
        case "senha": {
          if (texto.length < 8) return setErro("A senha precisa de pelo menos 8 caracteres.");
          if (texto.length > 72) return setErro("A senha pode ter no máximo 72 caracteres.");
          if (texto !== dados.senha) gravar("senha2", "");
          gravar("senha", texto); return avancar();
        }
        case "senha2": {
          if (!texto) return setErro("Repita a senha para confirmar.");
          if (texto !== dados.senha) return setErro("As duas senhas não são iguais.");
          gravar("senha2", texto); return avancar();
        }
        case "resumo": return criarConta();
        case "l-usuario": {
          const u = v.toLowerCase();
          if (!u) return setErro("Digite seu usuário ou e-mail.");
          if (!(u.includes("@") ? EMAIL_RE.test(u) : USUARIO_RE.test(u))) return setErro("Esse usuário não parece certo. Confira e tente de novo.");
          credRef.current = { usuario: u, senha: "" };
          return avancar();
        }
        case "l-senha": {
          if (!texto) return setErro("Digite sua senha.");
          credRef.current.senha = texto;
          return entrarAgora();
        }
        case "e-email": {
          const m = v.toLowerCase();
          if (!EMAIL_RE.test(m)) return setErro("Digite o e-mail da sua conta.");
          setIndo(true);
          try { await C.recuperarSenha(m); irPara("entrar", 0, -1); setAviso("Se esse e-mail tiver conta no Reino, enviamos um link para criar uma nova senha."); }
          catch (err) { setErro(err.message); }
          setIndo(false); return undefined;
        }
        case "n-senha": {
          if (texto.length < 8) return setErro("A nova senha precisa de pelo menos 8 caracteres.");
          gravar("senha", texto); return avancar();
        }
        case "n-senha2": {
          if (texto !== dados.senha) return setErro("As duas senhas não são iguais.");
          setIndo(true);
          try { await C.trocarSenha(dados.senha); entrarComConta(C.sessao(), "Senha nova salva. Bem-vindo de volta."); }
          catch (err) { setErro(err.message); setIndo(false); }
          return undefined;
        }
        case "validar": return entrarAgora();
        default: return undefined;
      }
    };

    async function entrarAgora() {
      const { usuario, senha } = credRef.current;
      if (!usuario || !senha) { irPara("entrar", 0, 1); return; }
      setIndo(true); setErro("");
      try {
        const r = await C.entrarUsuario(usuario, senha);
        if (r.conta) { setTexto(""); entrarComConta(r.conta, "Portão aberto. Bem-vindo ao Reino" + (r.conta.nome ? ", " + primeiroNome(r.conta.nome) : "") + "."); return; }
        if (r.confirmar) {
          const jaEstava = modo === "validar";
          setValidar((a) => ({ emailMascarado: r.emailMascarado, origem: a && jaEstava ? a.origem : "login", reenviado: a && a.reenviado }));
          if (jaEstava) setErro("A validação ainda não chegou. Abra o link do e-mail e tente de novo.");
          else irPara("validar", 0, 1);
        }
      } catch (err) {
        setErro(err.message || "Usuário ou senha não conferem.");
        setTexto("");
      }
      setIndo(false);
    }

    async function reenviar() {
      if (indo) return;
      const { usuario, senha } = credRef.current;
      if (!usuario || !senha) { irPara("entrar", 0, 1); return; }
      setIndo(true); setErro("");
      try {
        const r = await C.reenviarConfirmacao(usuario, senha);
        if (r.conta) { entrarComConta(r.conta); return; }
        setValidar((a) => ({ ...(a || {}), emailMascarado: r.emailMascarado || (a && a.emailMascarado), reenviado: true }));
        setAviso("Mandamos o link de novo para " + (r.emailMascarado || "o seu e-mail") + ".");
      } catch (err) { setErro(err.message); }
      setIndo(false);
    }

    async function criarConta() {
      const faltando = ["nome", "empresa", "cnpj", "cidade", "uf", "email", "usuario", "senha"].find((k) => !dados[k]) || (!foto ? "foto" : null);
      if (faltando) { setErro("Falta preencher: " + ({ nome: "nome", empresa: "empresa", cnpj: "CNPJ", cidade: "cidade e UF", uf: "cidade e UF", email: "e-mail", usuario: "usuário", senha: "senha", foto: "foto" }[faltando]) + "."); editandoRef.current = true; irPara("cadastro", passos.indexOf(faltando === "uf" ? "cidade" : faltando), -1); return; }
      if (dados.senha !== dados.senha2) { editandoRef.current = true; irPara("cadastro", passos.indexOf("senha2"), -1); setTimeout(() => setErro("Confirme a senha de novo."), 0); return; }
      setIndo(true); setErro("");
      if (codigo) { try { localStorage.setItem("reino.indicadoPor", codigo); sessionStorage.setItem("reino.ref", codigo); } catch (e) { /* sem armazenamento */ } }
      let titulo; try { titulo = localStorage.getItem("reino.tituloEscolhido") || undefined; } catch (e) { titulo = undefined; }
      try {
        // C6 (Parecer 1): a linha de `cadastros` é gravada pelo servidor, dentro da reino-cadastro,
        // depois que a conta existe — o navegador só manda o contexto da visita (contas.js).
        const r = await C.cadastrarCompleto({ ...dados, foto: foto.blob, indicadoPor: codigo || undefined, titulo });
        credRef.current = { usuario: dados.usuario, senha: dados.senha };
        if (r.conta) { entrarComConta(r.conta); return; }
        setValidar({ emailMascarado: r.emailMascarado, origem: "cadastro" });
        setIndo(false);
        irPara("validar", 0, 1);
      } catch (err) {
        setIndo(false);
        const alvo = err.campo && passos.indexOf(err.campo);
        if (alvo >= 0) { editandoRef.current = true; irPara("cadastro", alvo, -1); setTimeout(() => setErro(err.message), 0); }
        else setErro(err.message || "Não foi possível criar a conta agora. Tente de novo.");
      }
    }

    /* ---------- teclado: Esc volta; Enter nas etapas sem campo aciona o botão principal ---------- */
    React.useEffect(() => {
      const aoTeclar = (e) => {
        if (e.key === "Escape") { e.preventDefault(); voltar(); return; }
        if (e.key === "Enter" && !e.isComposing) {
          const alvo = e.target;
          const campo = alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA");
          const botao = alvo && (alvo.tagName === "BUTTON" || alvo.tagName === "A");
          if (!campo && !botao) { e.preventDefault(); enviar(); }
        }
      };
      window.addEventListener("keydown", aoTeclar);
      return () => window.removeEventListener("keydown", aoTeclar);
    });

    /* clique fora dos controles não tira o foco da barra */
    const segurarFoco = (e) => {
      const t = e.target;
      if (t.closest && t.closest("button, a, input, label, video, .hg-li-recorte-quadro, [role=slider]")) return;
      e.preventDefault();
      focarBarra();
    };

    const aoDigitar = (e) => {
      let v = e.target.value;
      if (passo === "cnpj") v = mascaraCnpj(v);
      if (passo === "usuario") v = limparUsuario(v);
      setTexto(v); setErro("");
    };

    /* ---------- desenho ---------- */
    const bolhas = pergunta();
    const ant = anterior();
    const progresso = modo === "cadastro" ? 1 : -1;
    const ROTULOS = ["Nome", "Empresa", "CNPJ", "Foto", "E-mail", "Usuário", "Senha", "Resumo"];
    const passoCadastroIdx = { nome: 0, empresa: 1, cnpj: 2, foto: 3, email: 4, usuario: 5, senha: 6, senha2: 6, resumo: 7 }[passo];
    const semCampo = passo === "foto" || passo === "resumo" || passo === "validar";
    const podeVoltar = !saindo && (etapa > 0 || modo === "entrar" || modo === "esqueci" || !!fonteFoto || !!camera);
    const vazio = semCampo ? (passo === "foto" && !foto && !fonteFoto && !camera) : !texto.trim();
    const rotuloEnviar = indo ? "Aguarde" : passo === "resumo" ? "Criar minha conta" : passo === "validar" ? "Já validei, entrar"
      : passo === "foto" ? (camera ? "Tirar foto" : fonteFoto ? "Usar esta foto" : "Continuar") : passo === "l-senha" ? "Entrar" : "Enviar";
    const dica = {
      cadastro: "Enter envia · Esc volta uma etapa · todos os dados são obrigatórios",
      entrar: passo === "l-usuario" ? "Enter envia · use seu usuário ou o e-mail da conta" : "Enter envia · o olho mostra o que você digitou",
      esqueci: "Enter envia · Esc volta",
      "nova-senha": "Enter envia · o olho mostra o que você digitou",
      validar: "Não chegou? Veja o spam ou toque em reenviar.",
    }[modo];

    const resumoLinhas = [
      ["nome", "Nome", dados.nome], ["empresa", "Empresa", dados.empresa], ["cnpj", "CNPJ", mascaraCnpj(dados.cnpj)],
      ["cidade", "Cidade", dados.cidade ? dados.cidade + (dados.uf ? " · " + dados.uf : "") : ""],
      ["email", "E-mail", dados.email], ["usuario", "Usuário", dados.usuario ? "@" + dados.usuario : ""], ["senha", "Senha", dados.senha ? "••••••••" : ""],
    ];

    return (
      <div className={"hg-li" + (saindo ? " is-saindo" : "") + (indo ? " is-indo" : "")} onPointerDown={segurarFoco}
        style={{ "--li-teclado": teclado + "px" }}>
        {fundo === "reino" && window.FundoReino
          ? <window.FundoReino onFalha={() => setFundo("reserva")} />
          : <FundoReserva />}
        <span className="hg-li-veu" aria-hidden="true" />

        <header className="hg-li-topo">
          <span className="hg-li-marca" aria-label="REINO · Babel OS">
            <span className="hg-li-coroa" aria-hidden="true">{Icon ? <Icon name="coroa" /> : null}</span>
            <b>REINO</b><i aria-hidden="true">·</i><em>Babel OS</em>
          </span>
          {modo === "nova-senha" ? null : (
            <button type="button" className="hg-li-pilula" onClick={trocarModo} disabled={indo || saindo}>
              {modo === "cadastro" || modo === "validar" ? "Já tenho conta" : "Criar conta"}
            </button>
          )}
        </header>

        <main className="hg-li-palco" aria-labelledby="li-titulo">
          <h1 id="li-titulo" className="hg-li-sr">{modo === "cadastro" ? "Criar conta no Reino" : modo === "validar" ? "Validar e-mail" : modo === "esqueci" ? "Recuperar acesso" : modo === "nova-senha" ? "Nova senha" : "Entrar no Reino"}</h1>

          {progresso >= 0 ? (
            <div className="hg-li-progresso" aria-label={passoCadastroIdx < 7 ? `Etapa ${passoCadastroIdx + 1} de 7: ${ROTULOS[passoCadastroIdx]}` : "Resumo do cadastro"}>
              <span className="hg-li-progresso-rotulo">{passoCadastroIdx < 7 ? `Etapa ${passoCadastroIdx + 1} de 7 · ${ROTULOS[passoCadastroIdx]}` : "Resumo"}</span>
              <span className="hg-li-progresso-trilho" aria-hidden="true">
                {ROTULOS.slice(0, 7).map((r, i) => <i key={r} className={i < passoCadastroIdx ? "is-feito" : i === passoCadastroIdx ? "is-atual" : ""} />)}
              </span>
            </div>
          ) : null}

          <div className="hg-li-janela">
            <div key={modo + ":" + etapa} className={"hg-li-slide " + (dir > 0 ? "vem-da-direita" : "vem-da-esquerda")} data-passo={passo}>
              {ant ? (
                <div className="hg-li-msg is-pessoa">
                  <div className="hg-li-bolha-out">{ant.foto ? <img className="hg-li-mini" src={ant.foto} alt="Sua foto" /> : ant.texto}</div>
                </div>
              ) : null}
              {aviso && !erro ? <div className="hg-li-msg is-reino" role="status"><div className="hg-li-bolha-in is-aviso"><small>Reino</small>{aviso}</div></div> : null}
              {bolhas.map((b, i) => (
                <div key={i} className="hg-li-msg is-reino" style={{ "--i": i }}>
                  <div className="hg-li-bolha-in">{i === 0 ? <small>Reino</small> : null}{b}</div>
                </div>
              ))}

              {passo === "foto" ? (
                <div className="hg-li-msg is-reino is-extra">
                  {camera ? (
                    <div className="hg-li-camera" style={{ width: ladoRecorte, height: ladoRecorte }}>
                      <video ref={videoRef} muted playsInline autoPlay aria-label="Câmera ao vivo" />
                    </div>
                  ) : fonteFoto ? (
                    <Recorte fonte={fonteFoto} lado={ladoRecorte} onPronto={(api) => { recorteRef.current = api; }} />
                  ) : foto ? (
                    <div className="hg-li-foto-escolhida"><img src={foto.url} alt="Sua foto de perfil" /><span>Foto pronta. Envie para continuar ou troque.</span></div>
                  ) : null}
                </div>
              ) : null}

              {passo === "usuario" && disp.estado && limparUsuario(texto) ? (
                <p className={"hg-li-disp is-" + disp.estado} role="status" aria-live="polite">
                  {disp.estado === "checando" ? "Conferindo…" : disp.estado === "livre" ? `@${disp.usuario} está disponível` : disp.estado === "ocupado" ? `@${disp.usuario} está indisponível` : "Formato inválido: 3 a 24, minúsculas, números, ponto ou sublinhado"}
                </p>
              ) : null}

              {passo === "resumo" ? (
                <div className="hg-li-msg is-reino is-extra">
                  <div className="hg-li-bolha-in hg-li-resumo">
                    <div className="hg-li-resumo-topo">
                      {foto ? <img src={foto.url} alt="Sua foto" /> : null}
                      <button type="button" className="hg-li-link" onClick={() => { editandoRef.current = true; irPara("cadastro", passos.indexOf("foto"), -1); }}>trocar foto</button>
                      <div className="hg-li-afiliado">
                        {mostraAfiliado ? (
                          <label><span>Código ou link de afiliado (opcional)</span>
                            <input value={dados.afiliado} onChange={(e) => gravar("afiliado", e.target.value)} placeholder={(window.REINO_DOMINIO || location.origin) + "/r/…"} autoComplete="off" />
                          </label>
                        ) : (
                          <button type="button" className="hg-li-link" onClick={() => setMostraAfiliado(true)}>
                            {codigo ? "Indicado por " + codigo + " · alterar" : "Tenho um código de afiliado"}
                          </button>
                        )}
                      </div>
                    </div>
                    <dl>
                      {resumoLinhas.map(([k, r, val]) => (
                        <div key={k}><dt>{r}</dt><dd>{val}</dd>
                          <button type="button" className="hg-li-link" aria-label={"Editar " + r} onClick={() => { editandoRef.current = true; irPara("cadastro", passos.indexOf(k), -1); }}>editar</button>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              ) : null}

              {passo === "validar" ? (
                <div className="hg-li-msg is-reino is-extra">
                  <ul className="hg-li-correios" aria-label="Abrir meu e-mail">
                    {CORREIOS.map((c) => (
                      <li key={c.nome}>
                        <a href={c.url} target="_blank" rel="noopener noreferrer">
                          <span className="hg-li-correio-letra" aria-hidden="true">{c.letra}</span>
                          <span className="hg-li-correio-nome">Abrir o {c.nome}</span>
                          <span className="hg-li-correio-seta"><IcSeta /></span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {erro ? <div className="hg-li-msg is-reino" role="alert"><div className="hg-li-bolha-in is-erro">{erro}</div></div> : null}
            </div>
          </div>

          <form className="hg-li-barra" onSubmit={enviar} noValidate aria-busy={indo}>
            <div className="hg-li-barra-dentro">
              {podeVoltar ? (
                <button type="button" className="hg-li-acao" onClick={voltar} aria-label="Voltar uma etapa" title="Voltar uma etapa" disabled={indo}><IcVoltar /></button>
              ) : null}

              {!semCampo ? (
                <input ref={inputRef} className="hg-li-campo" aria-label={CAMPO ? CAMPO.rotulo : "Resposta"}
                  type={ehSenha && !ver ? "password" : CAMPO && CAMPO.tipo ? CAMPO.tipo : "text"}
                  inputMode={CAMPO && CAMPO.modo ? CAMPO.modo : undefined}
                  autoComplete={CAMPO ? CAMPO.auto : "off"} autoCapitalize={passo === "nome" || passo === "empresa" ? "words" : "none"}
                  spellCheck={false} value={texto} onChange={aoDigitar} placeholder={CAMPO ? CAMPO.ph : ""}
                  maxLength={passo === "cnpj" ? 18 : passo === "usuario" ? 24 : 254} disabled={saindo}
                  data-passo={passo} />
              ) : passo === "foto" ? (
                <div className="hg-li-barra-botoes">
                  <button type="button" className="hg-li-opcao" onClick={usarCamera} disabled={indo}><IcCamera /><span>Câmera</span></button>
                  <button type="button" className="hg-li-opcao" onClick={() => { pararCamera(); galeriaRef.current && galeriaRef.current.click(); }} disabled={indo}><IcGaleria /><span>Galeria</span></button>
                  <input ref={galeriaRef} type="file" accept="image/*" hidden onChange={aoEscolherArquivo} data-foto="galeria" />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="user" hidden onChange={aoEscolherArquivo} data-foto="camera" />
                </div>
              ) : passo === "validar" ? (
                <div className="hg-li-barra-botoes">
                  <button type="button" className="hg-li-opcao" onClick={reenviar} disabled={indo}><IcReenviar /><span>{validar && validar.reenviado ? "Reenviar de novo" : "Reenviar e-mail"}</span></button>
                  <span className="hg-li-barra-texto">Já validei · entrar</span>
                </div>
              ) : (
                <span className="hg-li-barra-texto">{indo ? "Criando sua conta…" : "Tudo certo? Criar minha conta"}</span>
              )}

              {ehSenha && !semCampo ? (
                <button type="button" className={"hg-li-acao" + (ver ? " is-on" : "")} onClick={() => { setVer((x) => !x); focarBarra(); }}
                  aria-pressed={ver} aria-label={ver ? "Esconder a senha" : "Mostrar a senha"} title={ver ? "Esconder a senha" : "Mostrar a senha"}>
                  {ver ? <IcOlhoFechado /> : <IcOlho />}
                </button>
              ) : null}

              <button type="submit" className={"hg-li-enviar" + (vazio ? " is-vazio" : "")} disabled={indo || saindo} aria-label={rotuloEnviar} title={rotuloEnviar}
                ref={semCampo ? acaoRef : undefined}>
                {indo ? <IcGiro /> : <IcEnviar />}
              </button>
            </div>
          </form>

          <p className="hg-li-dica" aria-live="polite">
            {indo ? (passo === "resumo" ? "Criando sua conta no Reino…" : "Conectando ao Reino…") : dica}
            {modo === "entrar" && !indo ? <> · <button type="button" className="hg-li-link" onClick={() => irPara("esqueci", 0, 1)}>Esqueci a senha</button></> : null}
          </p>
        </main>
      </div>
    );
  }

  Object.assign(window, { LoginImersivo });
})();
