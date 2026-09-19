/* Reino · Assistente do Reino — chat simples que fala com a Edge Function reino-apis
   (rota "assistente"). O servidor já recusa perguntas sobre renda/comissão; aqui só
   mostramos a conversa e, quando a resposta aponta para uma tela do app, um atalho
   para abri-la. Histórico fica só na memória da aba (não é salvo). */
(() => {
const { PageHead, Panel, Button, Input } = window.BabelOSDesignSystem_5ad360;
const FUNC_URL = "https://fxlansnepokjxdikxocb.supabase.co/functions/v1/reino-apis";
const SUGESTOES = [
  "Como funciona o Mapa Reino?",
  "O que é uma guilda?",
  "Como faço network no Bate Papo?",
  "Como subo de título no Reino?",
];
const BOAS_VINDAS = "Oi! Sou o assistente do Reino. Pergunte sobre o mapa, as guildas, o bate-papo, a bolsa ou qualquer outra tela do app.";

function nomeDaTela(href) {
  const menu = window.BabelOSDesignSystem_5ad360.MENU_BABEL || [];
  const item = menu.find(([h]) => h === href);
  return item ? item[2] : null;
}

function Bolha({ m, ir }) {
  const eu = m.de === "eu";
  const nome = !eu && m.ir ? nomeDaTela(m.ir) : null;
  return (
    <div className={"hg-chat-msg" + (eu ? " is-eu" : "")}>
      <div>
        <p>{m.texto}</p>
        {nome ? <Button variant="cyan" style={{ marginTop: ".5rem" }} onClick={() => ir(m.ir)}>Abrir {nome}</Button> : null}
      </div>
    </div>
  );
}

function AssistenteScreen({ ir }) {
  const [mensagens, setMensagens] = React.useState([{ de: "reino", texto: BOAS_VINDAS }]);
  const [campo, setCampo] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const fimRef = React.useRef(null);

  React.useEffect(() => {
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    fimRef.current && fimRef.current.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "end" });
  }, [mensagens, enviando]);

  const perguntar = (pergunta) => {
    const texto = pergunta.trim();
    if (!texto || enviando) return;
    setMensagens((m) => [...m, { de: "eu", texto }]);
    setCampo("");
    setEnviando(true);
    fetch(FUNC_URL, {
      method: "POST",
      headers: { apikey: window.REINO_SUPABASE.anon, Authorization: "Bearer " + window.REINO_SUPABASE.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ rota: "assistente", pergunta: texto }),
    })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "Não consegui responder agora."); return j; })
      .then((j) => setMensagens((m) => [...m, { de: "reino", texto: j.resposta, ir: j.ir || null }]))
      .catch((err) => setMensagens((m) => [...m, { de: "reino", texto: err.message || "Não consegui responder agora. Tente de novo." }]))
      .finally(() => setEnviando(false));
  };

  const enviar = (e) => { e.preventDefault(); perguntar(campo); };

  return (
    <>
      <PageHead title="Assistente do Reino" subtitle="Tire dúvidas sobre como usar o app — respostas automáticas, na hora." />
      <Panel fill title="Conversa">
        <div style={{ display: "grid", gap: ".8rem", height: "100%", minHeight: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>
          <p className="hg-chat-aviso">Respostas automáticas sobre o uso do Reino. Valores e condições comerciais: fale com a equipe.</p>

          <div className="hg-chat">
            {mensagens.map((m, i) => <Bolha key={i} m={m} ir={ir} />)}
            {enviando ? <div className="hg-chat-msg"><div><p className="hg-sub" style={{ margin: 0 }}>Digitando…</p></div></div> : null}
            <div ref={fimRef} />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {SUGESTOES.map((s) => <button key={s} type="button" className="hg-pill" onClick={() => perguntar(s)} disabled={enviando}>{s}</button>)}
          </div>

          <form onSubmit={enviar} style={{ display: "flex", gap: ".5rem", minWidth: 0 }}>
            <label className="sr-only" htmlFor="assistente-campo">Sua pergunta</label>
            <Input id="assistente-campo" value={campo} onChange={(e) => setCampo(e.target.value)} placeholder="Pergunte algo sobre o Reino…" style={{ flex: 1, minWidth: 0 }} disabled={enviando} />
            <Button type="submit" variant="cyan" disabled={enviando || !campo.trim()}>Enviar</Button>
          </form>
        </div>
      </Panel>
    </>
  );
}

Object.assign(window, { AssistenteScreen });
})();
