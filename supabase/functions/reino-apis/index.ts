// Reino · APIs de conteúdo (notícias, cidade, música, assistente) numa função só.
// Rotas fixas — não é proxy aberto. Só fontes gratuitas e públicas, sem chave.
// As da RapidAPI (News13, GeoDB, Spotify23, Robomatic) entram quando assinadas,
// sempre lendo a chave do Vault via segredo_rapidapi() — nunca no app.
//   POST { rota: "noticias",   tema? }           → Google News RSS pt-BR (tema = busca)
//   POST { rota: "cidade",     uf, cidade }      → IBGE: código e população (Censo 2022)
//   POST { rota: "musica",     q }               → Deezer (prévia de 30 s)
//   POST { rota: "assistente", pergunta }        → respostas do Reino (sem promessa de renda)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resposta = (corpo: unknown, status = 200, cacheSeg = 0) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", ...(cacheSeg ? { "Cache-Control": `public, max-age=${cacheSeg}` } : {}) },
  });
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const texto = (s: unknown, max = 120) => String(s ?? "").slice(0, max);

// ---------------------------------------------------------------- notícias
const desfaz = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
async function noticias(tema: string) {
  const base = "https://news.google.com/rss";
  const url = tema ? `${base}/search?q=${encodeURIComponent(tema)}&hl=pt-BR&gl=BR&ceid=BR:pt-419` : `${base}?hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const xml = await (await fetch(url)).text();
  const itens = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30).map(([, it]) => {
    const tag = (t: string) => desfaz((it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "");
    const fonte = tag("source");
    let titulo = tag("title");
    if (fonte && titulo.endsWith(" - " + fonte)) titulo = titulo.slice(0, -(fonte.length + 3));
    return { titulo, link: tag("link"), fonte, publicado: tag("pubDate") };
  }).filter((n) => n.titulo && /^https:\/\//.test(n.link));
  return { fonte: "Google Notícias", itens };
}

// ---------------------------------------------------------------- cidade (IBGE)
const municipiosPorUf = new Map<string, { id: number; nome: string }[]>();
async function cidade(uf: string, nome: string) {
  if (!municipiosPorUf.has(uf)) {
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    municipiosPorUf.set(uf, (await r.json()).map((m: any) => ({ id: m.id, nome: m.nome })));
  }
  const m = municipiosPorUf.get(uf)!.find((x) => norm(x.nome) === norm(nome));
  if (!m) return null;
  const p = await (await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6%5B${m.id}%5D`)).json();
  const populacao = Number(p?.[0]?.resultados?.[0]?.series?.[0]?.serie?.["2022"]) || null;
  return { ibge: m.id, nome: m.nome, uf, populacao, ano: 2022, fonte: "IBGE · Censo 2022" };
}

