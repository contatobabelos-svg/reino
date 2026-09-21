/* FundoReino — a cena "Reino Animado" (letreiro neon "Reino" no lago com o castelo futurista)
   como fundo do login, em tela cheia e sem faixas pretas.

   Origem: ~/Downloads/Reino Animado.html (página autoextraível do fundador; cópia intacta em
   assets/login/reino-animado.html). A cena de lá (reino-video.jsx, 20 s em loop) foi portada
   para cá com as duas imagens extraídas (assets/login/reino-cena.webp e reino-neon.png), sem o
   motor de animação nem o painel de ajustes: o relógio é próprio (requestAnimationFrame,
   no máximo 30 quadros/s, parado com a aba escondida) e os ajustes ficam como no original
   (intro desligada, intensidade 0,4).

   Enquadramento (FUNDO_REINO.retrato):
   - paisagem: "cobrir" — palco 1920×1080 escalado para cobrir a janela (corta as sobras).
   - retrato (celular): "encaixar" — cobrir cortaria o letreiro; o palco é escalado para o
     letreiro caber na largura, fica no alto, e o resto da tela é a própria cena desfocada.
     Nenhuma faixa preta. Troque para "cobrir" para o corte puro.
   Movimento reduzido (prefers-reduced-motion): um quadro parado, sem animação.
   Se a imagem não carregar: onFalha() — o LoginImersivo volta ao fundo de reserva. */
