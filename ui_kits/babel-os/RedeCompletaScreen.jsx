const { PageHead, Panel, Button, Input, Select, Icon, Stars, Pill, Avatar, EmptyState } = window.BabelOSDesignSystem_5ad360;

/* Rede Completa — todas as empresas do Reino como cartões.
   Toque num cartão para expandir: reputação, guilda, posição no ranking,
   conexões (empresas do mesmo nicho/cidade) e "Ver no mapa" (voa até a cidade). */
const GUILDA_POR_REGIAO = { Sudeste: "Guilda Paulista", Sul: "Guilda Araucária", "Centro-Oeste": "Guilda Planalto", Nordeste: "Guilda do Nordeste", Norte: "Guilda da Amazônia" };
const TITULO_POR_ABR = { Nacional: "Rei", Regional: "Príncipe", Estadual: "Duque", Local: "Conde" };
const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");

function RedeCompletaScreen({ ir }) {
  const d = window.BABEL_DEMO;
  const [q, setQ] = React.useState("");
  const [regiao, setRegiao] = React.useState("");
  const [nicho, setNicho] = React.useState("");
  const [ordem, setOrdem] = React.useState("nota");
  const [aberta, setAberta] = React.useState(null);
  const [limite, setLimite] = React.useState(24);
  /* 15 mil empresas na demonstração: o ranking é calculado uma vez e a lista mostra até 24 por vez */
  const base = React.useMemo(() => (window.BabelDemo ? window.BabelDemo("reino/empresas", {}) : []), []);
  const total = base.length;
  const nichos = React.useMemo(() => [...new Set(base.map((e) => e.nicho).filter(Boolean))].sort(), [base]);
  // ranking geral por nota e volume de avaliações (posição estável)
  const ordenadas = React.useMemo(() => {
    // chave numérica pré-calculada: ordena 15 mil itens uma única vez, sem comparador caro
    const ks = base.map((e, i) => [(e.nota || 0) * 1000 + Math.min(999, e.avaliacoes || 0), i]);
    ks.sort((a, b) => b[0] - a[0]);
    const ord = new Array(ks.length); const pos = {};
    for (let r = 0; r < ks.length; r++) { const e = base[ks[r][1]]; ord[r] = e; pos[e.id] = r + 1; }
    return { ord, pos };
  }, [base]);
  const ranking = ordenadas.pos;
  const lista = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    const fonte = ordem === "nota" ? ordenadas.ord : base;
    const f = fonte.filter((e) => (!t || (e.nome || "").toLowerCase().includes(t) || (e.cidade || "").toLowerCase().includes(t)) && (!regiao || e.regiao === regiao) && (!nicho || e.nicho === nicho));
    if (ordem === "avaliacoes") f.sort((a, b) => (b.avaliacoes || 0) - (a.avaliacoes || 0));
    else if (ordem === "nome") f.sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));
    return f;
  }, [base, q, regiao, nicho, ordem, ordenadas]);
  React.useEffect(() => { setLimite(24); }, [q, regiao, nicho, ordem]);
  React.useEffect(() => { if (window.ReinoFotos) window.ReinoFotos.sincronizar(lista.slice(0, limite).map((e) => e.id)); }, [lista, limite]);

  const conexoes = (e) => { const out = []; for (const x of base) { if (x.id !== e.id && ((x.nicho === e.nicho && x.uf === e.uf) || x.cidade === e.cidade)) { out.push(x); if (out.length === 4) break; } } return out; };
  const verNoMapa = (e) => { window.__destinoMapa = { uf: e.uf, cidade: e.cidade, bairro: e.bairro }; ir("mapa.html"); };
  const regioes = d.regioes.map((r) => r.nome);

  return (
    <>
      <PageHead title="Rede Completa" subtitle={fmt(total) + " empresas em todo o Reino, por região, nicho e reputação."}>
        <div className="hg-head-acoes">
          <Pill as="span"><Icon name="social" size={13} /> {fmt(lista.length)} de {fmt(total)}</Pill>
        </div>
      </PageHead>

      <div className="hg-rc-filtros" role="search">
        <label className="hg-rc-busca"><Icon name="busca" /><Input type="search" placeholder="Empresa ou cidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" /></label>
        <div className="hg-rc-chips" aria-label="Região">
          <button type="button" aria-pressed={!regiao} onClick={() => setRegiao("")}>Todas</button>
          {regioes.map((r) => <button key={r} type="button" aria-pressed={regiao === r} onClick={() => setRegiao(regiao === r ? "" : r)}>{r}</button>)}
        </div>
        <div className="hg-rc-linha">
          <Select value={nicho} onChange={(e) => setNicho(e.target.value)} aria-label="Nicho"><option value="">Todos os nichos</option>{nichos.map((n) => <option key={n}>{n}</option>)}</Select>
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar"><option value="nota">Melhor reputação</option><option value="avaliacoes">Mais avaliadas</option><option value="nome">Nome A–Z</option></Select>
        </div>
      </div>

      {lista.length === 0 ? (
        <Panel><EmptyState icon="social" title="Nenhuma empresa encontrada" description="Ajuste a busca, a região ou o nicho." /></Panel>
      ) : (
        <div className="hg-rc-grade">
          {lista.slice(0, limite).map((e, i) => {
            const on = aberta === e.id;
            const pos = ranking[e.id];
            const guilda = GUILDA_POR_REGIAO[e.regiao] || "Sem guilda";
            const titulo = TITULO_POR_ABR[e.abrangencia] || "Barão";
            const con = on ? conexoes(e) : [];
            return (
              <article key={e.id} className={"hg-rc-card" + (on ? " is-aberto" : "") + (pos <= 3 ? " is-top" : "")} style={{ "--i": i % 24 }}>
                <button type="button" className="hg-rc-topo" onClick={() => setAberta(on ? null : e.id)} aria-expanded={on}>
                  <span className="hg-rc-pos" title={"Posição no ranking do Reino"}>{pos <= 3 ? <Icon name="coroa" /> : null}#{pos}</span>
                  <FotoAvatar chave={e.id} nome={e.nome} gradient={pos <= 3 ? "match" : "brand"} size={44} editavel />
                  <div className="hg-rc-txt">
                    <strong>{e.nome}</strong>
                    <span>{e.nicho} · {e.cidade} · {e.uf}</span>
                    <span className="hg-rc-nota"><Stars value={e.nota} /><b>{Number(e.nota || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b><small>({fmt(e.avaliacoes)})</small></span>
                  </div>
                  <Icon name="mais" />
                </button>
                {on ? (
                  <div className="hg-rc-detalhe">
                    <dl className="hg-rc-fatos">
                      <div><dt><Icon name="guilda" />Guilda</dt><dd>{guilda}</dd></div>
                      <div><dt><Icon name="coroa" />Título</dt><dd>{titulo} · {e.abrangencia}</dd></div>
                      <div><dt><Icon name="trofeu" />Posição</dt><dd>#{pos} de {fmt(total)}</dd></div>
                      <div><dt><Icon name="estrela" />Reputação</dt><dd>{Number(e.nota || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} em {fmt(e.avaliacoes)} avaliações</dd></div>
                    </dl>
                    <div className="hg-rc-con">
                      <p className="hg-globo-sobre">Conexões · {con.length}</p>
                      {con.length ? (
                        <ul>{con.map((c) => (
                          <li key={c.id}><button type="button" onClick={() => setAberta(c.id)}><FotoAvatar chave={c.id} nome={c.nome} size={26} /><span>{c.nome}</span><small>{c.nicho === e.nicho ? "mesmo nicho" : "mesma cidade"}</small></button></li>
                        ))}</ul>
                      ) : <p className="hg-sub">Ainda sem conexões próximas.</p>}
                    </div>
                    <div className="hg-rc-acoes">
                      <Button variant="cyan" icon="mapa" onClick={() => verNoMapa(e)}>Ver no mapa</Button>
                      <Button variant="ghost" icon="match" onClick={() => ir("chat.html")}>Fazer network</Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      {lista.length > limite ? (
        <div className="hg-rc-mais"><Button variant="ghost" onClick={() => setLimite((n) => n + 24)}>Mostrar mais {fmt(Math.min(24, lista.length - limite))} de {fmt(lista.length - limite)}</Button></div>
      ) : null}
    </>
  );
}

Object.assign(window, { RedeCompletaScreen });
