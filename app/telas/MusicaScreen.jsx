/* Reino · Música do Reino — busca faixas no Deezer pela Edge Function reino-apis
   (rota "musica") e toca prévias de 30s num único <audio> compartilhado: tocar uma
   faixa nova sempre pausa a anterior. Funciona sem login (dado público). */
(() => {
const { PageHead, Panel, Button, Input, EmptyState } = window.BabelOSDesignSystem_5ad360;
const FUNC_URL = "https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis";
const SUGESTOES = ["samba", "forró", "lo-fi para trabalhar", "sertanejo", "MPB"];

function IconPlay() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M8 5v14l11-7z" /></svg>; }
function IconPause() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>; }

function CartaoFaixa({ f, tocando, onTocar }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".7rem", padding: ".7rem", borderRadius: 14, background: "var(--surface-row)", border: "1px solid var(--border-soft)" }}>
      {f.capa ? <img src={f.capa} alt="" loading="lazy" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flex: "none" }} /> : <span style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(255,255,255,.08)", flex: "none" }} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <strong style={{ display: "block", fontSize: ".88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.titulo}</strong>
        <span className="hg-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{f.artista}</span>
      </div>
      <button type="button" className="hg-icon-btn" aria-label={tocando ? "Pausar prévia" : "Tocar prévia"} onClick={() => onTocar(f)}
        style={{ flex: "none", width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid var(--border-soft)", background: tocando ? "var(--cyan)" : "transparent", color: tocando ? "var(--bg)" : "inherit" }}>
        {tocando ? <IconPause /> : <IconPlay />}
      </button>
      <a href={f.link} target="_blank" rel="noopener noreferrer" className="hg-sub" style={{ flex: "none", fontSize: ".74rem" }}>Deezer ↗</a>
    </div>
  );
}

function MusicaScreen() {
  const [busca, setBusca] = React.useState("samba");
  const [campo, setCampo] = React.useState("samba");
  const [faixas, setFaixas] = React.useState(null); // null = carregando
  const [erro, setErro] = React.useState(null);
  const [tocandoId, setTocandoId] = React.useState(null);
  const audioRef = React.useRef(null);
  if (!audioRef.current && typeof Audio !== "undefined") audioRef.current = new Audio();

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const aoTerminar = () => setTocandoId(null);
    a.addEventListener("ended", aoTerminar);
    return () => a.removeEventListener("ended", aoTerminar);
  }, []);
  React.useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  const buscar = React.useCallback((q) => {
    const termo = q.trim();
    if (!termo) return;
    setErro(null); setFaixas(null);
    fetch(FUNC_URL, {
      method: "POST",
      headers: { apikey: window.REINO_SUPABASE.anon, Authorization: "Bearer " + window.REINO_SUPABASE.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ rota: "musica", q: termo }),
    })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "Não foi possível buscar músicas agora."); return j; })
      .then((j) => setFaixas(j.itens || []))
      .catch((err) => { setErro(err.message); setFaixas([]); });
  }, []);

  React.useEffect(() => { buscar(busca); }, [busca, buscar]);

  const tocar = (f) => {
    const a = audioRef.current;
    if (!a) return;
    if (tocandoId === f.link) { a.pause(); setTocandoId(null); return; }
    a.pause();
    a.src = f.previa;
    a.play().catch(() => {});
    setTocandoId(f.link);
  };

  const enviar = (e) => { e.preventDefault(); setBusca(campo); };

  return (
    <>
      <PageHead title="Música do Reino" subtitle="Prévias de 30 segundos de qualquer faixa, direto no navegador." />
      <Panel fill title="Buscar músicas" subtitle={faixas ? faixas.length + " resultado(s)" : "Carregando…"}>
        <div className="hg-rolar" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr)" }}>
          <form onSubmit={enviar} style={{ display: "flex", gap: ".5rem", minWidth: 0 }}>
            <label className="sr-only" htmlFor="musica-busca">Buscar música</label>
            <Input id="musica-busca" value={campo} onChange={(e) => setCampo(e.target.value)} placeholder="Artista, música ou estilo" style={{ flex: 1, minWidth: 0 }} />
            <Button type="submit" variant="cyan">Buscar</Button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {SUGESTOES.map((s) => (
              <button key={s} type="button" className="hg-pill" onClick={() => { setCampo(s); setBusca(s); }}
                style={busca === s ? { color: "var(--cyan)", borderColor: "var(--cyan)" } : undefined}>{s}</button>
            ))}
          </div>

          {faixas === null ? (
            <p className="hg-sub">Buscando faixas…</p>
          ) : erro ? (
            <EmptyState icon="alerta" title="Música indisponível" description={erro} />
          ) : !faixas.length ? (
            <EmptyState icon="estrela" title="Nada encontrado" description="Tente outro nome de artista, música ou estilo." />
          ) : (
            <div style={{ display: "grid", gap: ".6rem" }}>
              {faixas.map((f) => <CartaoFaixa key={f.link} f={f} tocando={tocandoId === f.link} onTocar={tocar} />)}
            </div>
          )}

          <p className="hg-sub" style={{ margin: 0 }}>Prévias de 30 s · Fonte: Deezer</p>
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { MusicaScreen });
})();
