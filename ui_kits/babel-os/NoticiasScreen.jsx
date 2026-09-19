/* Reino · Notícias do Reino — manchetes reais buscadas na hora pela Edge Function
   reino-apis (rota "noticias"), que consulta o Google Notícias. Funciona sem login
   (dado público); só a chave publicável do Supabase viaja pelo navegador.
   Cara de portal de jornal: manchete principal grande, "Mais lidas" numerada ao
   lado e o resto em grade — tudo em tipografia e filetes (o RSS não traz foto). */
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

// data de hoje por extenso, em pt-BR, com a primeira letra maiúscula
function dataPorExtenso() {
  const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Manchete({ n }) {
  return (
    <article className="hg-jornal-manchete">
      <span className="hg-jornal-kicker">{n.fonte || "Reino"}</span>
      <h2><a href={n.link} target="_blank" rel="noopener noreferrer">{n.titulo}</a></h2>
      <time>{tempoRelativo(n.publicado) || "agora"}</time>
    </article>
  );
}

function MaisLidas({ itens }) {
  if (!itens.length) return null;
  return (
    <aside className="hg-jornal-maislidas" aria-label="Mais lidas">
      <h3>Mais lidas</h3>
      <ol>
        {itens.map((n, i) => (
          <li key={n.link || i}><a href={n.link} target="_blank" rel="noopener noreferrer">{n.titulo}</a></li>
        ))}
      </ol>
    </aside>
  );
}

function CartaoGrade({ n }) {
  return (
    <article>
      <span className="hg-jornal-kicker">{n.fonte || "Reino"}</span>
      <h3><a href={n.link} target="_blank" rel="noopener noreferrer">{n.titulo}</a></h3>
      <time>{tempoRelativo(n.publicado) || "agora"}</time>
    </article>
  );
}

function NoticiasScreen() {
  const [tema, setTema] = React.useState("");
  const [itens, setItens] = React.useState(null); // null = carregando
  const [erro, setErro] = React.useState(null);
  const [carregando, setCarregando] = React.useState(false);
  const [atualizadoEm, setAtualizadoEm] = React.useState(horaAgora());

  const carregar = React.useCallback((t) => {
    setCarregando(true); setErro(null);
    fetch(FUNC_URL, {
      method: "POST",
      headers: { apikey: window.REINO_SUPABASE.anon, Authorization: "Bearer " + window.REINO_SUPABASE.anon, "Content-Type": "application/json" },
      body: JSON.stringify(t ? { rota: "noticias", tema: t } : { rota: "noticias" }),
    })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "Não foi possível buscar as notícias agora."); return j; })
      .then((j) => { setItens(j.itens || []); setAtualizadoEm(horaAgora()); })
      .catch((err) => { setErro(err.message); setItens([]); })
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => { carregar(tema); }, [tema, carregar]);

  const manchete = itens && itens[0];
  const secundarias = itens ? itens.slice(1, 3) : [];
  const maisLidas = itens ? itens.slice(3, 8) : [];
  const grade = itens ? itens.slice(8) : [];

  return (
    <>
      <PageHead title="Notícias do Reino" subtitle="Manchetes reais, buscadas na hora no Google Notícias." />
      <Panel fill
        actions={<Button variant="ghost" icon="rota" onClick={() => carregar(tema)} disabled={carregando}>{carregando ? "Atualizando…" : "Atualizar"}</Button>}>
        <div className="hg-rolar hg-jornal" style={{ display: "grid", gap: "1.1rem", gridTemplateColumns: "minmax(0, 1fr)" }}>
          <header className="hg-jornal-cabecalho">
            <div>
              <span className="hg-jornal-data">{dataPorExtenso()}</span>
            </div>
            <span className="hg-jornal-atualizado">Última atualização {atualizadoEm}</span>
          </header>

          <nav className="hg-jornal-editorias" role="tablist" aria-label="Editorias">
            {TEMAS.map((t) => (
              <button key={t.valor} type="button" role="tab" aria-selected={tema === t.valor} onClick={() => setTema(t.valor)}>
                {t.rotulo}
              </button>
            ))}
          </nav>

          {itens === null ? (
            <p className="hg-sub">Buscando manchetes…</p>
          ) : erro ? (
            <EmptyState icon="alerta" title="Notícias indisponíveis" description={erro} />
          ) : !itens.length ? (
            <EmptyState icon="noticias" title="Nada por aqui" description="Esse tema não trouxe manchetes agora. Tente outro ou atualize." />
          ) : (
            <>
              <div className="hg-jornal-corpo">
                <div className="hg-jornal-principal">
                  {manchete ? <Manchete n={manchete} /> : null}
                  {secundarias.length ? (
                    <div className="hg-jornal-secundarias">
                      {secundarias.map((n, i) => <CartaoGrade key={n.link || i} n={n} />)}
                    </div>
                  ) : null}
                </div>
                <MaisLidas itens={maisLidas} />
              </div>
              {grade.length ? (
                <div className="hg-jornal-grade">
                  {grade.map((n, i) => <CartaoGrade key={n.link || i} n={n} />)}
                </div>
              ) : null}
            </>
          )}

          <p className="hg-sub" style={{ margin: 0 }}>Fonte: Google Notícias</p>
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { NoticiasScreen });
})();
