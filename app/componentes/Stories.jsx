const { Avatar, Icon, Button } = window.BabelOSDesignSystem_5ad360;

/* Stories do Reino — faixa de círculos, visualizador em tela cheia e criador.
   Sem fotos no produto: cada story é um fundo (gradiente/filtro) com texto e
   empresa marcada. Curtir, responder, repostar (com a empresa já marcada) e apagar. */
const FUNDOS = [
  { id: "aurora", nome: "Aurora", css: "linear-gradient(160deg,#0b2a6b,#3fe3ff)" },
  { id: "neon", nome: "Neon", css: "linear-gradient(160deg,#3b82ff,#e04bff)" },
  { id: "ouro", nome: "Ouro", css: "linear-gradient(160deg,#5a3a00,#f5c76a)" },
  { id: "floresta", nome: "Floresta", css: "linear-gradient(160deg,#03301f,#34e6a6)" },
  { id: "noite", nome: "Noite", css: "radial-gradient(ellipse at 30% 20%,#1b2f6b,#030817 70%)" },
  { id: "brasa", nome: "Brasa", css: "linear-gradient(160deg,#4a0a2a,#ff4d7a)" },
];
const FILTROS = [
  { id: "nenhum", nome: "Original", css: "none" },
  { id: "vivido", nome: "Vívido", css: "saturate(1.6) contrast(1.1)" },
  { id: "frio", nome: "Frio", css: "hue-rotate(25deg) saturate(1.2)" },
  { id: "quente", nome: "Quente", css: "sepia(.35) saturate(1.4)" },
  { id: "pb", nome: "P&B", css: "grayscale(1) contrast(1.15)" },
  { id: "sonho", nome: "Sonho", css: "blur(.6px) brightness(1.1) saturate(1.3)" },
  { id: "retro", nome: "Retrô", css: "sepia(.6) contrast(.9) brightness(.95)" },
];
const hora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const STORIES_INICIAIS = [
  { autor: "Ana Ribeiro", itens: [
    { id: "s1", fundo: "aurora", filtro: "nenhum", texto: "Diagnóstico grátis esta semana. Chama no privado!", tx: 50, ty: 42, empresa: "Pulso Marketing Digital", quando: "2 h", curtidas: 31, visto: false },
    { id: "s2", fundo: "noite", filtro: "vivido", texto: "Guilda Paulista bateu 3.840 pontos 🏆", tx: 50, ty: 60, empresa: "Guilda Paulista", quando: "1 h", curtidas: 54, visto: false } ] },
  { autor: "Camila Duarte", itens: [
    { id: "s3", fundo: "neon", filtro: "frio", texto: "Procuro contabilidade parceira em Curitiba", tx: 50, ty: 50, empresa: "Pinheiro Tech Solutions", quando: "4 h", curtidas: 12, visto: false } ] },
  { autor: "Eduarda Lopes", itens: [
    { id: "s4", fundo: "floresta", filtro: "nenhum", texto: "Unidade Boa Vista inaugurada!", tx: 50, ty: 38, empresa: "Capibaribe Clínica", quando: "6 h", curtidas: 47, visto: true } ] },
  { autor: "Henrique Alves", itens: [
    { id: "s5", fundo: "ouro", filtro: "quente", texto: "3 vagas na Guilda Planalto", tx: 50, ty: 55, empresa: "Planalto Consultoria", quando: "9 h", curtidas: 9, visto: true } ] },
];

