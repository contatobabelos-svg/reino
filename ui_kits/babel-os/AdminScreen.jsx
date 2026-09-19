
/* Contas no banco — lê de verdade o Supabase (perfis, codigos, cliques, cadastros)
   e deixa o administrador aprovar ou recusar quem acabou de se cadastrar.
   Sem chave configurada, avisa em vez de inventar dados. */
(() => {
const { PageHead, Panel, Button, Input, KpiCard, Avatar, EmptyState } = window.BabelOSDesignSystem_5ad360;
const quando = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); };
const th = { textAlign: "left", padding: ".5rem .7rem", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em", opacity: .62, whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,.14)" };
const td = { padding: ".6rem .7rem", fontSize: ".86rem", borderBottom: "1px solid rgba(255,255,255,.07)", verticalAlign: "middle", whiteSpace: "nowrap" };
const PENDENTE = { aguardando: 1, "pre-cadastro": 1 };
const COR = { admin: { cor: "#ffd97a", borda: "rgba(255,217,122,.45)" }, membro: { cor: "#7ef2b0", borda: "rgba(126,242,176,.4)" }, aguardando: { cor: "#7ad7ff", borda: "rgba(122,215,255,.45)" }, recusado: { cor: "#ff9aa8", borda: "rgba(255,154,168,.4)" } };
const rotulo = { aguardando: "aguardando aprovação", "pre-cadastro": "aguardando aprovação", membro: "aprovado", admin: "administrador", recusado: "recusado" };

function Selo({ s }) {
  const c = COR[s] || COR[PENDENTE[s] ? "aguardando" : ""] || null;
  return <b className="hg-pill" style={c ? { color: c.cor, borderColor: c.borda } : undefined}>{rotulo[s] || s || "—"}</b>;
}

