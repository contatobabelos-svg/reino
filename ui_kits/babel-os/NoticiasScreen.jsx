/* Reino · Notícias do Reino — manchetes reais buscadas na hora pela Edge Function
   reino-apis (rota "noticias"), que consulta o Google Notícias. Funciona sem login
   (dado público); só a chave publicável do Supabase viaja pelo navegador. */
(() => {
const { PageHead, Panel, Button, EmptyState } = window.BabelOSDesignSystem_5ad360;
const FUNC_URL = "https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis";

/* temas sem acento: a busca do Google Notícias é mais confiável assim */
const TEMAS = [
  { valor: "", rotulo: "Manchetes" },
  { valor: "negocios", rotulo: "Negócios" },
  { valor: "empreendedorismo", rotulo: "Empreendedorismo" },
  { valor: "tecnologia", rotulo: "Tecnologia" },
  { valor: "mercado", rotulo: "Mercado" },
  { valor: "varejo", rotulo: "Varejo" },
];

function tempoRelativo(dataStr) {
  if (!dataStr) return null;
  const t = new Date(dataStr);
  if (isNaN(t)) return null;
  const min = Math.round((Date.now() - t.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return "há " + min + " min";
  const h = Math.round(min / 60);
  if (h < 24) return "há " + h + "h";
  return "há " + Math.round(h / 24) + "d";
}

function CartaoNoticia({ n }) {
  return (
    <a href={n.link} target="_blank" rel="noopener noreferrer"
      style={{ display: "grid", gap: ".4rem", padding: ".9rem", borderRadius: 14, background: "var(--surface-row)", border: "1px solid var(--border-soft)", color: "inherit", textDecoration: "none" }}>
      <strong style={{ fontSize: ".92rem", lineHeight: 1.35 }}>{n.titulo}</strong>
      <span style={{ fontSize: ".74rem", opacity: .6 }}>{[n.fonte, tempoRelativo(n.publicado)].filter(Boolean).join(" · ")}</span>
    </a>
  );
}

function NoticiasScreen() {
  const [tema, setTema] = React.useState("");
  const [itens, setItens] = React.useState(null); // null = carregando
  const [erro, setErro] = React.useState(null);
  const [carregando, setCarregando] = React.useState(false);

  const carregar = React.useCallback((t) => {
    setCarregando(true); setErro(null);
    fetch(FUNC_URL, {
      method: "POST",
      headers: { apikey: window.REINO_SUPABASE.anon, Authorization: "Bearer " + window.REINO_SUPABASE.anon, "Content-Type": "application/json" },
      body: JSON.stringify(t ? { rota: "noticias", tema: t } : { rota: "noticias" }),
    })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "Não foi possível buscar as notícias agora."); return j; })
      .then((j) => setItens(j.itens || []))
      .catch((err) => { setErro(err.message); setItens([]); })
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => { carregar(tema); }, [tema, carregar]);

  return (
    <>
      <PageHead title="Notícias do Reino" subtitle="Manchetes reais, buscadas na hora no Google Notícias." />
      <Panel fill title="Manchetes" subtitle={carregando ? "Atualizando…" : (itens ? itens.length + " manchete(s)" : "Carregando…")}
        actions={<Button variant="ghost" icon="rota" onClick={() => carregar(tema)} disabled={carregando}>{carregando ? "Atualizando…" : "Atualizar"}</Button>}>
        <div className="hg-rolar" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div role="tablist" aria-label="Tema das notícias" style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {TEMAS.map((t) => (
              <button key={t.valor} type="button" role="tab" aria-selected={tema === t.valor} onClick={() => setTema(t.valor)}
                className="hg-pill" style={tema === t.valor ? { color: "var(--cyan)", borderColor: "var(--cyan)" } : undefined}>
                {t.rotulo}
              </button>
            ))}
          </div>

          {itens === null ? (
            <p className="hg-sub">Buscando manchetes…</p>
          ) : erro ? (
            <EmptyState icon="alerta" title="Notícias indisponíveis" description={erro} />
          ) : !itens.length ? (
            <EmptyState icon="noticias" title="Nada por aqui" description="Esse tema não trouxe manchetes agora. Tente outro ou atualize." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: ".8rem" }}>
              {itens.map((n, i) => <CartaoNoticia key={n.link || i} n={n} />)}
            </div>
          )}

          <p className="hg-sub" style={{ margin: 0 }}>Fonte: Google Notícias</p>
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { NoticiasScreen });
})();
