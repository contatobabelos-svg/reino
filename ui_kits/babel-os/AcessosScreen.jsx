const { PageHead, Panel, Button, Input, KpiCard, Pill, Avatar, Icon, LineChart, EmptyState, AffiliateLevel } = window.BabelOSDesignSystem_5ad360;

/* Meus acessos — painel REAL do afiliado (afiliados.js + Supabase).
   Link /r/<codigo>: cliques, cadastros com cidade/UF/título/dispositivo, comissão
   por título, gráfico por dia e ranking. Sem Supabase configurado, mostra o que
   este navegador registrou e avisa. */
const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const quando = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };

function AcessosScreen() {
  const d = window.BABEL_DEMO;
  const A = window.ReinoAfiliados;
  const codigo = A.meuCodigo(d.perfil.nome);
  const [p, setP] = React.useState(null);
  const [copiado, setCopiado] = React.useState(false);
  const [aba, setAba] = React.useState("todos");
  const carregar = React.useCallback(() => A.painel(codigo).then(setP), [codigo]);
  React.useEffect(() => { carregar(); }, [carregar]);
  const copiar = async () => { try { await navigator.clipboard.writeText(p.link); setCopiado(true); setTimeout(() => setCopiado(false), 1600); } catch (e) {} };
  const compartilhar = () => { if (navigator.share) navigator.share({ title: "Entre no Reino", text: "Vem para o Reino pelo meu link:", url: p.link }).catch(() => {}); else copiar(); };
  if (!p) return <PageHead title="Meus acessos e estatísticas" subtitle="Carregando…" />;
  // cadastros podem vir de cliques não contados (outra sessão): a conversão não passa de 100%
  const conv = p.cliques.length ? Math.min(100, Math.round((p.cadastros.length / Math.max(p.cliques.length, p.cadastros.length)) * 100)) : null;
  const nivel = p.cadastros.length >= 10 ? "Ouro" : p.cadastros.length >= 3 ? "Prata" : "Bronze";
  const proximo = p.cadastros.length >= 10 ? "nível máximo" : "faltam " + ((p.cadastros.length >= 3 ? 10 : 3) - p.cadastros.length) + " para " + (p.cadastros.length >= 3 ? "Ouro" : "Prata");
  const porTitulo = Object.entries(p.cadastros.reduce((m, c) => { const t = c.titulo || "Sem título"; m[t] = (m[t] || 0) + 1; return m; }, {})).sort((a, b) => (A.COMISSAO[b[0]] || 0) - (A.COMISSAO[a[0]] || 0));
  const lista = aba === "cadastrou" ? p.cadastros.map((c) => ({ ...c, tipo: "cadastro" })) : aba === "clicou" ? p.cliques.filter((c) => !c.cadastrou).map((c) => ({ ...c, tipo: "clique" }))
    : [...p.cadastros.map((c) => ({ ...c, tipo: "cadastro" })), ...p.cliques.filter((c) => !c.cadastrou).map((c) => ({ ...c, tipo: "clique" }))].sort((a, b) => (b.criado_em || "").localeCompare(a.criado_em || ""));
  return (
    <>
      <PageHead title="Meus acessos e estatísticas" subtitle="Quem clicou no seu link, quem se cadastrou e quanto isso rendeu.">
        <div className="hg-head-acoes"><AffiliateLevel level={nivel} indicados={p.cadastros.length} proximo={proximo} progress={Math.min(100, (p.cadastros.length / 10) * 100)} compact /></div>
      </PageHead>

      {!p.online ? <p className="hg-af-aviso"><Icon name="alerta" />Banco ainda não conectado: os registros ficam só neste navegador. Cole a chave do Supabase em <code>index.html</code> (veja <code>afiliados.sql</code>).</p> : null}

      <Panel tone="afiliado" title="Seu link de afiliado" subtitle="Quem entrar por ele fica ligado a você para sempre." headingLevel={3}>
        <div className="hg-af-link">
          <Input readOnly value={p.link} aria-label="Seu link" onFocus={(e) => e.target.select()} />
          <Button variant="green" icon="link" onClick={copiar}>{copiado ? "Copiado!" : "Copiar"}</Button>
          <Button variant="ghost" icon="rota" onClick={compartilhar}>Compartilhar</Button>
        </div>
        <p className="hg-sub" style={{ marginTop: ".5rem" }}>Código <b style={{ color: "#fff" }}>{p.codigo}</b>{p.rotaR ? <> · também funciona como <code>?ref={p.codigo}</code></> : <> · com domínio próprio o link fica curto: <code>{p.linkCurto}</code> (precisa do <code>vercel.json</code>)</>}</p>
      </Panel>

      <section className="hg-kpis" aria-label="Resumo">
        <KpiCard label="Cliques no link" value={p.cliques.length.toLocaleString("pt-BR")} foot="total" />
        <KpiCard label="Cadastros" value={p.cadastros.length.toLocaleString("pt-BR")} foot="pelo seu link" />
        <KpiCard label="Conversão" value={conv == null ? undefined : conv} suffix={conv == null ? undefined : "%"} empty={conv == null} foot={conv == null ? "sem cliques ainda" : "cliques → cadastros"} />
        <KpiCard label="Comissão" value={brl(p.comissao)} foot={Math.round(A.PCT * 100) + "% da 1ª mensalidade"} size="1.4rem" />
      </section>

      <div className="hg-duas">
        <Panel tone="reputacao" title="Indicações por dia" subtitle="Últimos 14 dias · cadastros" headingLevel={3}>
          {p.porDia.some((x) => x.cadastros || x.cliques) ? (
            <LineChart points={p.porDia.map((x) => x.cadastros)} labels={p.porDia.map((x) => x.dia.slice(8) + "/" + x.dia.slice(5, 7))} highlight={String(p.porDia[p.porDia.length - 1].cadastros)} />
          ) : <EmptyState icon="grafico" title="Nenhuma indicação ainda" description="Compartilhe seu link: cada cadastro aparece aqui no mesmo dia." />}
        </Panel>
        <Panel title="Comissão por título" subtitle="Quanto cada título escolhido pelos indicados rende" headingLevel={3}>
          {porTitulo.length ? (
            <ul className="hg-af-titulos">
              {porTitulo.map(([t, n]) => (
                <li key={t}><span className="hg-af-coroa"><Icon name="coroa" /></span><div><strong>{t}</strong><span>{n} {n === 1 ? "indicado" : "indicados"} · {brl(A.COMISSAO[t] || 0)}/mês cada</span></div><b>{brl((A.COMISSAO[t] || 0) * A.PCT * n)}</b></li>
              ))}
            </ul>
          ) : <p className="hg-sub">Imperador {brl(997)} · Rei {brl(497)} · Príncipe {brl(247)} · Duque {brl(97)} · Marquês {brl(77)} · Conde {brl(67)} · Visconde {brl(57)} · Barão {brl(47)}. Você recebe {Math.round(A.PCT * 100)}% da primeira mensalidade de cada indicado.</p>}
        </Panel>
      </div>

      <div className="hg-duas">
        <Panel fill title="Indicados" subtitle={p.cadastros.length + " cadastraram · " + p.cliques.filter((c) => !c.cadastrou).length + " só clicaram"} headingLevel={3}
          actions={<div className="hg-tabs" role="tablist">{[["todos", "Todos"], ["cadastrou", "Cadastrou"], ["clicou", "Clicou"]].map(([v, r]) => <button key={v} role="tab" aria-selected={aba === v} onClick={() => setAba(v)}>{r}</button>)}</div>}>
          {lista.length ? (
            <ul className="hg-list">
              {lista.slice(0, 50).map((c) => (
                <li className="hg-row" key={c.id}>
                  <Avatar name={c.tipo === "cadastro" ? c.nome : "?"} gradient={c.tipo === "cadastro" ? "brand" : undefined} />
                  <div>
                    <strong>{c.tipo === "cadastro" ? c.nome : "Visitante"}</strong>
                    <span>{c.tipo === "cadastro" ? [c.titulo, [c.cidade, c.uf].filter(Boolean).join(" · "), c.dispositivo].filter(Boolean).join(" · ") : ["clicou no link", [c.cidade, c.uf].filter(Boolean).join(" · ") || null, c.dispositivo, c.origem ? "vindo de " + new URL(c.origem).hostname : null].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div style={{ display: "grid", justifyItems: "end", gap: ".2rem" }}>
                    <Pill as="span" className={c.tipo === "cadastro" ? "" : "is-fraca"}>{c.tipo === "cadastro" ? "cadastrou" : "clicou"}</Pill>
                    <time className="hg-sub">{quando(c.criado_em)}</time>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon="link" title="Ninguém entrou pelo seu link ainda" description="Copie o link acima e mande para quem você quer trazer para o Reino." />}
        </Panel>
        <Panel title="Ranking de afiliados" subtitle="Quem mais trouxe gente para o Reino" headingLevel={3}>
          {p.ranking.length ? (
            <ol className="hg-titulos">
              {p.ranking.map((r, i) => (
                <li key={r.codigo}><span className="hg-rank">{i + 1}</span><div><strong className={r.codigo === p.codigo ? "hg-gold" : ""}>{r.codigo}{r.codigo === p.codigo ? " (você)" : ""}</strong><span>{r.cadastros} {r.cadastros === 1 ? "cadastro" : "cadastros"}</span></div><b>{brl(r.cadastros * 97 * A.PCT)}+</b></li>
              ))}
            </ol>
          ) : <p className="hg-sub">{p.online ? "O ranking aparece quando houver cadastros." : "O ranking compara todos os afiliados e precisa do banco conectado."}</p>}
        </Panel>
      </div>
    </>
  );
}

Object.assign(window, { AcessosScreen });