/* ---------- Faixa de círculos ---------- */
function StoriesBar({ stories, eu, onAbrir, onCriar }) {
  const meus = stories.find((s) => s.autor === eu);
  return (
    <div className="hg-stories" role="list" aria-label="Stories">
      <button type="button" className={"hg-story-circ is-eu" + (meus && meus.itens.length ? " is-novo" : "")} role="listitem" onClick={() => (meus && meus.itens.length ? onAbrir(eu) : onCriar())}>
        <span className="hg-story-anel"><Avatar name={eu} /><i className="hg-story-mais" onClick={(e) => { e.stopPropagation(); onCriar(); }} aria-hidden="true"><Icon name="mais" /></i></span>
        <span>{meus && meus.itens.length ? "Seu story" : "Criar"}</span>
      </button>
      {stories.filter((s) => s.autor !== eu && s.itens.length).map((s) => (
        <button key={s.autor} type="button" className={"hg-story-circ" + (s.itens.every((i) => i.visto) ? " is-visto" : " is-novo")} role="listitem" onClick={() => onAbrir(s.autor)}>
          <span className="hg-story-anel"><Avatar name={s.autor} /></span>
          <span>{s.autor.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Visualizador ---------- */
function StoryViewer({ stories, autor, eu, onFechar, onCurtir, onResponder, onRepostar, onApagar, onVisto, onTrocarAutor }) {
  const grupo = stories.find((s) => s.autor === autor);
  const [i, setI] = React.useState(() => { const g = stories.find((s) => s.autor === autor); const k = g && window.__storyInicial ? g.itens.findIndex((it) => it.id === window.__storyInicial) : -1; window.__storyInicial = null; return k > 0 ? k : 0; });
  const [pausado, setPausado] = React.useState(false);
  const [resposta, setResposta] = React.useState("");
  const [enviado, setEnviado] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const DUR = 5000;
  const item = grupo && grupo.itens[i];
  const autores = stories.filter((s) => s.itens.length).map((s) => s.autor);
  const ai = autores.indexOf(autor);
  const proximo = React.useCallback(() => {
    if (!grupo) return onFechar();
    if (i + 1 < grupo.itens.length) setI(i + 1);
    else if (ai + 1 < autores.length) { onTrocarAutor(autores[ai + 1]); setI(0); }
    else onFechar();
  }, [i, grupo, ai, autores, onFechar, onTrocarAutor]);
  const anterior = () => { if (i > 0) setI(i - 1); else if (ai > 0) { onTrocarAutor(autores[ai - 1]); setI(0); } };
  React.useEffect(() => { if (item) onVisto(item.id); }, [item && item.id]);
  React.useEffect(() => {
    if (pausado || menu || resposta) return;
    const t = setTimeout(proximo, DUR);
    return () => clearTimeout(t);
  }, [i, autor, pausado, menu, resposta, proximo]);
  React.useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onFechar(); if (e.key === "ArrowRight") proximo(); if (e.key === "ArrowLeft") anterior(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });
  if (!grupo || !item) return null;
  const fundo = FUNDOS.find((f) => f.id === item.fundo) || FUNDOS[0];
  const filtro = FILTROS.find((f) => f.id === item.filtro) || FILTROS[0];
  const meu = autor === eu;
  const responder = (e) => { e.preventDefault(); if (!resposta.trim()) return; onResponder(item, resposta.trim()); setResposta(""); setEnviado(true); setTimeout(() => setEnviado(false), 1600); };
  return (
    <div className="hg-story-view" role="dialog" aria-label={"Story de " + autor} onPointerDown={() => setPausado(true)} onPointerUp={() => setPausado(false)} onPointerCancel={() => setPausado(false)}>
      <div className="hg-story-caixa">
      <div className="hg-story-tela" style={{ background: fundo.css, filter: filtro.css }} key={item.id}>
        {item.midia ? (item.midia.tipo === "video" ? <video className="hg-story-midia" src={item.midia.src} autoPlay loop muted playsInline style={{ objectFit: item.midia.ajuste || "contain" }} /> : <img className="hg-story-midia" src={item.midia.src} alt="" style={{ objectFit: item.midia.ajuste || "contain" }} />) : null}
        <div className="hg-story-brilho" aria-hidden="true" />
      </div>
      <p className="hg-story-texto" style={{ left: item.tx + "%", top: item.ty + "%", fontSize: item.tamanho || "1.6rem" }}>{item.texto}</p>
      {item.empresa ? <button type="button" className="hg-story-tag" onClick={(e) => e.stopPropagation()}><Icon name="camadas" />{item.empresa}</button> : null}
      {item.repost ? <span className="hg-story-repost"><Icon name="rota" />{"repost de " + item.repost}</span> : null}
      <div className="hg-story-barras" aria-hidden="true">
        {grupo.itens.map((it, k) => <span key={it.id} className={k < i ? "is-feito" : k === i ? "is-atual" : ""} style={k === i ? { animationDuration: DUR + "ms", animationPlayState: pausado || menu || resposta ? "paused" : "running" } : undefined}><i /></span>)}
      </div>
      <header className="hg-story-cab">
        <Avatar name={autor} size={34} />
        <div><strong>{autor}</strong><span>{item.quando}{item.empresa ? " · " + item.empresa : ""}</span></div>
        {meu ? <button type="button" className="hg-story-ico" onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }} aria-label="Opções" aria-expanded={menu}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg></button> : null}
        <button type="button" className="hg-story-ico" onClick={onFechar} aria-label="Fechar"><Icon name="x" /></button>
      </header>
      {menu ? (
        <div className="hg-story-menu" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { onApagar(item.id); setMenu(false); if (grupo.itens.length <= 1) onFechar(); else setI(Math.max(0, i - 1)); }}><Icon name="x" />Apagar story</button>
          <span className="hg-sub">{item.curtidas} curtidas</span>
        </div>
      ) : null}
      <button type="button" className="hg-story-zona is-esq" onClick={anterior} aria-label="Anterior" />
      <button type="button" className="hg-story-zona is-dir" onClick={proximo} aria-label="Próximo" />
      {!meu ? (
        <form className="hg-story-rodape" onSubmit={responder} onPointerDown={(e) => e.stopPropagation()}>
          <input value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder={"Responder a " + autor.split(" ")[0] + "…"} aria-label="Responder" />
          <button type="button" className={"hg-story-ico" + (item.curtido ? " is-on" : "")} onClick={() => onCurtir(item.id)} aria-label="Curtir" aria-pressed={!!item.curtido}>
            <svg viewBox="0 0 24 24" fill={item.curtido ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 20.8 8.6 19.5 11.7 17.5 16.4 12 21 12 21z" /></svg>
          </button>
          <button type="button" className="hg-story-ico" onClick={() => onRepostar(item, autor)} aria-label="Repostar com a empresa marcada"><Icon name="rota" /></button>
          {resposta.trim() ? <button type="submit" className="hg-story-ico is-enviar" aria-label="Enviar"><Icon name="rota" /></button> : null}
          {enviado ? <span className="hg-story-toast">Resposta enviada</span> : null}
        </form>
      ) : (
        <div className="hg-story-rodape is-meu"><span><Icon name="tecnicos" />{`${Math.max(3, item.curtidas + 6)} visualizações · ${item.curtidas} curtidas`}</span></div>
      )}
      </div>
    </div>
  );
}

/* ---------- Criador ---------- */
function StoryComposer({ eu, empresas, inicial, onPublicar, onFechar }) {
  const [fundo, setFundo] = React.useState(inicial?.fundo || "aurora");
  const [filtro, setFiltro] = React.useState(inicial?.filtro || "nenhum");
  const [texto, setTexto] = React.useState(inicial?.texto || "");
  const [pos, setPos] = React.useState({ x: inicial?.tx ?? 50, y: inicial?.ty ?? 50 });
  const [tamanho, setTamanho] = React.useState(inicial?.tamanho || "1.6rem");
  const [empresa, setEmpresa] = React.useState(inicial?.empresa || "");
  const [aba, setAba] = React.useState("fundo");
  const [lateralAberta, setLateralAberta] = React.useState(false);
  const [editando, setEditando] = React.useState(false);
  const tela = React.useRef(null);
  const arr = React.useRef(null);
  const [buscaEmp, setBuscaEmp] = React.useState("");
  const [midia, setMidia] = React.useState(inicial?.midia || null); // { tipo: "foto"|"video", src }
  const [gravando, setGravando] = React.useState(false);
  const [camAberta, setCamAberta] = React.useState(false);
  const [erroCam, setErroCam] = React.useState("");
  const [seg, setSeg] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const zoomRef = React.useRef(1), zoomIni = React.useRef({ y: 0, z: 1 });
  const aplicarZoom = (z) => {
    z = Math.max(1, Math.min(5, z)); zoomRef.current = z; setZoom(z);
    // zoom óptico quando a câmera suporta; senão, visual (scale) — o vídeo gravado leva o zoom óptico, a foto leva os dois
    const tr = stream.current && stream.current.getVideoTracks()[0];
    const cap = tr && tr.getCapabilities ? tr.getCapabilities() : null;
    if (cap && cap.zoom) { const v = Math.min(cap.zoom.max, Math.max(cap.zoom.min, cap.zoom.min + (z - 1) * (cap.zoom.max - cap.zoom.min) / 4)); tr.applyConstraints({ advanced: [{ zoom: v }] }).catch(() => {}); }
  };
  const video = React.useRef(null), stream = React.useRef(null), rec = React.useRef(null), pedacos = React.useRef([]), cron = React.useRef(null);
  const inputGaleria = React.useRef(null), inputCamFoto = React.useRef(null), inputCamVideo = React.useRef(null);
  const lerArquivo = (file) => {
    if (!file) return;
    fecharCam();
    const tipo = file.type.startsWith("video") ? "video" : "foto";
    const url = URL.createObjectURL(file);
    // fotos passam pelo compressor (até 1280px, WebP) antes de entrar no story — de MB para KB
    if (tipo === "foto") {
      if (window.ReinoFotos && window.ReinoFotos.comprimir) window.ReinoFotos.comprimir(file).then((r) => setMidia({ tipo, src: r.url })).catch(() => { const rd = new FileReader(); rd.onload = () => setMidia({ tipo, src: rd.result }); rd.readAsDataURL(file); });
      else { const rd = new FileReader(); rd.onload = () => setMidia({ tipo, src: rd.result }); rd.readAsDataURL(file); }
    }
    else setMidia({ tipo, src: url, temporario: true });
    setAba("filtro");
  };
  const podeCam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const celularRef = React.useRef(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  const [lado, setLado] = React.useState(celularRef.current ? "environment" : "user");
  const ladoRef = React.useRef(lado);
  const virarCam = async () => { const novo = ladoRef.current === "user" ? "environment" : "user"; ladoRef.current = novo; setLado(novo); if (stream.current) { stream.current.getTracks().forEach((tr) => tr.stop()); stream.current = null; } await abrirCam(); };
  const fecharCam = () => { if (stream.current) { stream.current.getTracks().forEach((tr) => tr.stop()); stream.current = null; } setCamAberta(false); setGravando(false); clearInterval(cron.current); setSeg(0); };
  const abrirCam = async () => {
    setErroCam("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: ladoRef.current, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } }, audio: true });
      stream.current = s; setCamAberta(true); setAba("midia"); zoomRef.current = 1; setZoom(1);
      const tr = s.getVideoTracks()[0]; const cap = tr && tr.getCapabilities ? tr.getCapabilities() : null;
      if (cap && cap.zoom) tr.applyConstraints({ advanced: [{ zoom: cap.zoom.min }] }).catch(() => {});
      setTimeout(() => { if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } }, 50);
    } catch (e) { setErroCam("Não foi possível abrir a câmera. Use a galeria ou a câmera do celular."); }
  };
  const tirarFoto = () => {
    const v = video.current; if (!v) return;
    const c = document.createElement("canvas"); c.width = v.videoWidth || 720; c.height = v.videoHeight || 1280;
    const g = c.getContext("2d"); if (ladoRef.current === "user") { g.translate(c.width, 0); g.scale(-1, 1); }
    const z = zoomRef.current; const sw = c.width / z, sh = c.height / z; g.drawImage(v, (c.width - sw) / 2, (c.height - sh) / 2, sw, sh, 0, 0, c.width, c.height);
    setMidia({ tipo: "foto", src: c.toDataURL("image/jpeg", .86), ajuste: "cover" }); fecharCam(); setAba("filtro");
  };
  const gravar = () => {
    if (!stream.current) return;
    if (gravando) { rec.current && rec.current.stop(); return; }
    pedacos.current = [];
    const tipoOk = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
    const r = new MediaRecorder(stream.current, tipoOk ? { mimeType: tipoOk } : undefined);
    r.ondataavailable = (e) => { if (e.data.size) pedacos.current.push(e.data); };
    r.onstop = () => { const b = new Blob(pedacos.current, { type: r.mimeType || "video/webm" }); setMidia({ tipo: "video", src: URL.createObjectURL(b), temporario: true, ajuste: "cover" }); fecharCam(); setAba("filtro"); };
    rec.current = r; r.start(); setGravando(true); setSeg(0);
    cron.current = setInterval(() => setSeg((s) => { if (s + 1 >= 30) { r.state === "recording" && r.stop(); } return s + 1; }), 1000);
  };
  React.useEffect(() => { if (!inicial && podeCam) abrirCam(); return () => fecharCam(); }, []);
  // toque = foto · segurar = grava enquanto segura · soltar = para e mostra a prévia
  const segurar = React.useRef(null);
  const obtDown = (e) => { e.preventDefault(); if (rec.current && rec.current.state === "recording") return; zoomIni.current = { y: e.clientY, z: zoomRef.current }; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); segurar.current = setTimeout(() => { segurar.current = null; gravar(); }, 350); };
  const obtMove = (e) => { if (!(rec.current && rec.current.state === "recording")) return; const dy = zoomIni.current.y - e.clientY; aplicarZoom(zoomIni.current.z + dy / 80); };
  const obtUp = () => { if (segurar.current) { clearTimeout(segurar.current); segurar.current = null; tirarFoto(); } else if (rec.current && rec.current.state === "recording") rec.current.stop(); };
  const celular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
  const iniciarArrasto = (e) => { e.preventDefault(); e.stopPropagation(); arr.current = true; tela.current.setPointerCapture(e.pointerId); mover(e); };
  const mover = (e) => { if (!arr.current) return; const r = tela.current.getBoundingClientRect(); setPos({ x: Math.max(8, Math.min(92, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(8, Math.min(90, ((e.clientY - r.top) / r.height) * 100)) }); };
  const soltar = () => { arr.current = false; };
  const f = FUNDOS.find((x) => x.id === fundo), fl = FILTROS.find((x) => x.id === filtro);
  const publicar = () => { if (!texto.trim() && !empresa && !midia) return; fecharCam(); onPublicar({ id: "s" + Date.now(), fundo, filtro, texto: texto.trim(), tx: pos.x, ty: pos.y, tamanho, empresa, midia, quando: "agora", curtidas: 0, visto: true, repost: inicial?.repost }); };
  const empresasFiltradas = empresas.filter((n) => !buscaEmp || n.toLowerCase().includes(buscaEmp.toLowerCase())).slice(0, 6);
  return (
    <div className="hg-story-view is-criar" role="dialog" aria-label="Novo story">
      <div className="hg-story-caixa">
      <div className="hg-story-tela" ref={tela} style={{ background: f.css, filter: fl.css }} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
           onClick={() => { if (!camAberta) { setAba(null); setLateralAberta(false); setEditando(false); } }}>
        {midia && !camAberta ? (midia.tipo === "video" ? <video className="hg-story-midia" src={midia.src} autoPlay loop playsInline controls={false} style={{ objectFit: midia.ajuste || "contain" }} /> : <img className="hg-story-midia" src={midia.src} alt="" style={{ objectFit: midia.ajuste || "contain" }} />) : null}
        {camAberta ? <video className="hg-story-midia is-cam" ref={video} autoPlay muted playsInline style={{ objectFit: "cover", background: "#000", transform: (lado === "user" ? "scaleX(-1) " : "") + "scale(" + zoom + ")", transition: "transform .08s linear" }} /> : null}
        <div className="hg-story-brilho" aria-hidden="true" />
      </div>
      {camAberta ? (
        <div className="hg-story-cam" onPointerDown={(e) => e.stopPropagation()}>
          {gravando ? <span className="hg-story-rec"><i />{String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}{zoom > 1.05 ? <em>{zoom.toFixed(1)}×</em> : null}</span> : null}
          <div className="hg-story-cam-btns">
            <button type="button" className="hg-story-ico" onClick={() => { fecharCam(); setAba("midia"); }} aria-label="Fechar câmera"><Icon name="x" /></button>
            <button type="button" className={"hg-story-obturador" + (gravando ? " is-gravando" : "")} onPointerDown={obtDown} onPointerMove={obtMove} onPointerUp={obtUp} onPointerCancel={obtUp} onContextMenu={(e) => e.preventDefault()} aria-label={gravando ? "Gravando — solte para parar" : "Toque para foto, segure para vídeo"}><i /><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="33" /></svg></button>
            <button type="button" className="hg-story-ico" onClick={() => inputGaleria.current.click()} aria-label="Galeria"><Icon name="vitrine" /></button>
          </div>
          <button type="button" className="hg-story-ico hg-story-virar" onClick={virarCam} aria-label={lado === "user" ? "Usar câmera traseira" : "Usar câmera frontal"} title="Virar câmera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14.9 4M4 12a8 8 0 0 1 14.9-4" /><path d="M20 4v4h-4M4 20v-4h4" /></svg>
          </button>
          <p className="hg-sub">{gravando ? "Arraste para cima para aproximar · solte para parar" : "Toque para foto · segure para gravar vídeo"}</p>
        </div>
      ) : null}
      <input ref={inputGaleria} type="file" accept="image/*,video/*" hidden onChange={(e) => lerArquivo(e.target.files[0])} />
      <input ref={inputCamFoto} type="file" accept="image/*" capture="environment" hidden onChange={(e) => lerArquivo(e.target.files[0])} />
      <input ref={inputCamVideo} type="file" accept="video/*" capture="environment" hidden onChange={(e) => lerArquivo(e.target.files[0])} />
      {editando ? (
        <textarea className="hg-story-texto is-edit" style={{ left: pos.x + "%", top: pos.y + "%", fontSize: tamanho }} onClick={(e) => e.stopPropagation()} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Toque para escrever" autoFocus rows={2} onBlur={() => setEditando(false)} />
      ) : (
        (texto || (!midia && !camAberta)) ? <p className="hg-story-texto is-mov" style={{ left: pos.x + "%", top: pos.y + "%", fontSize: tamanho }} onPointerDown={iniciarArrasto} onDoubleClick={() => setEditando(true)}>{texto || "Toque para escrever"}</p> : null
      )}
      {empresa ? <button type="button" className="hg-story-tag" onClick={() => setEmpresa("")} title="Remover marcação"><Icon name="camadas" />{empresa}<Icon name="x" /></button> : null}
      {inicial?.repost ? <span className="hg-story-repost"><Icon name="rota" />{"repost de " + inicial.repost}</span> : null}
      <header className="hg-story-cab">
        <button type="button" className="hg-story-ico" onClick={onFechar} aria-label="Cancelar"><Icon name="x" /></button>
      </header>
      {!camAberta ? (
        <aside className={"hg-story-lateral" + (lateralAberta ? " is-aberta" : "")} onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="hg-story-lateral-seta" onClick={() => setLateralAberta((v) => !v)} aria-label={lateralAberta ? "Recolher ferramentas" : "Mostrar ferramentas"} aria-expanded={lateralAberta}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          </button>
          {[
            ["midia", "vitrine", midia ? "Trocar mídia" : "Foto ou vídeo"],
            ["filtro", "filtro", "Filtros"],
            ["fundo", "camadas", "Fundo"],
            ["texto", null, "Texto"],
            ["empresa", "link", "Marcar empresa"],
          ].map(([id, ico, nome]) => (
            <button key={id} type="button" aria-pressed={aba === id} onClick={() => { setAba(aba === id ? null : id); if (id === "texto") setEditando(true); }} title={nome}>
              {ico ? <Icon name={ico} /> : <b>Aa</b>}<span>{nome}</span>
            </button>
          ))}
          {midia ? <button type="button" onClick={() => setMidia({ ...midia, ajuste: midia.ajuste === "cover" ? "contain" : "cover" })} title="Ajuste"><Icon name="mapa" /><span>{midia.ajuste === "cover" ? "Ver inteira" : "Preencher"}</span></button> : null}
        </aside>
      ) : null}

      <div className="hg-story-painel" onPointerDown={(e) => e.stopPropagation()}>
        {!camAberta ? <button type="button" className="hg-story-publicar" onClick={publicar} disabled={!texto.trim() && !empresa && !midia}><span>Publicar</span><Icon name="rota" /></button> : null}
        {aba === "midia" && !camAberta ? (
          <div className="hg-story-midia-opts">
            <button type="button" onClick={() => inputGaleria.current.click()}><Icon name="vitrine" /><span>Galeria</span><small>foto ou vídeo</small></button>
            {celular ? (
              <>
                <button type="button" onClick={() => inputCamFoto.current.click()}><Icon name="tecnicos" /><span>Câmera</span><small>tirar foto</small></button>
                <button type="button" onClick={() => inputCamVideo.current.click()}><Icon name="grafico" /><span>Gravar</span><small>vídeo</small></button>
              </>
            ) : podeCam ? (
              <button type="button" onClick={abrirCam}><Icon name="tecnicos" /><span>Câmera</span><small>foto ou vídeo</small></button>
            ) : null}
            {midia && podeCam ? <button type="button" onClick={() => { setMidia(null); abrirCam(); }}><Icon name="rota" /><span>Refazer</span><small>{midia.tipo}</small></button> : null}
            {midia ? <button type="button" className="is-remover" onClick={() => setMidia(null)}><Icon name="x" /><span>Remover</span><small>{midia.tipo}</small></button> : null}
            {erroCam ? <p className="hg-sub" style={{ gridColumn: "1 / -1", color: "var(--amber)" }}>{erroCam}</p> : null}
          </div>
        ) : null}
        {aba === "fundo" ? <div className="hg-story-opts">{FUNDOS.map((x) => <button key={x.id} type="button" aria-pressed={fundo === x.id} onClick={() => setFundo(x.id)} style={{ background: x.css }} title={x.nome}><span>{x.nome}</span></button>)}</div> : null}
        {aba === "filtro" ? <div className="hg-story-opts">{FILTROS.map((x) => <button key={x.id} type="button" aria-pressed={filtro === x.id} onClick={() => setFiltro(x.id)} style={{ background: midia && midia.tipo === "foto" ? "url(" + midia.src + ") center/cover" : f.css, filter: x.css }} title={x.nome}><span>{x.nome}</span></button>)}</div> : null}
        {aba === "texto" ? (
          <div className="hg-story-opts is-texto">
            {["1.1rem", "1.6rem", "2.2rem"].map((t) => <button key={t} type="button" aria-pressed={tamanho === t} onClick={() => setTamanho(t)} style={{ fontSize: t === "1.1rem" ? ".8rem" : t === "1.6rem" ? "1rem" : "1.25rem" }}>Aa</button>)}
            <span className="hg-sub">Arraste o texto na tela para posicionar · toque duas vezes para editar</span>
          </div>
        ) : null}
        {aba === "empresa" ? (
          <div className="hg-story-emp">
            <input value={buscaEmp} onChange={(e) => setBuscaEmp(e.target.value)} placeholder="Buscar empresa para marcar" aria-label="Empresa" />
            <div>{empresasFiltradas.map((n) => <button key={n} type="button" aria-pressed={empresa === n} onClick={() => setEmpresa(n)}><Avatar name={n} size={22} />{n}</button>)}</div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

/* ---------- Estado dos stories (hook) ---------- */
const VALIDADE_MS = 24 * 60 * 60 * 1000;
const expirado = (it) => it.criado_em && Date.now() - it.criado_em > VALIDADE_MS;
/* tira quem passou de 24h e some os grupos que ficaram vazios — sem isso o armazenamento só cresce */
const podarVelhos = (grupos) => grupos.map((g) => ({ ...g, itens: g.itens.filter((it) => !expirado(it)) })).filter((g) => g.itens.length);

function useStories(eu) {
  const [stories, setStories] = React.useState(() => {
    try { const s = JSON.parse(sessionStorage.getItem("reino.stories") || "null"); if (s) return podarVelhos(s); } catch (e) {}
    return STORIES_INICIAIS.map((g) => ({ ...g, itens: g.itens.map((it) => ({ ...it, criado_em: it.criado_em || Date.now() })) }));
  });
  React.useEffect(() => { try {
    const leve = stories.map((g) => ({ ...g, itens: g.itens.filter((it) => !(it.midia && it.midia.temporario)) }));
    sessionStorage.setItem("reino.stories", JSON.stringify(leve));
  } catch (e) { /* fotos grandes podem estourar a cota da sessão: segue sem persistir */ } }, [stories]);
  /* apaga de verdade, sozinho, 24h depois de publicado — checa a cada minuto */
  React.useEffect(() => {
    const t = setInterval(() => setStories((s) => { const p = podarVelhos(s); return p.length === s.length && p.every((g, i) => g.itens.length === s[i].itens.length) ? s : p; }), 60000);
    return () => clearInterval(t);
  }, []);
  const [aberto, setAberto] = React.useState(null);
  const [criando, setCriando] = React.useState(null); // null | {} | {inicial}
  const mapItem = (id, fn) => setStories((s) => s.map((g) => ({ ...g, itens: g.itens.map((it) => (it.id === id ? fn(it) : it)) })));
  const api = {
    stories, aberto, criando,
    abrir: setAberto, fechar: () => setAberto(null),
    criar: () => setCriando({}), cancelar: () => setCriando(null),
    visto: (id) => mapItem(id, (it) => (it.visto ? it : { ...it, visto: true })),
    curtir: (id) => mapItem(id, (it) => ({ ...it, curtido: !it.curtido, curtidas: it.curtidas + (it.curtido ? -1 : 1) })),
    responder: (item, texto) => { window.__respostasStories = [...(window.__respostasStories || []), { para: item.id, texto }]; },
    repostar: (item, autor) => { setAberto(null); setCriando({ inicial: { ...item, texto: item.texto, empresa: item.empresa || autor, repost: autor } }); },
    apagar: (id) => setStories((s) => s.map((g) => ({ ...g, itens: g.itens.filter((it) => it.id !== id) }))),
    publicar: (item) => { item.criado_em = Date.now(); window.__storyInicial = item.id; setStories((s) => { const tem = s.some((g) => g.autor === eu); const n = tem ? s.map((g) => (g.autor === eu ? { ...g, itens: [...g.itens, item] } : g)) : [{ autor: eu, itens: [item] }, ...s]; return n; }); setCriando(null); setAberto(eu); },
  };
  return api;
}

Object.assign(window, { StoriesBar, StoryViewer, StoryComposer, useStories, STORY_FUNDOS: FUNDOS, STORY_FILTROS: FILTROS });
