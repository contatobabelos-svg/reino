/* Reino · RostoPixel — rosto em pixel art vivo do Assistente do Reino.
   Usado na tela Assistente e no bloco "Assistente" do Dashboard.
   - "repouso": pisca e respira sozinho, de vez em quando muda o olhar.
   - "pensando": olhos sobem e três pontinhos pulsam (esperando a API).
   - "falando": a boca troca de forma junto com a letra atual (a prop `letra`
     é quem manda — vogal abre mais, "o/u" arredonda, espaço fecha).
   Tudo isso é pixel puro (SVG com image-rendering: pixelated) para caber no
   estilo holograma do Reino sem depender de imagem nenhuma.
   Respeita prefers-reduced-motion: sem piscar/respirar/olhar sozinho, e quem
   fala por fora (AssistenteScreen) evita digitar letra a letra. Os timers
   daqui são todos limpos ao desmontar — sem vazamento. */
(() => {
  const GRADE = 16;
  // silhueta do rosto: 16 linhas x 16 colunas, 1 = pixel aceso
  const ROSTO = [
    "0000111111110000",
    "0011111111111100",
    "0111111111111110",
    "0111111111111110",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "0111111111111110",
    "0111111111111110",
    "0011111111111100",
    "0000111111110000",
  ].map((linha) => linha.split("").map(Number));

  const VOGAIS = /[aeiouáéíóúâêôãõAEIOUÁÉÍÓÚÂÊÔÃÕ]/;
  // forma da boca a partir da letra que está "soando" agora
  function formaBoca(letra, estado) {
    if (estado === "pensando") return "pensando";
    if (estado !== "falando" || !letra || letra === " " || letra === "\n") return "fechada";
    if (/[oOuU]/.test(letra)) return "o";
    if (VOGAIS.test(letra)) return "aberta";
    return "meia";
  }

  // pixels da boca (linha, coluna) dentro da grade 16x16, por forma
  const BOCAS = {
    fechada: [[10, 6], [10, 7], [10, 8], [10, 9]],
    meia: [[9, 6], [9, 9], [10, 6], [10, 7], [10, 8], [10, 9], [11, 7], [11, 8]],
    aberta: [[9, 6], [9, 7], [9, 8], [9, 9], [10, 6], [10, 9], [11, 6], [11, 7], [11, 8], [11, 9], [12, 7], [12, 8]],
    o: [[9, 7], [9, 8], [10, 6], [10, 9], [11, 6], [11, 9], [12, 7], [12, 8]],
    pensando: [[10, 7], [10, 8]],
  };

  function usarReduzMovimento() {
    const [reduz, setReduz] = React.useState(() =>
      typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false);
    React.useEffect(() => {
      if (typeof matchMedia !== "function") return;
      const mq = matchMedia("(prefers-reduced-motion: reduce)");
      const ouvir = () => setReduz(mq.matches);
      mq.addEventListener ? mq.addEventListener("change", ouvir) : mq.addListener(ouvir);
      return () => (mq.removeEventListener ? mq.removeEventListener("change", ouvir) : mq.removeListener(ouvir));
    }, []);
    return reduz;
  }

  function RostoPixel({ estado = "repouso", letra = null, tamanho = 128, className = "", style }) {
    const reduz = usarReduzMovimento();
    const [piscando, setPiscando] = React.useState(false);
    const [olhar, setOlhar] = React.useState({ x: 0, y: 0 });

    // piscar em intervalos aleatórios — só em repouso/falando, nunca sobrepõe "pensando"
    React.useEffect(() => {
      if (reduz) return; // reduced motion: sem piscar sozinho
      let timeoutAbrir, timeoutFechar;
      const agendar = () => {
        const espera = 2200 + Math.random() * 3000;
        timeoutFechar = setTimeout(() => {
          setPiscando(true);
          timeoutAbrir = setTimeout(() => { setPiscando(false); agendar(); }, 140);
        }, espera);
      };
      agendar();
      return () => { clearTimeout(timeoutFechar); clearTimeout(timeoutAbrir); };
    }, [reduz]);

    // olhar muda de vez em quando, só em repouso
    React.useEffect(() => {
      if (reduz || estado !== "repouso") { setOlhar({ x: 0, y: 0 }); return; }
      let id;
      const agendar = () => {
        id = setTimeout(() => {
          const opcoes = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }];
          setOlhar(opcoes[Math.floor(Math.random() * opcoes.length)]);
          agendar();
        }, 2600 + Math.random() * 2600);
      };
      agendar();
      return () => clearTimeout(id);
    }, [reduz, estado]);

    const boca = formaBoca(letra, estado);
    const pixelsBoca = BOCAS[boca] || BOCAS.fechada;
    const olhoDy = estado === "pensando" ? -1 : olhar.y;
    const olhoDx = estado === "pensando" ? 0 : olhar.x;

    const rotulo = estado === "falando" ? "Assistente do Reino falando"
      : estado === "pensando" ? "Assistente do Reino pensando"
      : "Assistente do Reino em silêncio";

    return (
      <div className={"hg-rosto " + className} style={{ width: tamanho, height: tamanho, ...style }}
        role="img" aria-label={rotulo}>
        <svg viewBox="0 0 16 16" className="hg-rosto-svg" shapeRendering="crispEdges">
          <defs>
            <linearGradient id="hgRostoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--cyan)" />
              <stop offset="1" stopColor="var(--violet)" />
            </linearGradient>
          </defs>
          {/* silhueta */}
          {ROSTO.map((linha, l) => linha.map((acesa, c) => acesa ? (
            <rect key={l + "-" + c} x={c} y={l} width="1" height="1" fill="url(#hgRostoGrad)" opacity=".16" />
          ) : null))}
          {/* olhos: dois blocos 2x2 que "piscam" (achatam) e olham para os lados */}
          {[5, 10].map((colBase) => (
            <g key={colBase} transform={"translate(" + olhoDx * 0.4 + "," + olhoDy * 0.4 + ")"}>
              <rect x={colBase} y={piscando ? 6.4 : 5.5} width="2" height={piscando ? .3 : 2}
                fill="var(--text-strong)" style={{ transition: "y .09s, height .09s" }} />
            </g>
          ))}
          {/* boca: pixels que trocam de forma conforme a letra atual */}
          {pixelsBoca.map(([l, c], i) => (
            <rect key={i} x={c} y={l} width="1" height="1" fill="var(--cyan)" />
          ))}
        </svg>
        {estado === "pensando" ? (
          <div className="hg-rosto-reticencias" aria-hidden="true">
            <i style={{ "--i": 0 }} /><i style={{ "--i": 1 }} /><i style={{ "--i": 2 }} />
          </div>
        ) : null}
      </div>
    );
  }

  Object.assign(window, { RostoPixel });
})();
