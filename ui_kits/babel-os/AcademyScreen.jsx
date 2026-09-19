/* Reino Academy — trilhas e aulas vêm do banco (Supabase): o administrador cola uma
   URL do YouTube (vídeo ou canal) e o servidor (Edge Function academy-importar) monta
   a trilha do canal e as aulas sozinho. Aqui só lemos e mostramos.
   Aulas antigas gravadas no localStorage (versão anterior, por URL solta) continuam
   visíveis numa seção à parte — não apagamos nada que o usuário já tinha. */
(() => {
const { PageHead, Panel, Button, Icon, Field, Select, ProgressRing, EmptyState, Pill } = window.BabelOSDesignSystem_5ad360;
const CHAVE = "reino.academy.aulas";
const lerAulasLocais = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch (e) { return []; } };
const NIVEIS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];

function ehAdmin() {
  try {
    const s = (window.ReinoContas && window.ReinoContas.sessao && window.ReinoContas.sessao()) || {};
    return !!s.token && s.situacao === "admin";
  } catch (e) { return false; }
}

/* leitura pública do banco — mesmo padrão REST de fotos.js/afiliados.js */
async function lerTrilhasDoBanco() {
  const cfg = window.REINO_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anon) return null;
  const base = cfg.url.replace(/\/$/, "") + "/rest/v1/";
  const cab = { apikey: cfg.anon, Authorization: "Bearer " + cfg.anon };
  const [rt, ra] = await Promise.all([
    fetch(base + "academy_trilhas?select=*&order=ordem.asc,criado_em.asc", { headers: cab }),
    fetch(base + "academy_aulas?select=*&order=ordem.asc", { headers: cab }),
  ]);
  if (!rt.ok || !ra.ok) throw new Error("banco " + rt.status + "/" + ra.status);
  const [trilhas, aulas] = await Promise.all([rt.json(), ra.json()]);
  const porTrilha = {};
  aulas.forEach((a) => { (porTrilha[a.trilha_id] || (porTrilha[a.trilha_id] = [])).push(a); });
  return trilhas.map((t) => ({ ...t, aulas: porTrilha[t.id] || [] }));
}

