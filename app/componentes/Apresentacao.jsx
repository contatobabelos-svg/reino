/* Reino · Apresentação da aba (AJ3, 22/09) — na primeira vez que a pessoa abre cada aba, o
   Assistente do Reino (o RostoPixel) aparece num cartão no canto e fala, com voz pré-gravada,
   o que aquela aba faz. Texto em dados/apresentacoes.js, áudio em assets/voz/ (dados/vozes.js).
   - Uma vez por aba, por conta, neste navegador (localStorage reino.apresentacao.<conta>).
   - "Não mostrar mais" desliga todas; Configurações liga de novo (ReinoApresentacao.religar()).
   - O botão "?" da barra de cima reabre a apresentação da aba atual a qualquer momento.
   - Áudio: tenta tocar sozinho (a pessoa acabou de clicar numa aba, então o navegador costuma
     deixar); se o navegador bloquear, o cartão mostra "Ouvir" e o texto fica ali para ler.
     O mudo é lembrado. A boca do rosto acompanha o ponto do texto que está sendo falado.
   - Esc fecha. Com prefers-reduced-motion, o cartão aparece sem deslizar.
   Referências (docs/contexto/apresentacao-abas.md): Duolingo (mascote fala uma frase por vez),
   Notion e Linear (curto, uma dica por conceito), Clippy como o que NÃO fazer (interromper sem
   saída e repetir). */
