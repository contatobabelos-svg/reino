/* Reino · Notícias do Reino — portal de notícias com cara de blog de tecnologia:
   manchete grande com foto, grade de cartões em 16:9, editorias, busca, "em alta",
   salvar para ler depois e marcação do que já foi lido.

   Tudo vem da Edge Function pública reino-apis (rota "noticias"), que lê os RSS
   dos próprios veículos — de lá vêm o título, o veículo, o link, a data, a capa
   publicada pelo feed e o resumo curto. O texto da matéria fica no site da fonte:
   aqui só chamamos para lá, sempre com o crédito à vista.

   Abre instantâneo: mostra o que estava guardado e atualiza por trás. */
(() => {
const { PageHead, Panel, Button, EmptyState } = window.BabelOSDesignSystem_5ad360;
const N = window.ReinoNoticias;
const ABA_SALVAS = "salvas";
const MINUTOS_ATUALIZA = 4 * 60 * 1000;

function IconMarcador({ cheio }) {
  return (
    <svg viewBox="0 0 24 24" fill={cheio ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}
function IconCompartilhar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" />
      <path d="m8.3 10.8 7.4-4.2M8.3 13.2l7.4 4.2" />
    </svg>
  );
}

const rotuloDoTema = (id) => (N.EDITORIAS.find((e) => e.id === id) || {}).rotulo || "";
const etiquetaDe = (n) => rotuloDoTema((n.temas || [])[0]) || (n.fonteId === "google" || String(n.fonteId).indexOf("g-") === 0 ? "Manchete" : "Reino");

/* Foto da matéria: a que o feed do veículo publica. Se não houver (ou se o site
   recusar a imagem), entra a capa do Reino com a inicial do veículo. */
function Foto({ n, prioridade, semEtiqueta }) {
  const [falhou, setFalhou] = React.useState(false);
  React.useEffect(() => { setFalhou(false); }, [n.imagem]);
  const tem = !!n.imagem && !falhou;
  return (
    <span className="hg-nt-foto" data-tom={N.tomDaFonte(n.fonte)}>
      {tem ? (
        <img src={n.imagem} alt="" width="640" height="360" loading={prioridade ? "eager" : "lazy"}
          decoding="async" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      ) : (
        <span className="hg-nt-semfoto" aria-hidden="true"><span>{N.iniciais(n.fonte)}</span></span>
      )}
      {semEtiqueta ? null : <span className="hg-nt-etiqueta">{etiquetaDe(n)}</span>}
    </span>
  );
}

function Assinatura({ n }) {
  const tempo = N.tempoRelativo(n.publicado);
  return (
    <span className="hg-nt-meta">
      <span className="hg-nt-veiculo">{n.fonte}</span>
      {tempo ? <><span aria-hidden="true">·</span><time dateTime={n.publicado}>{tempo}</time></> : null}
      {n.tambemEm && n.tambemEm.length ? <span className="hg-nt-tambem">· também em {n.tambemEm.join(", ")}</span> : null}
    </span>
  );
}

function Acoes({ n, salva, aoSalvar, aoCompartilhar }) {
  return (
    <span className="hg-nt-acoes">
      <button type="button" aria-pressed={salva} title={salva ? "Tirar dos salvos" : "Salvar para ler depois"}
        aria-label={(salva ? "Tirar dos salvos: " : "Salvar para ler depois: ") + n.titulo}
        onClick={() => aoSalvar(n)}><IconMarcador cheio={salva} /></button>
      <button type="button" title="Compartilhar" aria-label={"Compartilhar: " + n.titulo}
        onClick={() => aoCompartilhar(n)}><IconCompartilhar /></button>
    </span>
  );
}

function Manchete({ n, salva, lida, aoSalvar, aoCompartilhar, aoAbrir }) {
  return (
    <article>
      <a className="hg-nt-hero" href={n.link} target="_blank" rel="noopener noreferrer" onClick={() => aoAbrir(n)}>
        <Foto n={n} prioridade />
        <span className="hg-nt-hero-texto">
          <h2>{n.titulo}</h2>
          {n.resumo ? <p>{n.resumo}</p> : null}
        </span>
      </a>
      <div className="hg-nt-meta" style={{ marginTop: ".5rem", justifyContent: "space-between" }}>
        <Assinatura n={n} />
        <Acoes n={n} salva={salva} aoSalvar={aoSalvar} aoCompartilhar={aoCompartilhar} />
      </div>
      {lida ? <span className="hg-sub" style={{ fontSize: ".7rem" }}>Você já abriu esta</span> : null}
    </article>
  );
}

function Cartao({ n, salva, lida, aoSalvar, aoCompartilhar, aoAbrir }) {
  return (
    <article className="hg-nt-card" data-lida={lida ? "1" : "0"}>
      <a href={n.link} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" onClick={() => aoAbrir(n)}>
        <Foto n={n} />
      </a>
      <h3><a href={n.link} target="_blank" rel="noopener noreferrer" onClick={() => aoAbrir(n)}>{n.titulo}</a></h3>
      {n.resumo ? <p>{n.resumo}</p> : null}
      <div className="hg-nt-meta" style={{ justifyContent: "space-between" }}>
        <Assinatura n={n} />
        <Acoes n={n} salva={salva} aoSalvar={aoSalvar} aoCompartilhar={aoCompartilhar} />
      </div>
    </article>
  );
}

function Esqueleto() {
  return (
    <div className="hg-nt-capa-topo" aria-hidden="true">
      <div className="hg-nt-esq hg-nt-esq-foto" />
      <div style={{ display: "grid", gap: ".8rem", alignContent: "start" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "grid", gap: ".4rem" }}>
            <div className="hg-nt-esq hg-nt-esq-linha" />
            <div className="hg-nt-esq hg-nt-esq-linha curta" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NoticiasScreen() {
  const [aba, setAba] = React.useState("destaques");
  const [busca, setBusca] = React.useState("");        // o que está no campo
  const [termo, setTermo] = React.useState("");        // o que foi enviado
  const [dados, setDados] = React.useState(null);      // null = nunca carregou
  const [erro, setErro] = React.useState(null);
  const [carregando, setCarregando] = React.useState(false);
  const [editorias, setEditorias] = React.useState(N.EDITORIAS);
  const [salvas, setSalvas] = React.useState(() => N.salvas());
  const [lidas, setLidas] = React.useState(() => N.lidas());
  const [fonteFiltro, setFonteFiltro] = React.useState("");
  const [ordem, setOrdem] = React.useState("recentes");
  const [recado, setRecado] = React.useState("");
  const campoBusca = React.useRef(null);
  const emVoo = React.useRef(null);

  const pedido = React.useMemo(() => (termo ? { busca: termo } : { tema: aba }), [aba, termo]);
  const naSalvas = aba === ABA_SALVAS && !termo;

  /* Uma busca só, usada na abertura, na troca de aba, no botão Atualizar e no
     relógio de fundo. `silencioso` = não apaga o que está na tela nem pisca. */
  const carregar = React.useCallback((p, silencioso) => {
    if (emVoo.current) emVoo.current.abort();
    const ctrl = new AbortController();
    emVoo.current = ctrl;
    if (!silencioso) setCarregando(true);
    setErro(null);
    return N.buscar(p, ctrl.signal)
      .then((d) => { setDados(d); setErro(null); })
      .catch((e) => {
        if (e && e.name === "AbortError") return;
        setErro(e.message || "Não foi possível buscar as notícias agora.");
      })
      .finally(() => { if (emVoo.current === ctrl) { emVoo.current = null; setCarregando(false); } });
  }, []);

  // troca de aba ou busca nova: cache na tela primeiro, rede por trás
  React.useEffect(() => {
    if (naSalvas) { setDados({ itens: salvas, atualizado: "", em: Date.now(), doCache: true, salvas: true }); setErro(null); return; }
    const guardado = N.doCache(pedido);
    if (guardado) { setDados(guardado); carregar(pedido, true); }
    else { setDados(null); carregar(pedido, false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido, naSalvas]);

  // lista de editorias confirmada pela função (se ela ganhar abas novas)
  React.useEffect(() => {
    if (dados && dados.editorias && dados.editorias.length) setEditorias(dados.editorias);
  }, [dados]);

  // atualiza sozinho de tempos em tempos, só com a aba visível e sem piscar
  React.useEffect(() => {
    if (naSalvas) return undefined;
    const relogio = setInterval(() => {
      if (document.visibilityState === "visible") carregar(pedido, true);
    }, MINUTOS_ATUALIZA);
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return;
      const g = N.doCache(pedido);
      if (!g || g.velho) carregar(pedido, true);
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => { clearInterval(relogio); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [pedido, naSalvas, carregar]);

  // salvas/lidas mudam em qualquer lugar do app (inclusive no bloco do Dashboard)
  React.useEffect(() => {
    const atualizarSalvas = () => setSalvas(N.salvas());
    const atualizarLidas = () => setLidas(N.lidas());
    window.addEventListener("reino-noticias-salvas", atualizarSalvas);
    window.addEventListener("reino-noticias-lidas", atualizarLidas);
    return () => {
      window.removeEventListener("reino-noticias-salvas", atualizarSalvas);
      window.removeEventListener("reino-noticias-lidas", atualizarLidas);
    };
  }, []);
  React.useEffect(() => { if (naSalvas) setDados({ itens: salvas, atualizado: "", em: Date.now(), doCache: true, salvas: true }); }, [salvas, naSalvas]);

  React.useEffect(() => () => { if (emVoo.current) emVoo.current.abort(); }, []);

  // atalhos: "/" vai para a busca, "r" atualiza, Esc limpa
  React.useEffect(() => {
    const aoTeclar = (ev) => {
      const alvo = ev.target || {};
      const digitando = alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable;
      if (ev.key === "Escape" && digitando && alvo === campoBusca.current) { setBusca(""); setTermo(""); alvo.blur(); return; }
      if (digitando || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === "/") { ev.preventDefault(); if (campoBusca.current) campoBusca.current.focus(); }
      else if (ev.key === "r" || ev.key === "R") { ev.preventDefault(); if (!naSalvas) carregar(pedido, false); }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [pedido, naSalvas, carregar]);

  const aoSalvar = React.useCallback((n) => {
    const virouSalva = N.alternarSalva(n);
    setSalvas(N.salvas());
    setRecado(virouSalva ? "Salva para ler depois." : "Tirada dos salvos.");
  }, []);
  const aoAbrir = React.useCallback((n) => { N.marcarLida(n.link); setLidas(N.lidas()); }, []);
  const aoCompartilhar = React.useCallback((n) => {
    N.compartilhar(n).then((r) => setRecado(r === "copiado" ? "Link copiado." : r === "compartilhado" ? "Compartilhado." : "Não deu para compartilhar aqui."));
  }, []);

  const itens = (dados && dados.itens) || [];
  const fontes = React.useMemo(() => [...new Set(itens.map((n) => n.fonte))].sort((a, b) => a.localeCompare(b, "pt-BR")), [itens]);
  const visiveis = React.useMemo(() => {
    let lista = fonteFiltro ? itens.filter((n) => n.fonte === fonteFiltro) : itens;
    if (ordem === "veiculo") lista = [...lista].sort((a, b) => a.fonte.localeCompare(b.fonte, "pt-BR") || (Date.parse(b.publicado) || 0) - (Date.parse(a.publicado) || 0));
    else if (ordem === "naolidas") lista = [...lista].sort((a, b) => (lidas.indexOf(a.link) >= 0) - (lidas.indexOf(b.link) >= 0));
    return lista;
  }, [itens, fonteFiltro, ordem, lidas]);

  // a manchete precisa de foto: pega a primeira que tiver
  const indiceManchete = ordem === "recentes" ? Math.max(0, visiveis.findIndex((n) => n.imagem)) : 0;
  const manchete = visiveis[indiceManchete];
  const resto = visiveis.filter((_, i) => i !== indiceManchete);
  const secundarias = resto.slice(0, 2);
  const grade = resto.slice(2);
  const emAlta = resto.slice(0, 6);

  const salva = (n) => salvas.some((s) => s.link === n.link);
  const lida = (n) => lidas.indexOf(n.link) >= 0;
  const props = (n) => ({ n, salva: salva(n), lida: lida(n), aoSalvar, aoCompartilhar, aoAbrir });

  const estado = erro ? "erro" : (dados && dados.velho && !carregando) ? "velho" : "ok";
  const aviso = erro ? erro
    : carregando ? "Buscando as últimas…"
    : naSalvas ? (salvas.length + (salvas.length === 1 ? " matéria salva" : " matérias salvas"))
    : dados ? "Atualizado às " + N.hora(dados.atualizado || dados.em) + (dados.doCache ? " (guardado neste aparelho)" : "")
    : "";

  const enviarBusca = (ev) => { ev.preventDefault(); setTermo(busca.trim()); if (busca.trim()) setAba(""); };

  return (
    <>
      <PageHead title="Notícias do Reino" subtitle="O que move os negócios hoje, direto dos veículos que publicam." />
      <Panel fill actions={
        <Button variant="ghost" icon="rota" onClick={() => (naSalvas ? null : carregar(pedido, false))} disabled={carregando || naSalvas}>
          {carregando ? "Atualizando…" : "Atualizar"}
        </Button>
      }>
        <div className="hg-rolar hg-nt">
          <header className="hg-nt-topo">
            <span className="hg-nt-data">{N.dataPorExtenso()}</span>
            <p className="hg-nt-status" role="status" aria-live="polite">
              <span className="hg-nt-ponto" data-estado={estado} aria-hidden="true" />
              {aviso}{recado ? " · " + recado : ""}
            </p>
          </header>

          <nav className="hg-nt-abas" role="tablist" aria-label="Editorias">
            {editorias.map((e) => (
              <button key={e.id} type="button" role="tab" aria-selected={aba === e.id && !termo}
                onClick={() => { setAba(e.id); setTermo(""); setBusca(""); setFonteFiltro(""); }}>
                {e.rotulo}
              </button>
            ))}
            <button type="button" role="tab" aria-selected={naSalvas}
              onClick={() => { setAba(ABA_SALVAS); setTermo(""); setBusca(""); setFonteFiltro(""); }}>
              Salvas{salvas.length ? <span className="hg-nt-conta">{salvas.length}</span> : null}
            </button>
          </nav>

          <div className="hg-nt-barra">
            <form className="hg-nt-busca" role="search" onSubmit={enviarBusca}>
              <input ref={campoBusca} type="search" value={busca} onChange={(ev) => setBusca(ev.target.value)}
                placeholder="Buscar assunto (barra / para ir direto)" aria-label="Buscar notícia por assunto" />
              <Button type="submit" variant="cyan">Buscar</Button>
            </form>
            <div className="hg-nt-filtro">
              <span className="hg-nt-campo">
                <label htmlFor="hg-nt-fonte">Veículo</label>
                <select id="hg-nt-fonte" value={fonteFiltro} onChange={(ev) => setFonteFiltro(ev.target.value)}>
                  <option value="">Todos ({fontes.length})</option>
                  {fontes.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </span>
              <span className="hg-nt-campo">
                <label htmlFor="hg-nt-ordem">Ordem</label>
                <select id="hg-nt-ordem" value={ordem} onChange={(ev) => setOrdem(ev.target.value)}>
                  <option value="recentes">Mais recentes</option>
                  <option value="naolidas">Não lidas primeiro</option>
                  <option value="veiculo">Por veículo</option>
                </select>
              </span>
            </div>
          </div>

          {termo ? (
            <p className="hg-sub" style={{ margin: 0 }}>
              Resultados para <strong>{termo}</strong> · <button type="button" className="hg-link-botao"
                onClick={() => { setTermo(""); setBusca(""); setAba("destaques"); }}
                style={{ background: "none", border: 0, color: "var(--cyan)", cursor: "pointer", font: "inherit", padding: 0 }}>voltar às editorias</button>
            </p>
          ) : null}

          {dados === null && !erro ? <Esqueleto />
            : erro && !visiveis.length ? (
              <div style={{ display: "grid", gap: ".8rem", justifyItems: "center" }}>
                <EmptyState icon="alerta" title="Notícias indisponíveis" description={erro} />
                <Button variant="cyan" icon="rota" onClick={() => carregar(pedido, false)}>Tentar de novo</Button>
              </div>
            ) : !visiveis.length ? (
              <div style={{ display: "grid", gap: ".8rem", justifyItems: "center" }}>
                <EmptyState icon="noticias" title={naSalvas ? "Nada salvo ainda" : "Nada por aqui"}
                  description={naSalvas
                    ? "Use o marcador nos cartões para guardar uma matéria e ler depois — fica salva neste aparelho."
                    : termo ? "Essa busca não trouxe matérias agora. Tente outra palavra ou volte às editorias."
                      : "Esta editoria não trouxe matérias agora. Atualize ou escolha outra."} />
                {naSalvas ? null : <Button variant="cyan" icon="rota" onClick={() => carregar(pedido, false)}>Tentar de novo</Button>}
              </div>
            ) : (
              <>
                <section className="hg-nt-capa-topo" aria-label="Manchete">
                  {manchete ? <Manchete {...props(manchete)} /> : null}
                  {secundarias.length ? (
                    <div className="hg-nt-capa-secundarias">
                      {secundarias.map((n) => <Cartao key={n.link} {...props(n)} />)}
                    </div>
                  ) : null}
                </section>

                <div className="hg-nt-corpo">
                  <section className="hg-nt-grade" aria-label="Mais matérias">
                    {grade.map((n) => <Cartao key={n.link} {...props(n)} />)}
                  </section>

                  <aside className="hg-nt-lado" aria-label="Resumo do dia">
                    <div className="hg-nt-bloco">
                      <h3>Em alta agora</h3>
                      <ol className="hg-nt-alta">
                        {emAlta.map((n) => (
                          <li key={n.link}>
                            <a href={n.link} target="_blank" rel="noopener noreferrer" onClick={() => aoAbrir(n)}>
                              {n.titulo}
                              <small>{n.fonte}{N.tempoRelativo(n.publicado) ? " · " + N.tempoRelativo(n.publicado) : ""}</small>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="hg-nt-bloco">
                      <h3>Veículos nesta edição</h3>
                      <div className="hg-nt-fontes">{fontes.map((f) => <span key={f}>{f}</span>)}</div>
                    </div>
                    {lidas.length ? (
                      <div className="hg-nt-bloco">
                        <h3>Leitura</h3>
                        <p className="hg-sub" style={{ margin: 0, fontSize: ".78rem" }}>{lidas.length} {lidas.length === 1 ? "matéria aberta" : "matérias abertas"} neste aparelho.</p>
                        <Button variant="ghost" onClick={() => { N.limparLidas(); setLidas(N.lidas()); setRecado("Marcações de leitura apagadas."); }}>Limpar marcações</Button>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </>
            )}

          <footer className="hg-nt-rodape">
            <span>Título, veículo e resumo vêm do feed de cada site. A matéria completa abre no site da fonte.</span>
            <span>{fontes.length ? fontes.length + (fontes.length === 1 ? " veículo" : " veículos") : ""}</span>
          </footer>
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { NoticiasScreen });
})();
