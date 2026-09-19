/* Reino Academy — trilhas fictícias do mapa mental + aulas reais, coladas por URL (YouTube/Panda Video).
   A IA lê só o que a plataforma expõe (título, descrição, thumbnail) ou uma transcrição colada;
   não há download nem transcrição automática do vídeo aqui. */
(() => {
const { PageHead, Panel, Button, Icon, Input, ProgressBar, ProgressRing, EmptyState, Pill } = window.BabelOSDesignSystem_5ad360;
const CHAVE = "reino.academy.aulas";
const lerAulas = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch (e) { return []; } };
const gravarAulas = (lst) => { try { localStorage.setItem(CHAVE, JSON.stringify(lst)); } catch (e) {} };

function ehAdmin() {
  try {
    const s = (window.ReinoContas && window.ReinoContas.sessao && window.ReinoContas.sessao()) || {};
    return !!s.token && s.situacao === "admin";
  } catch (e) { return false; }
}

/* reconhece a URL e prepara o player, sem chave nenhuma */
function detectarVideo(url) {
  const u = String(url || "").trim();
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);
  if (m) return { plataforma: "youtube", id: m[1], embedUrl: "https://www.youtube.com/embed/" + m[1], thumb: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg" };
  m = u.match(/pandavideo\.com\.br.*?[?&]v=([\w-]+)/i) || u.match(/pandavideo\.com\.br\/embed\/\?v=([\w-]+)/i);
  if (m) return { plataforma: "panda", id: m[1], embedUrl: u.includes("/embed/") ? u : "https://player.pandavideo.com.br/embed/?v=" + m[1], thumb: null };
  if (/pandavideo\.com\.br/i.test(u)) return { plataforma: "panda", id: null, embedUrl: u, thumb: null };
  return null;
}

/* metadados públicos do YouTube via oEmbed — sem chave */
async function metaYouTube(url) {
  try {
    const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(url));
    if (!r.ok) return null;
    const j = await r.json();
    return { titulo: j.title, autor: j.author_name, thumb: j.thumbnail_url };
  } catch (e) { return null; }
}

async function gerarResumo({ titulo, descricao, transcricao }) {
  const base = [titulo && "Título: " + titulo, descricao && "Descrição/metadados: " + descricao, transcricao && "Transcrição: " + transcricao.slice(0, 6000)].filter(Boolean).join("\n\n");
  if (!base.trim()) return "Sem informação suficiente para resumir — o vídeo não trouxe título nem descrição.";
  const prompt = "Você é o assistente do Reino Academy, uma trilha de formação sobre indicação, afiliados e vendas. " +
    "Com base apenas no material abaixo (sem inventar o que não está escrito), escreva em português do Brasil:\n" +
    "1) um resumo de 3 a 5 frases do que a aula ensina;\n" +
    "2) o nível de experiência recomendado para assistir (Barão, Visconde, Conde, Marquês, Duque, Príncipe, Rei ou Imperador — do mais iniciante ao mais avançado);\n" +
    "Responda só com JSON válido: {\"resumo\": \"...\", \"nivel\": \"...\"}\n\n" + base;
  const texto = await window.claude.complete(prompt);
  try {
    const j = JSON.parse(String(texto).match(/\{[\s\S]*\}/)[0]);
    return j;
  } catch (e) { return { resumo: String(texto).slice(0, 900), nivel: "Barão" }; }
}

function FormularioAula({ onCriar, ocupado, setOcupado }) {
  const [url, setUrl] = React.useState("");
  const [tituloManual, setTituloManual] = React.useState("");
  const [descManual, setDescManual] = React.useState("");
  const [transcricao, setTranscricao] = React.useState("");
  const [erro, setErro] = React.useState(null);
  const [aberto, setAberto] = React.useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    const v = detectarVideo(url);
    if (!v) { setErro("Não reconheci essa URL. Cole um link do YouTube ou do Panda Video."); return; }
    setOcupado(true);
    try {
      let titulo = tituloManual.trim(), thumb = v.thumb;
      if (v.plataforma === "youtube" && !titulo) {
        const m = await metaYouTube(url);
        if (m) { titulo = m.titulo; thumb = m.thumb || thumb; }
      }
      titulo = titulo || "Aula sem título";
      const ia = await gerarResumo({ titulo, descricao: descManual, transcricao });
      onCriar({ id: "aula-" + Date.now(), titulo, plataforma: v.plataforma, embedUrl: v.embedUrl, thumb, resumo: ia.resumo || "", nivel: ia.nivel || "Barão", criadoEm: new Date().toISOString() });
      setUrl(""); setTituloManual(""); setDescManual(""); setTranscricao(""); setAberto(false);
    } catch (err) { setErro("Não foi possível analisar agora: " + (err && err.message ? err.message : "tente de novo")); }
    finally { setOcupado(false); }
  };

  if (!aberto) return <Button variant="cyan" icon="mais" onClick={() => setAberto(true)}>Adicionar aula por URL</Button>;
  return (
    <form onSubmit={enviar} style={{ display: "grid", gap: ".6rem", padding: ".9rem", borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }}>
      <strong style={{ fontSize: ".85rem" }}>Nova aula a partir de um vídeo</strong>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link do YouTube ou do Panda Video" aria-label="URL do vídeo" required />
      <Input value={tituloManual} onChange={(e) => setTituloManual(e.target.value)} placeholder="Título (opcional — no YouTube eu busco sozinho)" aria-label="Título" />
      <textarea value={descManual} onChange={(e) => setDescManual(e.target.value)} placeholder="Descrição da aula, se quiser guiar o resumo" rows={2} style={{ padding: ".5rem .65rem", borderRadius: 8, border: "1px solid rgba(255,255,255,.18)", background: "rgba(7,12,22,.4)", color: "inherit", font: "inherit", resize: "vertical" }} />
      <textarea value={transcricao} onChange={(e) => setTranscricao(e.target.value)} placeholder="Cole a transcrição aqui para um resumo mais fiel (opcional — eu não transcrevo o vídeo sozinho)" rows={3} style={{ padding: ".5rem .65rem", borderRadius: 8, border: "1px solid rgba(255,255,255,.18)", background: "rgba(7,12,22,.4)", color: "inherit", font: "inherit", resize: "vertical" }} />
      {erro ? <span style={{ fontSize: ".78rem", color: "#ff9a9a" }}>{erro}</span> : null}
      <div style={{ display: "flex", gap: ".5rem" }}>
        <Button type="submit" variant="cyan" disabled={ocupado}>{ocupado ? "Analisando com IA…" : "Analisar e adicionar"}</Button>
        <Button type="button" variant="ghost" onClick={() => setAberto(false)} disabled={ocupado}>Cancelar</Button>
      </div>
    </form>
  );
}