// ---------------------------------------------------------------- música (Deezer)
async function musica(q: string) {
  const j = await (await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`)).json();
  const itens = (j.data || []).map((t: any) => ({
    titulo: t.title, artista: t.artist?.name, album: t.album?.title, capa: t.album?.cover_medium,
    previa: t.preview, link: t.link, duracao: t.duration,
  })).filter((t: any) => t.previa);
  return { fonte: "Deezer", itens };
}

// ---------------------------------------------------------------- assistente
// Base de respostas do próprio Reino. Nunca fala de renda, comissão, lucro ou preço:
// esses temas estão em disputa entre os sócios e têm risco jurídico (CLAUDE.md).
const PROIBIDO = /renda|ganh(ar|o|os)|lucr|comiss|quanto (eu )?(vou )?receb|dinheiro|pre[çc]o|mensalidade|investi|rend(e|imento)|pir[âa]mide/;
const BASE: { chaves: RegExp; resposta: string; ir?: string }[] = [
  { chaves: /t[íi]tulo|n[íi]vel|bar[ãa]o|visconde|conde|marqu|duque|pr[íi]ncipe|\brei\b|imperador/, ir: "niveis.html",
    resposta: "Cada empresa do Reino tem um título de nobreza que define o território que ela representa — do título de entrada até Imperador, que responde pelo Brasil inteiro. Na tela Níveis você vê a escada completa e o que cada título libera." },
  { chaves: /mapa|globo|territ[óo]rio|bairro|cidade|onde/, ir: "mapa.html",
    resposta: "O Mapa Reino mostra onde estão as empresas do Reino e as empresas da região. Use o botão de localização para ir até o seu bairro; para dar zoom, use Ctrl + roda do mouse ou dois dedos." },
  { chaves: /guild|segmento|nicho/, ir: "guildas.html", resposta: "As guildas reúnem empresas do mesmo segmento para trocar indicações e experiências. Veja as guildas do seu segmento na tela Guildas." },
  { chaves: /match|parceir|complementar/, ir: "match.html", resposta: "O Match Reino sugere empresas de nichos complementares ao seu — quem atende o mesmo cliente sem concorrer com você." },
  { chaves: /academy|aula|curso|v[íi]deo|aprender/, ir: "academy.html", resposta: "Na Reino Academy ficam as trilhas de vídeo. Cada trilha reúne aulas de um mesmo canal ou tema." },
  { chaves: /cadastr|entrar|login|conta|senha|aprova/, ir: "perfil.html", resposta: "Toda conta nova entra como \"aguardando\" e é aprovada por um administrador. Seus dados ficam em Minha conta; para trocar a senha, use a mesma tela." },
  { chaves: /indic|link|afiliad|convid/, ir: "meus-acessos.html", resposta: "Em Meus acessos você encontra seu link de indicação e vê quantas pessoas acessaram e se cadastraram por ele." },
  { chaves: /not[íi]cia|jornal|mercado hoje/, ir: "noticias.html", resposta: "Em Notícias do Reino você acompanha manchetes de negócios, tecnologia e empreendedorismo em tempo real." },
  { chaves: /m[úu]sica|trilha sonora|playlist/, ir: "musica.html", resposta: "Em Música do Reino você busca faixas e ouve prévias para montar a trilha sonora dos seus eventos." },
  { chaves: /evento|encontro|agenda/, ir: "eventos.html", resposta: "A tela Eventos mostra os encontros do Reino na sua região e no Brasil." },
];
function assistente(pergunta: string) {
  const p = norm(pergunta);
  if (!p) return { resposta: "Pergunte sobre títulos, mapa, guildas, match, Academy, cadastro, indicações, notícias ou eventos." };
  if (PROIBIDO.test(p)) {
    return { resposta: "Não trato de valores, ganhos ou comissões por aqui — esse assunto é tratado diretamente com a equipe do Reino. Posso ajudar com títulos, mapa, guildas, Academy ou cadastro.", ir: null };
  }
  const achou = BASE.find((b) => b.chaves.test(p));
  return achou ? { resposta: achou.resposta, ir: achou.ir || null }
    : { resposta: "Ainda não sei responder isso. Posso ajudar com títulos, mapa, guildas, match, Academy, cadastro, indicações, notícias, música ou eventos.", ir: null };
}

// ---------------------------------------------------------------- servidor
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta({ erro: "Use POST." }, 405);
  let c: Record<string, unknown>;
  try { c = await req.json(); } catch { return resposta({ erro: "Corpo inválido." }, 400); }
  try {
    switch (c.rota) {
      case "noticias":
        return resposta(await noticias(texto(c.tema, 60)), 200, 300);
      case "cidade": {
        const uf = texto(c.uf, 2).toUpperCase();
        if (!UFS.includes(uf) || !c.cidade) return resposta({ erro: "Informe uf e cidade." }, 400);
        const d = await cidade(uf, texto(c.cidade, 80));
        return d ? resposta(d, 200, 86400) : resposta({ erro: "Cidade não encontrada no IBGE." }, 404);
      }
      case "musica": {
        const q = texto(c.q, 80).trim();
        if (!q) return resposta({ erro: "Digite o que buscar." }, 400);
        return resposta(await musica(q), 200, 3600);
      }
      case "assistente":
        return resposta(assistente(texto(c.pergunta, 300)));
      default:
        return resposta({ erro: "Rota desconhecida." }, 404);
    }
  } catch (e) {
    return resposta({ erro: "A fonte não respondeu agora. Tente de novo em instantes.", detalhe: String((e as Error).message || e).slice(0, 160) }, 502);
  }
});