function AdminScreen() {
  const cfg = window.REINO_SUPABASE;
  const online = !!(cfg && cfg.url && cfg.anon);
  const [dados, setDados] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busca, setBusca] = React.useState("");
  const [recarga, setRecarga] = React.useState(0);
  const [mexendo, setMexendo] = React.useState(null);

  const base = online ? cfg.url.replace(/\/$/, "") + "/rest/v1/" : "";
  const cab = online ? { apikey: cfg.anon, Authorization: "Bearer " + cfg.anon } : null;

  React.useEffect(() => {
    if (!online) return;
    let vivo = true;
    const pega = (q) => fetch(base + q, { headers: cab }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([
      pega("perfis?select=*&order=criado_em.desc"),
      pega("codigos?select=codigo,user_id,nome"),
      pega("cliques?select=codigo,cadastrou"),
      pega("cadastros?select=codigo,nome,email,titulo,cidade,uf,criado_em&order=criado_em.desc"),
    ]).then(([perfis, codigos, cliques, cadastros]) => {
      if (!vivo) return;
      if (!Array.isArray(perfis)) return setErro("Não foi possível ler a tabela perfis.");
      const porUser = {}; (codigos || []).forEach((c) => { porUser[c.user_id] = c.codigo; });
      const stat = {}; (cliques || []).forEach((c) => { const s = stat[c.codigo] || (stat[c.codigo] = { cliques: 0, cadastros: 0 }); s.cliques++; if (c.cadastrou) s.cadastros++; });
      setDados({ perfis, porUser, stat, cadastros: Array.isArray(cadastros) ? cadastros : [] });
    });
    return () => { vivo = false; };
  }, [online, recarga]);

  const decidir = async (p, nova) => {
    setMexendo(p.id);
    try {
      const r = await fetch(base + "perfis?id=eq." + p.id, { method: "PATCH", headers: { ...cab, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ situacao: nova }) });
      if (!r.ok) throw new Error(await r.text());
      setDados((d) => ({ ...d, perfis: d.perfis.map((x) => (x.id === p.id ? { ...x, situacao: nova } : x)) }));
    } catch (e) { setErro("Não foi possível gravar a mudança. " + String(e.message || e).slice(0, 120)); }
    setMexendo(null);
  };

  const cabeca = <PageHead title="Contas no banco" subtitle="Quem já criou conta de verdade no Reino — lido direto do Supabase." />;
  if (!online) return <>{cabeca}<Panel fill><EmptyState icon="alerta" title="Banco não conectado" description="Cole a URL e a chave publicável do Supabase em window.REINO_SUPABASE para ver as contas reais." /></Panel></>;
  if (!dados) return erro
    ? <>{cabeca}<Panel fill><EmptyState icon="alerta" title="Leitura bloqueada" description={erro + " Confira as políticas de leitura (RLS) em afiliados.sql."} /></Panel></>
    : <PageHead title="Contas no banco" subtitle="Carregando…" />;

  const t = busca.trim().toLowerCase();
  const casa = (p) => !t || [p.nome, p.email, p.cidade, p.uf, dados.porUser[p.id]].some((v) => String(v || "").toLowerCase().includes(t));
  const pendentes = dados.perfis.filter((p) => PENDENTE[p.situacao] && casa(p));
  const resto = dados.perfis.filter((p) => !PENDENTE[p.situacao] && casa(p));
  const aprovados = dados.perfis.filter((p) => p.situacao === "membro" || p.situacao === "admin").length;

  const Linha = ({ p, acoes }) => {
    const cod = dados.porUser[p.id];
    const s = (cod && dados.stat[cod]) || { cliques: 0, cadastros: 0 };
    return (
      <tr>
        <td style={td}>
          <div style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
            <Avatar name={p.nome || p.email || "?"} />
            <div style={{ display: "grid", lineHeight: 1.25 }}>
              <strong>{p.nome || "sem nome"}</strong>
              <span style={{ fontSize: ".76rem", opacity: .6 }}>{p.email || "—"}</span>
            </div>
          </div>
        </td>
        <td style={td}><Selo s={p.situacao} /></td>
        <td style={td}>{p.cidade ? p.cidade + (p.uf ? " · " + p.uf : "") : "—"}</td>
        <td style={td}>{cod ? <code>{cod}</code> : <span style={{ opacity: .4 }}>—</span>}</td>
        <td style={td}>{s.cliques}</td>
        <td style={td}>{s.cadastros}</td>
        <td style={{ ...td, opacity: .7 }}>{quando(p.criado_em)}</td>
        {acoes ? (
          <td style={td}>
            <div style={{ display: "flex", gap: ".4rem" }}>
              <Button variant="green" disabled={mexendo === p.id} onClick={() => decidir(p, "membro")}>{mexendo === p.id ? "…" : "Aprovar"}</Button>
              <Button variant="ghost" disabled={mexendo === p.id} onClick={() => decidir(p, "recusado")}>Recusar</Button>
            </div>
          </td>
        ) : null}
      </tr>
    );
  };

  return (
    <>
      <PageHead title="Contas no banco" subtitle="Quem já criou conta de verdade no Reino — lido direto do Supabase.">
        <div className="hg-head-acoes"><Button variant="ghost" icon="rota" onClick={() => { setDados(null); setErro(null); setRecarga((n) => n + 1); }}>Atualizar</Button></div>
      </PageHead>

      {erro ? <p className="hg-af-aviso">{erro}</p> : null}

      <section className="hg-kpis" aria-label="Resumo das contas">
        <KpiCard label="Aguardando aprovação" value={String(dados.perfis.filter((p) => PENDENTE[p.situacao]).length)} foot="esperando você" />
        <KpiCard label="Aprovados" value={String(aprovados)} foot="membros e admins" />
        <KpiCard label="Contas criadas" value={String(dados.perfis.length)} foot="tabela perfis" />
        <KpiCard label="Cadastros por link" value={String(dados.cadastros.length)} foot="tabela cadastros" />
      </section>

      <Panel tone="afiliado" title="Esperando aprovação" subtitle={pendentes.length ? pendentes.length + " conta(s) para você liberar" : "Nada na fila."} headingLevel={3}>
        {!pendentes.length ? <EmptyState icon="clientes" title="Fila vazia" description="Toda conta nova aparece aqui até você aprovar." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Pessoa</th><th style={th}>Situação</th><th style={th}>Cidade</th><th style={th}>Código</th><th style={th}>Cliques</th><th style={th}>Cadastros</th><th style={th}>Criada em</th><th style={th}>Decisão</th></tr></thead>
              <tbody>{pendentes.map((p) => <Linha key={p.id} p={p} acoes />)}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Todas as contas" subtitle={resto.length + " já decidida(s)"} headingLevel={3}
        actions={<Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, e-mail, cidade ou código" aria-label="Buscar conta" />}>
        {!resto.length ? <EmptyState icon="clientes" title="Nenhuma conta aqui" description={dados.perfis.length ? "Nada casa com a busca." : "Crie a primeira conta pela tela de cadastro."} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Pessoa</th><th style={th}>Situação</th><th style={th}>Cidade</th><th style={th}>Código</th><th style={th}>Cliques</th><th style={th}>Cadastros</th><th style={th}>Criada em</th></tr></thead>
              <tbody>{resto.map((p) => <Linha key={p.id} p={p} />)}</tbody>
            </table>
          </div>
        )}
      </Panel>

      {dados.cadastros.length ? (
        <Panel title="Cadastros que entraram por link" subtitle="Tabela cadastros — quem veio de um código de afiliado." headingLevel={3}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Título</th><th style={th}>Cidade</th><th style={th}>Veio de</th><th style={th}>Quando</th></tr></thead>
              <tbody>
                {dados.cadastros.map((c, i) => (
                  <tr key={i}>
                    <td style={td}><strong>{c.nome || "—"}</strong></td>
                    <td style={td}>{c.email || "—"}</td>
                    <td style={td}>{c.titulo || "—"}</td>
                    <td style={td}>{c.cidade ? c.cidade + (c.uf ? " · " + c.uf : "") : "—"}</td>
                    <td style={td}>{c.codigo ? <code>{c.codigo}</code> : <span style={{ opacity: .4 }}>direto</span>}</td>
                    <td style={{ ...td, opacity: .7 }}>{quando(c.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </>
  );
}

Object.assign(window, { AdminScreen });
})();