/* formulário do admin: cola a URL, a Edge Function decide se é vídeo ou canal */
function FormularioImportar({ onImportado }) {
  const [url, setUrl] = React.useState("");
  const [nivel, setNivel] = React.useState("");
  const [ocupado, setOcupado] = React.useState(false);
  const [aviso, setAviso] = React.useState(null); // { tipo: "erro" | "info" | "ok", texto }
  const [aberto, setAberto] = React.useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setAviso(null);
    const tk = window.ReinoContas && window.ReinoContas.token ? await window.ReinoContas.token() : null;
    if (!tk) { setAviso({ tipo: "erro", texto: "Entre com uma conta de administrador para importar." }); return; }
    setOcupado(true);
    try {
      const cfg = window.REINO_SUPABASE;
      const r = await fetch("https://fxlansnepokjxdikxocb.supabase.co/functions/v1/academy-importar", {
        method: "POST",
        headers: { Authorization: "Bearer " + tk, apikey: cfg.anon, "Content-Type": "application/json" },
        body: JSON.stringify({ url, nivel: nivel || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        // 402 = a busca de canal inteiro exige a youtube138 assinada; não é uma falha do app, é aviso
        setAviso({ tipo: r.status === 402 ? "info" : "erro", texto: j.erro || "Não foi possível importar agora." });
        return;
      }
      setUrl("");
      setAviso({ tipo: "ok", texto: (j.aulas ? j.aulas.length : 0) + " aula(s) adicionada(s) à trilha " + (j.trilha ? j.trilha.titulo : "") + "." });
      onImportado();
    } catch (err) {
      setAviso({ tipo: "erro", texto: "Falha de conexão. Tente de novo." });
    } finally { setOcupado(false); }
  };

  if (!aberto) return <Button variant="cyan" icon="mais" onClick={() => setAberto(true)}>Importar do YouTube</Button>;
  return (
    <form onSubmit={enviar} style={{ display: "grid", gap: ".6rem", padding: ".9rem", borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }}>
      <strong style={{ fontSize: ".85rem" }}>Importar trilha ou aula do YouTube</strong>
      <Field label="Link do YouTube (vídeo ou canal)">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=... ou https://www.youtube.com/@canal" aria-label="Link do YouTube" required
          style={{ width: "100%", padding: ".5rem .65rem", borderRadius: 8, border: "1px solid rgba(255,255,255,.18)", background: "rgba(7,12,22,.4)", color: "inherit", font: "inherit" }} />
      </Field>
      <Field label="Nível sugerido (opcional)">
        <Select value={nivel} onChange={(e) => setNivel(e.target.value)} aria-label="Nível sugerido">
          <option value="">Sem nível fixo</option>
          {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      </Field>
      {aviso ? <span style={{ fontSize: ".78rem", color: aviso.tipo === "erro" ? "var(--red)" : aviso.tipo === "ok" ? "var(--green)" : "var(--amber)" }}>{aviso.texto}</span> : null}
      <div style={{ display: "flex", gap: ".5rem" }}>
        <Button type="submit" variant="cyan" disabled={ocupado}>{ocupado ? "Importando…" : "Importar"}</Button>
        <Button type="button" variant="ghost" onClick={() => setAberto(false)} disabled={ocupado}>Cancelar</Button>
      </div>
    </form>
  );
}

function segundosParaTexto(s) {
  if (!Number.isFinite(s) || s <= 0) return null;
  const m = Math.round(s / 60);
  return m < 60 ? m + " min" : Math.floor(m / 60) + "h" + String(m % 60).padStart(2, "0");
}

function AcademyScreen() {
  const [trilhas, setTrilhas] = React.useState(null); // null = carregando
  const [erro, setErro] = React.useState(null);
  const [recarga, setRecarga] = React.useState(0);
  const [aulasLocais, setAulasLocais] = React.useState(lerAulasLocais);
  const [tocando, setTocando] = React.useState(null);
  const admin = ehAdmin();

  React.useEffect(() => {
    let vivo = true;
    lerTrilhasDoBanco()
      .then((lst) => { if (vivo) setTrilhas(lst || []); })
      .catch(() => { if (vivo) { setErro("Não foi possível ler as trilhas agora."); setTrilhas([]); } });
    return () => { vivo = false; };
  }, [recarga]);

  const totalAulas = (trilhas || []).reduce((s, t) => s + t.aulas.length, 0) + aulasLocais.length;
  const apagarAulaLocal = (id) => setAulasLocais((lst) => {
    const novo = lst.filter((a) => a.id !== id);
    try { localStorage.setItem(CHAVE, JSON.stringify(novo)); } catch (e) {}
    return novo;
  });

  return (
    <>
      <PageHead title="Reino Academy" subtitle="Trilhas de vídeo importadas do YouTube. Cada título libera novos conteúdos." />
      <div className="hg-ops hg-encher hg-duas-col" style={{ "--col1": "minmax(0,1fr)" }}>
        <Panel fill title="Trilhas" subtitle={totalAulas + " aula(s)"}>
          <div className="hg-rolar" style={{ display: "grid", gap: "1.1rem" }}>
            {admin ? <FormularioImportar onImportado={() => setRecarga((n) => n + 1)} /> : null}

            {trilhas === null ? (
              <p className="hg-sub">Carregando trilhas…</p>
            ) : erro && !trilhas.length ? (
              <EmptyState icon="alerta" title="Trilhas indisponíveis" description={erro} />
            ) : !trilhas.length && !aulasLocais.length ? (
              <EmptyState icon="revista" title="Nenhuma trilha ainda" description={admin ? "Cole um link do YouTube acima para começar." : "Volte em breve: o Reino está preparando as primeiras trilhas."} />
            ) : (
              trilhas.map((t) => (
                <section key={t.id} aria-label={t.titulo}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".5rem" }}>
                    {t.capa ? <img src={t.capa} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} /> : <span className="hg-cursos-ico"><Icon name="revista" /></span>}
                    <div>
                      <strong style={{ display: "block", fontSize: ".95rem" }}>{t.titulo}</strong>
                      <span className="hg-sub">{t.aulas.length} aula(s){t.descricao ? " · " + t.descricao : ""}</span>
                    </div>
                  </div>
                  {t.aulas.length ? (
                    <ul className="hg-cursos">
                      {t.aulas.map((a) => (
                        <li key={a.id}>
                          <span className="hg-cursos-ico">{a.capa ? <img src={a.capa} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} /> : <Icon name="revista" />}</span>
                          <div>
                            <strong>{a.titulo}</strong>
                            <span>{a.canal || "YouTube"}{a.nivel ? " · nível sugerido: " + a.nivel : ""}{segundosParaTexto(a.duracao_seg) ? " · " + segundosParaTexto(a.duracao_seg) : ""}</span>
                          </div>
                          <Button variant="cyan" onClick={() => setTocando(a)}>Assistir</Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))
            )}

            {aulasLocais.length ? (
              <section aria-label="Aulas locais">
                <div style={{ marginBottom: ".4rem" }}>
                  <strong style={{ display: "block", fontSize: ".9rem" }}>Aulas locais (só neste aparelho)</strong>
                  <span className="hg-sub">Guardadas antes da Academy usar o banco — não aparecem em outro dispositivo.</span>
                </div>
                <ul className="hg-cursos">
                  {aulasLocais.map((a) => (
                    <li key={a.id}>
                      <span className="hg-cursos-ico">{a.thumb ? <img src={a.thumb} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} /> : <Icon name="revista" />}</span>
                      <div>
                        <strong>{a.titulo}</strong>
                        <span>{a.plataforma === "youtube" ? "YouTube" : "Panda Video"}{a.nivel ? " · nível sugerido: " + a.nivel : ""}</span>
                        {a.resumo ? <p style={{ fontSize: ".78rem", opacity: .75, margin: ".25rem 0 0" }}>{a.resumo}</p> : null}
                      </div>
                      <div style={{ display: "flex", gap: ".4rem" }}>
                        <Button variant="cyan" onClick={() => setTocando({ ...a, youtube_id: a.plataforma === "youtube" ? a.id : null, embedUrlLocal: a.embedUrl })}>Assistir</Button>
                        {admin ? <Button variant="ghost" onClick={() => apagarAulaLocal(a.id)}>Remover</Button> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </Panel>
        <Panel tone="conquistas" fill title="Como funciona" headingLevel={3}>
          <ProgressRing value={totalAulas ? 100 : 0} label="trilhas publicadas" />
          <p className="hg-sub" style={{ textAlign: "center" }}>{admin ? "Cole um link de vídeo ou de canal — o Reino organiza a trilha sozinho." : "Assistir às aulas conta pontos para a sua guilda."}</p>
        </Panel>
      </div>

      {tocando ? (
        <div role="dialog" aria-modal="true" onClick={() => setTocando(null)} style={{ position: "fixed", inset: 0, background: "rgba(4,8,16,.82)", display: "grid", placeItems: "center", zIndex: 60, padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(880px, 100%)", background: "#0b1220", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              <iframe
                src={tocando.youtube_id ? "https://www.youtube-nocookie.com/embed/" + tocando.youtube_id : tocando.embedUrlLocal}
                title={tocando.titulo} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
            </div>
            <div style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                <strong style={{ fontSize: "1rem" }}>{tocando.titulo}</strong>
                <Button variant="ghost" onClick={() => setTocando(null)}>Fechar</Button>
              </div>
              {tocando.descricao ? <p style={{ fontSize: ".85rem", opacity: .8, marginTop: ".4rem" }}>{tocando.descricao}</p> : null}
              {tocando.nivel ? <span style={{ fontSize: ".75rem", opacity: .6 }}>Nível sugerido: {tocando.nivel}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

Object.assign(window, { AcademyScreen });
})();