(function () {
  const FUNDO_REINO = {
    cena: "assets/login/reino-cena.webp",
    neon: "assets/login/reino-neon.png",
    intensidade: 0.4,
    retrato: "encaixar", // "encaixar" | "cobrir"
    quadroParado: 6,     // s — quadro usado com movimento reduzido
  };

  const TOTAL = 20;
  const SW = 1920, SH = 1080;          // palco
  const IW = 2024, IH = 1080;          // caixa da imagem (cover)
  const IX = (SW - IW) / 2;
  const X = (x) => x / 1717 * IW;      // px da imagem original → px do palco
  const Y = (y) => y / 916 * IH;
  const PX = (x) => (x / 1717 * 100) + "%";
  const PY = (y) => (y / 916 * 100) + "%";
  const TAU = Math.PI * 2;
  const frac = (v) => v - Math.floor(v);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const SPD = 2;
  const wave = (T, ciclos, fase) => Math.sin(TAU * (T / TOTAL * ciclos + (fase || 0)));
  // letreiro: medidas no palco (para o enquadramento no celular)
  const LETREIRO = { x0: IX + X(560), x1: IX + X(1170), cy: Y(380) };

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const STARS = (() => {
    const r = rng(7), out = [];
    const zonas = [[500, 790, 0, 205, 24], [1290, 1395, 0, 135, 9], [640, 790, 205, 285, 4]];
    for (const [x0, x1, y0, y1, n] of zonas) for (let i = 0; i < n; i++) out.push({ x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), s: 1.4 + r() * 1.8, k: 5 + Math.floor(r() * 9), ph: r() });
    return out;
  })();
  const MOTES = (() => {
    const r = rng(11);
    return Array.from({ length: 42 }, () => ({ x: 60 + r() * 1600, y: 570 + r() * 320, k: 2 + Math.floor(r() * 3), ph: r(), ph2: r(), amp: 8 + r() * 22, rise: 70 + r() * 110, s: 2 + r() * 3 }));
  })();
  const SHIPS = [
    { x0: 810, x1: 1020, y: 160, w: 34, k: 1, dir: 1, tilt: -2, ph: 0 },
    { x0: 1000, x1: 1250, y: 55, w: 22, k: 2, dir: -1, tilt: 1, ph: 0.3 },
    { x0: 880, x1: 1010, y: 278, w: 26, k: 1, dir: 1, tilt: 0, ph: 0.5 },
  ];
  const FALLS = [[722, 452, 42, 95], [620, 480, 42, 60], [1357, 460, 40, 95], [1557, 405, 40, 80], [307, 390, 32, 55], [1640, 385, 28, 45], [1290, 368, 26, 42]];
  const DIPS = [[9.4, 0.55, 0.16], [14.75, 0.4, 0.1], [16.9, 0.3, 0.12]];
  // intro desligada (como no original): o letreiro fica aceso com um zumbido sutil e três piscadas
  function litAt(T) {
    let hum = 1 - 0.035 * (0.5 + 0.5 * wave(T, 54)) * (0.5 + 0.5 * wave(T, 18, 0.16));
    for (const [t0, prof, dur] of DIPS) { const u = (T - t0) / dur; if (u >= 0 && u <= 1) hum -= prof * (u < 0.35 ? u / 0.35 : (1 - u) / 0.65); }
    return hum;
  }

  // filtros SVG: ruído periódico deslocado por T → água e cachoeiras fluem sem emenda
  const WY = 600, WH = 300, WTILE = 506;
  const FY = 380, FH = 260, FTILE = 180;
  const WSUB = { x: -607, y: -75, width: 3238, height: 450 };
  const FSUB = { x: -101, y: -180, width: 2226, height: 720 };
  function Filtros({ id, waterDx, waterDy, waterScale, fallsDy, fallsScale }) {
    const wOff = [-506, 506, 1012, 1518, 2024];
    const fOff = [-180, 180, 360];
    return (
      <svg width="0" height="0" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true" focusable="false">
        <defs>
          <filter id={id + "-agua"} filterUnits="userSpaceOnUse" {...WSUB} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.11" numOctaves="2" seed="3" stitchTiles="stitch" x="0" y="-75" width={WTILE} height="450" result="w0" />
            {wOff.map((dx) => <feOffset key={dx} in="w0" dx={dx} dy="0" result={"w" + (dx + 506)} {...WSUB} />)}
            <feMerge result="wstrip" {...WSUB}>
              <feMergeNode in="w0" />
              {wOff.map((dx) => <feMergeNode key={dx} in={"w" + (dx + 506)} />)}
            </feMerge>
            <feOffset in="wstrip" dx={waterDx} dy={waterDy} result="wmoved" {...WSUB} />
            <feDisplacementMap in="SourceGraphic" in2="wmoved" scale={waterScale} xChannelSelector="R" yChannelSelector="G" {...WSUB} />
          </filter>
          <filter id={id + "-quedas"} filterUnits="userSpaceOnUse" {...FSUB} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.07 0.012" numOctaves="2" seed="5" stitchTiles="stitch" x="-101" y="0" width="2226" height={FTILE} result="f0" />
            {fOff.map((dy) => <feOffset key={dy} in="f0" dx="0" dy={dy} result={"f" + (dy + 180)} {...FSUB} />)}
            <feMerge result="fstrip" {...FSUB}>
              <feMergeNode in="f0" />
              {fOff.map((dy) => <feMergeNode key={dy} in={"f" + (dy + 180)} />)}
            </feMerge>
            <feOffset in="fstrip" dx="0" dy={fallsDy} result="fmoved" {...FSUB} />
            <feDisplacementMap in="SourceGraphic" in2="fmoved" scale={fallsScale} xChannelSelector="R" yChannelSelector="G" {...FSUB} />
          </filter>
        </defs>
      </svg>
    );
  }

  const mascara = (m, cruzar) => ({ WebkitMaskImage: m, maskImage: m, WebkitMaskComposite: cruzar ? "source-in" : "source-over", maskComposite: cruzar ? "intersect" : "add" });
  const faixa = (top) => ({ position: "absolute", left: 0, top: -top, width: IW, height: IH, display: "block" });

  function Agua({ id, img, onErro }) {
    const m = "linear-gradient(180deg, rgba(0,0,0,0) 0px, #fff 45px, #fff 262px, rgba(0,0,0,0) 300px), linear-gradient(90deg, rgba(0,0,0,0) 12%, #fff 18%, #fff 79%, rgba(0,0,0,0) 87%), linear-gradient(90deg, #fff 80.2%, rgba(0,0,0,0) 81.6%, rgba(0,0,0,0) 84.2%, #fff 85.6%)";
    return (
      <div style={{ position: "absolute", left: 0, top: WY, width: IW, height: WH, overflow: "hidden", filter: `url(#${id}-agua)`, ...mascara(m, true) }}>
        <img src={img} alt="" style={faixa(WY)} onError={onErro} />
      </div>
    );
  }
  function Quedas({ id, img }) {
    const m = FALLS.map(([cx, cy, rx, ry]) => `radial-gradient(ellipse ${X(rx)}px ${Y(ry)}px at ${X(cx)}px ${Y(cy) - FY}px, #fff 40%, rgba(0,0,0,0) 100%)`).join(", ");
    return (
      <div style={{ position: "absolute", left: 0, top: FY, width: IW, height: FH, overflow: "hidden", filter: `url(#${id}-quedas)`, ...mascara(m, false) }}>
        <img src={img} alt="" style={faixa(FY)} />
      </div>
    );
  }
  function Nevoa({ T, k }) {
    const base = { position: "absolute", left: X(120), top: Y(440), width: X(1480), height: Y(160), filter: "blur(14px)", pointerEvents: "none" };
    const m = mascara("linear-gradient(180deg, rgba(0,0,0,0) 0%, #fff 35%, #fff 65%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgba(0,0,0,0) 0%, #fff 14%, #fff 86%, rgba(0,0,0,0) 100%)", true);
    const o = Math.min(1.3, k);
    return (
      <>
        <div style={{ ...base, ...m, opacity: 0.8 * o, backgroundImage: "radial-gradient(ellipse 230px 60px at 28% 55%, rgba(165,195,240,0.55), rgba(165,195,240,0) 70%), radial-gradient(ellipse 170px 45px at 72% 40%, rgba(165,195,240,0.45), rgba(165,195,240,0) 70%)", backgroundSize: "520px 100%", backgroundRepeat: "repeat-x", backgroundPosition: `${frac(T / TOTAL * SPD) * 520}px 0` }} />
        <div style={{ ...base, ...m, top: Y(470), height: Y(130), opacity: (0.55 + 0.25 * wave(T, 2 * SPD)) * o, backgroundImage: "radial-gradient(ellipse 300px 50px at 50% 50%, rgba(175,200,245,0.5), rgba(175,200,245,0) 70%), radial-gradient(ellipse 180px 40px at 12% 60%, rgba(175,200,245,0.4), rgba(175,200,245,0) 70%)", backgroundSize: "760px 100%", backgroundRepeat: "repeat-x", backgroundPosition: `${-60 * wave(T, SPD)}px 0` }} />
      </>
    );
  }
  function Ceu({ T, k }) {
    const kk = Math.min(1, k);
    return (
      <>
        {STARS.map((s, i) => {
          const tw = 0.5 + 0.5 * wave(T, s.k * SPD, s.ph);
          return <div key={"s" + i} style={{ position: "absolute", left: X(s.x), top: Y(s.y), width: s.s, height: s.s, marginLeft: -s.s / 2, marginTop: -s.s / 2, borderRadius: "50%", background: "#eaf4ff", opacity: (0.25 + 0.75 * tw * tw) * kk, boxShadow: `0 0 ${s.s * 2}px rgba(190,220,255,${0.8 * tw})` }} />;
        })}
        {SHIPS.map((sh, i) => {
          const p = frac(T / TOTAL * sh.k * SPD + sh.ph);
          const x = sh.dir > 0 ? sh.x0 + p * (sh.x1 - sh.x0) : sh.x1 - p * (sh.x1 - sh.x0);
          const y = sh.y + 2.5 * Math.sin(TAU * (p * 3 + i));
          const fade = clamp(Math.min(p, 1 - p) / 0.14, 0, 1);
          const pisca = Math.pow(0.5 + 0.5 * wave(T, 30, i * 0.3), 10);
          const w = sh.w, h = w * 0.3;
          return (
            <div key={"n" + i} style={{ position: "absolute", left: X(x), top: Y(y), width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, opacity: fade, transform: `rotate(${sh.tilt}deg)` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 20%, #3b4763 0%, #161c2c 55%, #0a0e19 100%)", boxShadow: "0 1px 0 rgba(130,195,255,0.75), 0 3px 7px rgba(90,160,255,0.5)" }} />
              <div style={{ position: "absolute", left: "50%", top: "20%", width: 3, height: 3, marginLeft: -1.5, borderRadius: "50%", background: "#e6f4ff", opacity: 0.3 + 0.7 * pisca, boxShadow: "0 0 5px rgba(170,215,255,0.9)" }} />
            </div>
          );
        })}
      </>
    );
  }
  const NB = { left: X(500), top: Y(240), width: X(1230) - X(500), height: Y(530) - Y(240) };
  function Neon({ img, opacity, filter, blend }) {
    return (
      <div style={{ position: "absolute", ...NB, overflow: "hidden", opacity, filter, mixBlendMode: blend, pointerEvents: "none" }}>
        <img src={img} alt="" style={{ position: "absolute", left: -NB.left, top: -NB.top, width: IW, height: IH, display: "block" }} />
      </div>
    );
  }
  function Letreiro({ img, lit, k }) {
    return (
      <>
        <Neon img={img} opacity={(1 - lit) * 0.95} filter="brightness(0.32) saturate(0.4)" />
        <div style={{ position: "absolute", left: PX(863 - 420), top: PY(378 - 150), width: PX(840), height: PY(300), opacity: lit * 0.55 * k, mixBlendMode: "screen", background: "radial-gradient(ellipse at 50% 50%, rgba(110,170,255,0.6) 0%, rgba(110,170,255,0.18) 40%, rgba(110,170,255,0) 70%)" }} />
        <div style={{ position: "absolute", left: PX(860 - 330), top: PY(640 - 100), width: PX(660), height: PY(200), opacity: lit * 0.38 * k, mixBlendMode: "screen", background: "radial-gradient(ellipse at 50% 50%, rgba(120,180,255,0.55) 0%, rgba(120,180,255,0.15) 45%, rgba(120,180,255,0) 70%)" }} />
        <Neon img={img} opacity={lit * 0.6 * k} filter="blur(28px) brightness(1.1)" blend="screen" />
        <Neon img={img} opacity={lit * 0.9} filter="blur(6px) brightness(1.15)" blend="screen" />
        <Neon img={img} opacity={lit * 0.7} blend="screen" />
      </>
    );
  }
  function Faiscas({ T, k }) {
    const kk = Math.min(1.2, k);
    return (
      <>
        {MOTES.map((m, i) => {
          const p = frac(T / TOTAL * m.k * SPD + m.ph);
          const x = m.x + m.amp * Math.sin(TAU * (p * 1.5 + m.ph2));
          const y = m.y - p * m.rise;
          const o = Math.pow(Math.sin(Math.PI * p), 1.6) * kk;
          return <div key={i} style={{ position: "absolute", left: X(x), top: Y(y), width: m.s, height: m.s, marginLeft: -m.s / 2, marginTop: -m.s / 2, borderRadius: "50%", background: "rgba(200,228,255,0.95)", opacity: o, boxShadow: `0 0 ${m.s * 2.5}px rgba(150,200,255,0.9)` }} />;
        })}
      </>
    );
  }

  function Cena({ id, T, k, onErro }) {
    const lit = clamp(litAt(T), 0, 1);
    const cam = 1 + 0.035 * (0.5 - 0.5 * Math.cos(TAU * T / TOTAL));
    const camX = 10 * wave(T, 1);
    const img = FUNDO_REINO.cena, neon = FUNDO_REINO.neon;
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Filtros id={id} waterDx={-WTILE * frac(T / TOTAL * SPD)} waterDy={3 * wave(T, 4 * SPD)} waterScale={24 * k} fallsDy={frac(T * 126 * SPD / FTILE) * FTILE} fallsScale={16 * k} />
        <div style={{ position: "absolute", left: IX, top: 0, width: IW, height: IH, transform: `translate3d(${camX}px, 0, 0) scale(${cam})`, transformOrigin: "50% 58%", willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} onError={onErro} />
          <Agua id={id} img={img} onErro={onErro} />
          <Quedas id={id} img={img} />
          <Nevoa T={T} k={k} />
          <Ceu T={T} k={k} />
          <Letreiro img={neon} lit={lit} k={k} />
          <Faiscas T={T} k={k} />
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 52%, rgba(3,6,14,0.6) 100%)" }} />
      </div>
    );
  }

  /* enquadramento: escala e posição do palco para a janela atual */
  function enquadrar(w, h) {
    const cobrir = Math.max(w / SW, h / SH);
    if (FUNDO_REINO.retrato === "encaixar" && w / h < 0.9) {
      const larg = LETREIRO.x1 - LETREIRO.x0;
      const s = Math.min(cobrir, (w * 0.94) / larg);
      if (s < cobrir) {
        const cx = (LETREIRO.x0 + LETREIRO.x1) / 2;
        const top = Math.max(0, Math.min(h * 0.27 - LETREIRO.cy * s, h - SH * s));
        return { s, left: w / 2 - cx * s, top, encaixado: true };
      }
    }
    return { s: cobrir, left: (w - SW * cobrir) / 2, top: (h - SH * cobrir) / 2, encaixado: false };
  }

  function FundoReino({ onFalha, className }) {
    const id = React.useMemo(() => "fr" + Math.random().toString(36).slice(2, 7), []);
    const quieto = React.useMemo(() => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }, []);
    const [T, setT] = React.useState(FUNDO_REINO.quadroParado);
    const [tam, setTam] = React.useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const falhou = React.useRef(false);
    const aoErro = React.useCallback(() => { if (!falhou.current) { falhou.current = true; onFalha && onFalha(); } }, [onFalha]);

    React.useEffect(() => {
      const medir = () => setTam({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }, []);
    React.useEffect(() => {
      if (quieto) return undefined;
      let raf = 0, ultimo = 0, acumulado = FUNDO_REINO.quadroParado, antes = performance.now();
      const quadro = (agora) => {
        raf = requestAnimationFrame(quadro);
        const dt = Math.min(0.1, (agora - antes) / 1000); antes = agora;
        if (document.hidden) return;
        acumulado = (acumulado + dt) % TOTAL;
        if (agora - ultimo < 33) return;
        ultimo = agora;
        setT(acumulado);
      };
      raf = requestAnimationFrame(quadro);
      return () => cancelAnimationFrame(raf);
    }, [quieto]);

    const q = enquadrar(tam.w, tam.h);
    return (
      <div className={"hg-fundo-reino" + (q.encaixado ? " is-encaixado" : "") + (className ? " " + className : "")} aria-hidden="true">
        {q.encaixado ? <img className="hg-fundo-reino-desfoque" src={FUNDO_REINO.cena} alt="" /> : null}
        <div className="hg-fundo-reino-palco" style={{ width: SW, height: SH, transform: `translate(${q.left}px, ${q.top}px) scale(${q.s})` }}>
          <Cena id={id} T={T} k={FUNDO_REINO.intensidade} onErro={aoErro} />
        </div>
      </div>
    );
  }

  /* se a cena quebrar em tempo de execução, cai para a página original em iframe (cobrindo) */
  class FundoReinoSeguro extends React.Component {
    constructor(p) { super(p); this.state = { erro: false }; }
    static getDerivedStateFromError() { return { erro: true }; }
    componentDidCatch(e) { try { console.warn("[FundoReino] cena falhou, usando a página original:", e && e.message); } catch (x) { /* nada */ } }
    render() {
      if (this.state.erro) {
        return (
          <div className="hg-fundo-reino" aria-hidden="true">
            <iframe className="hg-fundo-reino-iframe" src="assets/login/reino-animado.html" title="" tabIndex={-1} loading="eager"
              onError={this.props.onFalha} />
          </div>
        );
      }
      return <FundoReino {...this.props} />;
    }
  }

  Object.assign(window, { FundoReino: FundoReinoSeguro, FUNDO_REINO });
})();
