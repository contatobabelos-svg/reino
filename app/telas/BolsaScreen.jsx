const { Panel, Button, Input, Select, Toolbar, KpiCard, TickerTape, MarketStatus, StockRow, Sparkline, Drawer } = window.BabelOSDesignSystem_5ad360;

const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n) => (n > 0 ? "+" : "") + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
const compacto = (n) => Number(n).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function BolsaScreen() {
  const d = window.BABEL_DEMO;
  const [ordem, setOrdem] = React.useState("variacao");
  const [aberto, setAberto] = React.useState(null);
  const ativos = React.useMemo(() => d.ativos.slice().sort((a, b) =>
    ordem === "valor" ? b.value - a.value : ordem === "volume" ? b.volume - a.volume : ordem === "nome" ? a.symbol.localeCompare(b.symbol) : b.changePercent - a.changePercent), [ordem]);
  const porVar = d.ativos.slice().sort((a, b) => b.changePercent - a.changePercent);
  const altas = d.ativos.filter((a) => a.changePercent > 0).length;
  const baixas = d.ativos.filter((a) => a.changePercent < 0).length;
  const volume = d.ativos.reduce((s, a) => s + a.volume, 0);
  const maxAbs = Math.max(...d.ativos.map((a) => Math.abs(a.changePercent)));
  const a = aberto ? d.ativos.find((x) => x.symbol === aberto) : null;

  return (
    <>
      <TickerTape items={d.ativos} onSelect={setAberto} />
      <section className="hg-bolsa-hero" aria-label="BabelCoin">
        <img src="assets/babelcoin-banner.webp" alt="BabelCoin — Beyond Borders" width="1374" height="750" />
        <div className="hg-bolsa-hero-info">
          <div><h1>Bolsa de Valores</h1><p>Ações, FIIs, ETFs e BDRs da B3 · Atualizado às 15:42 · próxima em 15s</p></div>
          <MarketStatus open />
        </div>
      </section>
      <p className="hg-bolsa-aviso">⚠ Cotações <b>fictícias</b> de demonstração. Defina <code>HGBRASIL_KEY</code> no servidor para ver a B3 real.</p>

      <section className="hg-kpis" aria-label="Destaques do dia">
        <KpiCard label="Maior alta" value={porVar[0].symbol} size="1.9rem" foot={<><b>{pct(porVar[0].changePercent)}</b> · {brl(porVar[0].value)}</>} />
        <KpiCard label="Maior baixa" value={porVar[porVar.length - 1].symbol} size="1.9rem"
          foot={<><b className="is-down">{pct(porVar[porVar.length - 1].changePercent)}</b> · {brl(porVar[porVar.length - 1].value)}</>} />
        <KpiCard label="Volume da lista" value={compacto(volume)} size="1.9rem" foot="ações negociadas hoje" />
        <article className="hg-panel hg-kpi">
          <div className="hg-head"><span className="hg-kpi-label">Sentimento</span></div>
          <div className="hg-bolsa-sentimento"><b className="is-alta">{altas}</b> em alta · <b className="is-baixa">{baixas}</b> em baixa</div>
          <div className="hg-bolsa-barra"><i style={{ width: (altas / d.ativos.length) * 100 + "%" }} /></div>
        </article>
      </section>

      <Panel fill title="Minha lista" subtitle="Toque num ativo para ver os detalhes"
        actions={
          <Toolbar as="form" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="Adicionar: PETR4, HGLG11…" autoComplete="off" style={{ minWidth: 200 }} />
            <Button variant="cyan" type="submit">Adicionar</Button>
            <Select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
              <option value="variacao">Maior variação</option>
              <option value="valor">Maior preço</option>
              <option value="volume">Maior volume</option>
              <option value="nome">Nome</option>
            </Select>
            <Button variant="ghost" type="button">Lista padrão</Button>
          </Toolbar>}>
        <div className="hg-bolsa-cab" aria-hidden="true">
          <span>Ativo</span><span>Preço</span><span>Variação</span><span>Sessão</span><span>Mín · Máx</span><span>Volume</span><span></span>
        </div>
        <div className="hg-bolsa-lista hg-rolar" role="list">
          {ativos.map((x, i) => (
            <StockRow key={x.symbol} {...x} index={i} force={Math.abs(x.changePercent) / maxAbs} onOpen={() => setAberto(x.symbol)} />
          ))}
        </div>
        <p className="hg-credito" style={{ marginTop: ".4rem" }}>Dados: HG Brasil Finance · B3. Valores com atraso conforme o plano da chave.</p>
      </Panel>

      {a ? (
        <Drawer open wide title={a.symbol} subtitle={a.name} onClose={() => setAberto(null)}>
          <div className="hg-bolsa-valor" style={{ fontSize: "2.4rem" }}>{brl(a.value)}</div>
          <div className={"hg-bolsa-var " + (a.changePercent > 0 ? "is-alta" : "is-baixa")} style={{ marginBottom: "1rem" }}>
            {a.changePercent > 0 ? "▲" : "▼"} {pct(a.changePercent)} <small>{brl(a.changeValue)} hoje</small>
          </div>
          <Sparkline points={a.points} trend={a.changePercent > 0 ? "up" : "down"} style={{ height: 90 }} />
          <div className="hg-bolsa-detalhes">
            <div><span>Abertura</span><b>{brl(a.value - a.changeValue)}</b></div>
            <div><span>Fechamento anterior</span><b>{brl(a.value - a.changeValue)}</b></div>
            <div><span>Máxima</span><b>{brl(a.high)}</b></div>
            <div><span>Mínima</span><b>{brl(a.low)}</b></div>
            <div><span>Volume</span><b>{compacto(a.volume)}</b></div>
            <div><span>Setor</span><b>—</b></div>
          </div>
          <p className="hg-sub" style={{ marginTop: "1rem" }}>B3:{a.symbol} · cotação fictícia (demonstração)</p>
        </Drawer>
      ) : null}
    </>
  );
}

Object.assign(window, { BolsaScreen });