(() => {
  const CHAVE = (id) => "reino.apresentacao." + (id || "anon");
  const CHAVE_MUDO = "reino.apresentacao.mudo";
  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v == null ? padrao : JSON.parse(v); } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento: mostra de novo na próxima vez */ } };
  const estado = (id) => ler(CHAVE(id), { vistas: [], desligado: false });

  /* API para Configurações e para o botão "?" (eventos, para não depender de onde o cartão está) */
  window.ReinoApresentacao = {
    religar: (id) => { gravar(CHAVE(id), { vistas: [], desligado: false }); },
    desligada: (id) => !!estado(id).desligado,
    abrir: () => window.dispatchEvent(new Event("reino-apresentacao-abrir")),
  };

  const IcSom = ({ mudo }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {mudo ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
    </svg>
  );
  const IcPlay = ({ tocando }) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      {tocando ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
    </svg>
  );

  function Apresentacao({ rota, conta }) {
    const TEXTOS = window.REINO_APRESENTACOES || {};
    const VOZES = window.REINO_VOZES || {};
    const id = conta && conta.id;
    const [aberta, setAberta] = React.useState(null); // rota apresentada agora
    const [tocando, setTocando] = React.useState(false);
    const [bloqueado, setBloqueado] = React.useState(false);
    const [mudo, setMudo] = React.useState(() => !!ler(CHAVE_MUDO, false));
    const [letra, setLetra] = React.useState(null);
    const audioRef = React.useRef(null);
    const quieto = React.useMemo(() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }, []);
    const info = aberta ? TEXTOS[aberta] : null;

    const parar = () => { const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; } setTocando(false); setLetra(null); };
    const tocar = React.useCallback((r, forcar) => {
      const v = VOZES[r];
      const a = audioRef.current;
      if (!v || !a || (mudo && !forcar)) return;
      if (!a.src.endsWith(v.src)) a.src = v.src;
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.then(() => setBloqueado(false)).catch(() => { setBloqueado(true); setTocando(false); });
    }, [mudo]); // eslint-disable-line react-hooks/exhaustive-deps

    const fechar = (desligarTudo) => {
      parar();
      const e = estado(id);
      if (aberta && !e.vistas.includes(aberta)) e.vistas.push(aberta);
      if (desligarTudo) e.desligado = true;
      gravar(CHAVE(id), e);
      setAberta(null);
    };

    /* ao trocar de aba: se ainda não viu esta, apresenta (um instante depois, para a tela montar) */
    React.useEffect(() => {
      parar(); setAberta(null);
      const e = estado(id);
      if (e.desligado || e.vistas.includes(rota) || !TEXTOS[rota]) return undefined;
      const t = setTimeout(() => { setAberta(rota); tocar(rota); }, 700);
      return () => clearTimeout(t);
    }, [rota, id]); // eslint-disable-line react-hooks/exhaustive-deps

    /* "?" na barra de cima: reabre a desta aba, com voz (é um clique, então o navegador deixa) */
    React.useEffect(() => {
      const abrir = () => { if (!TEXTOS[rota]) return; setAberta(rota); tocar(rota, true); };
      window.addEventListener("reino-apresentacao-abrir", abrir);
      return () => window.removeEventListener("reino-apresentacao-abrir", abrir);
    }, [rota, tocar]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
      if (!aberta) return undefined;
      const tecla = (e) => { if (e.key === "Escape") fechar(false); };
      window.addEventListener("keydown", tecla);
      return () => window.removeEventListener("keydown", tecla);
    }); // eslint-disable-line react-hooks/exhaustive-deps

    /* boca: a letra do texto na mesma proporção do tempo do áudio */
    const aoTempo = () => {
      const a = audioRef.current;
      if (!a || !info || !a.duration) return;
      const i = Math.min(info.texto.length - 1, Math.floor((a.currentTime / a.duration) * info.texto.length));
      setLetra(quieto ? null : info.texto[i]);
    };
    const alternarMudo = () => {
      const m = !mudo; setMudo(m); gravar(CHAVE_MUDO, m);
      if (m) parar(); else if (aberta) tocar(aberta, true);
    };
    const playPausa = () => {
      const a = audioRef.current;
      if (!a || !aberta) return;
      if (tocando) { a.pause(); setTocando(false); setLetra(null); }
      else { if (mudo) { setMudo(false); gravar(CHAVE_MUDO, false); } if (a.ended || !a.src) tocar(aberta, true); else a.play().catch(() => setBloqueado(true)); }
    };

    const temVoz = !!(aberta && VOZES[aberta]);
    const Rosto = window.RostoPixel;
    return (
      <>
        <audio ref={audioRef} preload="none" onPlay={() => setTocando(true)} onPause={() => { setTocando(false); setLetra(null); }}
          onEnded={() => { setTocando(false); setLetra(null); }} onTimeUpdate={aoTempo} />
        {info ? (
          <aside className={"hg-apres hg-panel" + (quieto ? " is-quieto" : "")} role="dialog" aria-modal="false" aria-labelledby="hg-apres-titulo">
            <div className="hg-apres-topo">
              <div className={"hg-apres-rosto" + (tocando ? " is-falando" : "")}>
                {Rosto ? <Rosto estado={tocando ? "falando" : "repouso"} letra={letra} tamanho={56} /> : null}
              </div>
              <div className="hg-apres-quem">
                <small>Assistente do Reino</small>
                <h2 id="hg-apres-titulo">{info.titulo}</h2>
              </div>
              {temVoz ? (
                <button type="button" className="hg-apres-icone" onClick={alternarMudo} aria-pressed={mudo}
                  aria-label={mudo ? "Ligar a voz" : "Desligar a voz"} title={mudo ? "Ligar a voz" : "Desligar a voz"}><IcSom mudo={mudo} /></button>
              ) : null}
            </div>
            <p className="hg-apres-texto" aria-live="polite">{info.texto}</p>
            <div className="hg-apres-acoes">
              {temVoz ? (
                <button type="button" className="hg-apres-ouvir" onClick={playPausa}>
                  <IcPlay tocando={tocando} /><span>{tocando ? "Pausar" : bloqueado || mudo ? "Ouvir" : "Ouvir de novo"}</span>
                </button>
              ) : null}
              <button type="button" className="hg-apres-link" onClick={() => fechar(true)}>Não mostrar mais</button>
              <button type="button" className="hg-apres-ok" onClick={() => fechar(false)} autoFocus>Entendi</button>
            </div>
          </aside>
        ) : null}
      </>
    );
  }

  /* botão "?" da barra de cima */
  function BotaoApresentacao() {
    return (
      <button type="button" className="hg-apres-ajuda" onClick={() => window.ReinoApresentacao.abrir()}
        aria-label="O que é esta aba?" title="O que é esta aba?">?</button>
    );
  }

  Object.assign(window, { Apresentacao, BotaoApresentacao });
})();