function AcademyScreen() {
  const d = window.BABEL_DEMO;
  const ordem = d.titulos.map((t) => t.nome).reverse();
  const meu = ordem.indexOf(d.perfil.titulo);
  const media = Math.round(d.academy.reduce((s, c) => s + c.progresso, 0) / d.academy.length);
  const admin = ehAdmin();
  const [aulas, setAulas] = React.useState(lerAulas);
  const [ocupado, setOcupado] = React.useState(false);
  const [tocando, setTocando] = React.useState(null);

  const criarAula = (aula) => setAulas((lst) => { const novo = [aula, ...lst]; gravarAulas(novo); return novo; });
  const apagarAula = (id) => setAulas((lst) => { const novo = lst.filter((a) => a.id !== id); gravarAulas(novo); return novo; });

  return (
    <>
      <PageHead title="Reino Academy" subtitle="Trilhas curtas para render mais no Reino. Cada título libera novos cursos." />
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "minmax(0,1fr)" }}>
        <Panel fill title="Trilhas" subtitle={(d.academy.length + aulas.length) + " cursos"}>
          <div className="hg-rolar" style={{ display: "grid", gap: "1rem" }}>
            {admin ? <FormularioAula onCriar={criarAula} ocupado={ocupado} setOcupado={setOcupado} /> : null}

            {aulas.length ? (
              <ul className="hg-cursos">
                {aulas.map((a) => (
                  <li key={a.id}>
                    <span className="hg-cursos-ico">{a.thumb ? <img src={a.thumb} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} /> : <Icon name="revista" />}</span>
                    <div>
                      <strong>{a.titulo}</strong>
                      <span>{a.plataforma === "youtube" ? "YouTube" : "Panda Video"} · nível sugerido: {a.nivel}</span>
                      {a.resumo ? <p style={{ fontSize: ".78rem", opacity: .75, margin: ".25rem 0 0" }}>{a.resumo}</p> : null}
                    </div>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <Button variant="cyan" onClick={() => setTocando(a)}>Assistir</Button>
                      {admin ? <Button variant="ghost" onClick={() => apagarAula(a.id)}>Remover</Button> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="hg-cursos">
              {d.academy.map((c) => {
                const liberado = ordem.indexOf(c.nivel) <= meu;
                return (
                  <li key={c.nome} className={liberado ? "" : "is-bloqueado"}>
                    <span className="hg-cursos-ico"><Icon name={liberado ? "revista" : "coroa"} /></span>
                    <div>
                      <strong>{c.nome}</strong>
                      <span>{c.aulas} aulas · {c.duracao}{liberado ? "" : " · exige " + c.nivel}</span>
                      {liberado ? <ProgressBar value={c.progresso} /> : null}
                    </div>
                    {liberado ? (
                      <Button variant={c.progresso ? "ghost" : "cyan"}>{c.progresso === 100 ? "Revisar" : c.progresso ? "Continuar" : "Começar"}</Button>
                    ) : <span className="hg-sub">Bloqueado</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>
        <Panel tone="conquistas" fill title="Seu progresso" headingLevel={3}>
          <ProgressRing value={media} label="das trilhas liberadas" />
          <p className="hg-sub" style={{ textAlign: "center" }}>Concluir uma trilha conta pontos para a sua guilda.</p>
        </Panel>
      </div>

      {tocando ? (
        <div role="dialog" aria-modal="true" onClick={() => setTocando(null)} style={{ position: "fixed", inset: 0, background: "rgba(4,8,16,.82)", display: "grid", placeItems: "center", zIndex: 60, padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(880px, 100%)", background: "#0b1220", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              <iframe src={tocando.embedUrl} title={tocando.titulo} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
            <div style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                <strong style={{ fontSize: "1rem" }}>{tocando.titulo}</strong>
                <Button variant="ghost" onClick={() => setTocando(null)}>Fechar</Button>
              </div>
              <p style={{ fontSize: ".85rem", opacity: .8, marginTop: ".4rem" }}>{tocando.resumo}</p>
              <span style={{ fontSize: ".75rem", opacity: .6 }}>Nível sugerido pela IA: {tocando.nivel}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

Object.assign(window, { AcademyScreen });
})();
