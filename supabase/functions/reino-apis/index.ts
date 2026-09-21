// Reino · APIs de conteúdo (notícias, cidade, música, assistente) numa função só.
// Rotas fixas — não é proxy aberto. Só fontes gratuitas e públicas, sem chave.
// As da RapidAPI (News13, GeoDB, Spotify23, Robomatic) entram quando assinadas,
// sempre lendo a chave do Vault via segredo_rapidapi() — nunca no app.
//   POST { rota: "noticias",   tema?, busca? }   → RSS dos próprios veículos + Google Notícias
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
// O que sai daqui é só o que um leitor de RSS mostra: título, veículo, link para
// a matéria no site dele, data, a imagem de capa que o próprio feed publica e o
// resumo curto que o feed entrega. Nunca o texto da matéria — a leitura é sempre
// no site da fonte, e o crédito do veículo aparece em cada cartão.
const ENTIDADES: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", hellip: "…", mdash: "—", ndash: "–",
  laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", bull: "•", middot: "·",
  deg: "°", ordm: "º", ordf: "ª", euro: "€", pound: "£", cent: "¢", copy: "©", reg: "®", trade: "™",
  times: "×", sect: "§", frac12: "½", prime: "′", eth: "ð", szlig: "ß",
};
// &ecirc; &ccedil; &atilde;… viram letra + acento combinado e voltam a ser uma letra só
const ACENTOS: Record<string, string> = { acute: "́", grave: "̀", circ: "̂", tilde: "̃", uml: "̈", cedil: "̧", ring: "̊" };
const entidades = (s: string) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-zA-Z])(acute|grave|circ|tilde|uml|cedil|ring);/g, (m, letra, tipo) => (letra + ACENTOS[tipo]).normalize("NFC") || m)
  .replace(/&([a-z]+\d*);/gi, (m, n) => ENTIDADES[String(n).toLowerCase()] ?? m);
const desfaz = (s: string) => entidades(s.replace(/<!\[CDATA\[|\]\]>/g, "")).trim();
/* Tira o HTML do resumo. O `<[^<>]*("[^"]*"[^<>]*)*>` aceita ">" dentro de
   aspas: sem isso, uma legenda de foto com ">" partia a tag ao meio e o resto
   dela (alt, data-large-file…) vazava para o texto do cartão. */
const semTags = (s: string) => desfaz(desfaz(s).replace(/<[^<>]*(?:"[^"]*"[^<>]*)*>/g, " ")).replace(/\s+/g, " ").trim();

// Só estes endereços são buscados: lista fixa no servidor, nada de URL vinda do
// navegador (por isso não há como virar proxy aberto nem alcançar rede interna).
type Fonte = { id: string; nome: string; site: string; url: string; temas: string[] };
const FONTES: Fonte[] = [
  { id: "infomoney", nome: "InfoMoney", site: "infomoney.com.br", url: "https://www.infomoney.com.br/feed/", temas: ["economia", "negocios"] },
  { id: "exame", nome: "EXAME", site: "exame.com", url: "https://exame.com/feed/", temas: ["negocios", "economia"] },
  { id: "braziljournal", nome: "Brazil Journal", site: "braziljournal.com", url: "https://braziljournal.com/feed/", temas: ["negocios"] },
  { id: "neofeed", nome: "NeoFeed", site: "neofeed.com.br", url: "https://neofeed.com.br/feed/", temas: ["negocios"] },
  { id: "startups", nome: "Startups", site: "startups.com.br", url: "https://startups.com.br/feed/", temas: ["empreendedorismo", "tecnologia"] },
  { id: "agenciabrasil", nome: "Agência Brasil", site: "agenciabrasil.ebc.com.br", url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml", temas: ["economia", "politica"] },
  { id: "g1economia", nome: "g1 Economia", site: "g1.globo.com", url: "https://g1.globo.com/rss/g1/economia/", temas: ["economia", "politica"] },
  { id: "canaltech", nome: "Canaltech", site: "canaltech.com.br", url: "https://canaltech.com.br/rss/", temas: ["tecnologia"] },
  { id: "tecnoblog", nome: "Tecnoblog", site: "tecnoblog.net", url: "https://tecnoblog.net/feed/", temas: ["tecnologia"] },
  { id: "olhardigital", nome: "Olhar Digital", site: "olhardigital.com.br", url: "https://olhardigital.com.br/feed/", temas: ["tecnologia"] },
  { id: "mobiletime", nome: "Mobile Time", site: "mobiletime.com.br", url: "https://www.mobiletime.com.br/feed/", temas: ["tecnologia"] },
  { id: "tiinside", nome: "TI Inside", site: "tiinside.com.br", url: "https://www.tiinside.com.br/feed/", temas: ["tecnologia"] },
  { id: "adnews", nome: "AdNews", site: "adnews.com.br", url: "https://www.adnews.com.br/feed/", temas: ["marketing"] },
  { id: "g1tecnologia", nome: "g1 Tecnologia", site: "g1.globo.com", url: "https://g1.globo.com/rss/g1/tecnologia/", temas: ["tecnologia"] },
];

// Editorias pensadas para dono de empresa. `fontes` escolhe de onde buscar;
// `palavras` recorta o assunto quando não existe um feed só dele.
type Editoria = { id: string; rotulo: string; fontes?: string[]; palavras?: RegExp; buscaGoogle?: string };
const EDITORIAS: Editoria[] = [
  { id: "destaques", rotulo: "Destaques" },
  { id: "negocios", rotulo: "Negócios" },
  { id: "economia", rotulo: "Economia" },
  { id: "tecnologia", rotulo: "Tecnologia" },
  { id: "marketing", rotulo: "Marketing", fontes: ["adnews", "exame", "startups", "canaltech", "neofeed", "olhardigital"],
    palavras: /marketing|publicidad|propaganda|\bmarca\b|marcas|campanha|consumidor|varejo|branding|influenc|anunci|midia|social media/,
    buscaGoogle: "marketing e publicidade para empresas" },
  { id: "credito", rotulo: "Crédito e juros", fontes: ["infomoney", "exame", "neofeed", "braziljournal", "g1economia", "agenciabrasil"],
    palavras: /credito|financiament|\bjuros\b|selic|emprestim|inadimplen|banco central|capital de giro|fintech|\bpix\b|antecipa[çc]/,
    buscaGoogle: "crédito para empresas juros Selic" },
  { id: "empreendedorismo", rotulo: "Empreendedorismo", fontes: ["startups", "exame", "neofeed", "braziljournal", "infomoney"],
    palavras: /empreend|startup|pequena|pequenas empresas|\bmei\b|\bpme\b|franquia|sebrae|micro ?empres|neg[óo]cio pr[óo]prio|fundador/,
    buscaGoogle: "empreendedorismo pequenas empresas MEI" },
  { id: "politica", rotulo: "Política e empresas", fontes: ["agenciabrasil", "g1economia", "infomoney", "exame", "braziljournal"],
    palavras: /tribut|imposto|reforma|congresso|senado|c[âa]mara|governo|regula|\blei\b|decreto|medida provis|receita federal|minist[ée]rio/,
    buscaGoogle: "reforma tributária impostos empresas" },
];
const APELIDOS: Record<string, string> = { "": "destaques", manchetes: "destaques", mercado: "economia", varejo: "marketing", empresas: "negocios", credito: "credito" };

const UA = "Mozilla/5.0 (compatible; ReinoBot/1.0; +https://o-reino.vercel.app)";
const PRIVADO = /^(localhost|\[?::1\]?|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?f[cde])/i;
function enderecoPublico(u: string) {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (PRIVADO.test(url.hostname)) return false;
    return url.hostname.includes(".");
  } catch { return false; }
}

// Busca com relógio e limite de bytes: feed que demora ou vem grande demais é
// cortado, nunca derruba a tela (quem falhou simplesmente não entra na mistura).
async function baixar(url: string, ms = 4500, maxBytes = 360_000): Promise<string> {
  const ctrl = new AbortController();
  const relogio = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": UA, accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5" } });
    if (!r.ok || !r.body) { try { await r.body?.cancel(); } catch { /* nada a cancelar */ } return ""; }
    const leitor = r.body.getReader();
    const partes: Uint8Array[] = [];
    let total = 0;
    while (total < maxBytes) {
      const { done, value } = await leitor.read();
      if (done) break;
      partes.push(value); total += value.length;
    }
    try { await leitor.cancel(); } catch { /* já tinha acabado */ }
    const buf = new Uint8Array(total);
    let off = 0;
    for (const p of partes) { buf.set(p, off); off += p.length; }
    return new TextDecoder("utf-8").decode(buf);
  } catch { return ""; } finally { clearTimeout(relogio); }
}

const RUIM = /\.svg($|\?)|logo|sprite|avatar|gravatar|placeholder|1x1|pixel|spacer|ebc\.png|\?o=rss|feedburner|badge|icone|icon-/i;
function imagemDoItem(it: string, corpo: string): string {
  const diretas = [
    /<media:content[^>]+url="([^"]+)"/i, /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+)"/i, /<enclosure>\s*<url>([^<]+)<\/url>/i,
    /<mediaurl>([^<]+)<\/mediaurl>/i, /<imagem-destaque>([^<]+)<\/imagem-destaque>/i,
    /<image>\s*<url>([^<]+)<\/url>/i,
  ];
  const vale = (bruta: string) => {
    const u = desfaz(bruta).trim();
    return u && !RUIM.test(u) && enderecoPublico(u) ? u : "";
  };
  for (const re of diretas) {
    const m = it.match(re);
    const u = m ? vale(m[1]) : "";
    if (u) return u;
  }
  for (const m of corpo.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const u = vale(m[1]);
    if (u) return u;
  }
  return "";
}

const LIXO_RESUMO = /(the post|o post|este (artigo|conte[úu]do)|leia mais|continue (lendo|a leitura)|apare(ceu|ce) primeiro)[\s\S]*$/i;
function resumoDoItem(corpo: string): string {
  let d = semTags(corpo).replace(LIXO_RESUMO, "").replace(/\s+/g, " ").trim();
  if (d.length > 220) d = d.slice(0, 220).replace(/\s+\S*$/, "") + "…";
  return d;
}

// Assinatura do título para juntar a mesma manchete vinda de veículos diferentes.
const VAZIAS = new Set("a as o os de do da dos das e em no na nos nas um uma para por com que ao aos sobre entre apos ate sem seu sua seus suas mais menos ja nao pelo pela".split(" "));
function assinatura(titulo: string) {
  const p = norm(titulo).replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((x) => x.length > 3 && !VAZIAS.has(x));
  if (p.length < 3) return norm(titulo).replace(/\s+/g, " ").slice(0, 60);
  // as 8 palavras de peso, em ordem alfabética, mais quantas eram no total:
  // o mesmo título republicado cai na mesma assinatura; títulos parecidos, não
  return p.slice().sort().slice(0, 8).join("-") + "|" + p.length;
}

type Materia = {
  id: string; titulo: string; resumo: string; link: string; fonte: string; fonteId: string;
  site: string; publicado: string; imagem: string; temas: string[]; tambemEm: string[];
};
function lerFeed(xml: string, f: Fonte): Materia[] {
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].slice(0, 20).map(([, it]) => {
    const tag = (t: string) => desfaz((it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "");
    let link = tag("link").trim();
    if (link.includes("/redir/") && link.includes("*http")) link = link.slice(link.indexOf("*http") + 1);
    const corpo = (it.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/) || [])[1] || "";
    const desc = (it.match(/<description[^>]*>([\s\S]*?)<\/description>/) || [])[1] || "";
    const titulo = tag("title");
    return {
      id: link || titulo, titulo, resumo: resumoDoItem(desc || corpo), link,
      fonte: f.nome, fonteId: f.id, site: f.site, publicado: tag("pubDate") || tag("dc:date") || "",
      imagem: imagemDoItem(it, desfaz(corpo) + " " + desfaz(desc)), temas: f.temas, tambemEm: [],
    };
  }).filter((n) => n.titulo && /^https?:\/\//.test(n.link) && enderecoPublico(n.link));
}

// Cache de alguns minutos por feed: as editorias e a busca dividem a mesma
// leitura, então trocar de aba não bate de novo nos sites.
const CACHE_FEED = new Map<string, { em: number; itens: Materia[] }>();
const VALIDADE_FEED = 5 * 60 * 1000;
async function feed(f: Fonte): Promise<Materia[]> {
  const guardado = CACHE_FEED.get(f.id);
  if (guardado && Date.now() - guardado.em < VALIDADE_FEED) return guardado.itens;
  const xml = await baixar(f.url);
  const itens = xml ? lerFeed(xml, f) : [];
  if (itens.length) CACHE_FEED.set(f.id, { em: Date.now(), itens });
  else if (guardado) return guardado.itens; // deu ruim agora: fica com o que já tinha
  return itens;
}

// Google Notícias entra só na busca livre e quando a editoria rendeu pouco.
// Vem sem imagem (o RSS deles não traz) — a tela põe a capa do Reino no lugar.
async function googleNoticias(busca: string): Promise<Materia[]> {
  const base = "https://news.google.com/rss";
  const url = busca ? `${base}/search?q=${encodeURIComponent(busca)}&hl=pt-BR&gl=BR&ceid=BR:pt-419` : `${base}?hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const xml = await baixar(url, 5000, 500_000);
  if (!xml) return [];
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].slice(0, 30).map(([, it]) => {
    const tag = (t: string) => desfaz((it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "");
    const fonte = tag("source") || "Google Notícias";
    let titulo = tag("title");
    if (fonte && titulo.endsWith(" - " + fonte)) titulo = titulo.slice(0, -(fonte.length + 3));
    const desc = (it.match(/<description[^>]*>([\s\S]*?)<\/description>/) || [])[1] || "";
    const outras = [...desfaz(desc).matchAll(/<font color="#6f6f6f">([^<]+)<\/font>/g)].map((m) => desfaz(m[1]));
    const site = (desfaz((it.match(/<source[^>]+url="([^"]+)"/) || [])[1] || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")) || "news.google.com";
    const link = tag("link");
    return {
      // fonteId leva o nome do veículo para a intercalação não amontoar tudo do Google
      id: link, titulo, resumo: "", link, fonte, fonteId: "g-" + norm(fonte).replace(/\W/g, "").slice(0, 14), site, publicado: tag("pubDate"),
      imagem: "", temas: ["destaques"], tambemEm: [...new Set(outras)].filter((o) => o !== fonte).slice(0, 3),
    };
  }).filter((n) => n.titulo && /^https:\/\//.test(n.link));
}

function juntar(listas: Materia[][]): Materia[] {
  const porAssinatura = new Map<string, Materia>();
  const vistos = new Set<string>();
  for (const lista of listas) {
    for (const n of lista) {
      const chaveLink = n.link.replace(/[?#].*$/, "");
      if (vistos.has(chaveLink)) continue;
      vistos.add(chaveLink);
      const a = assinatura(n.titulo);
      const antes = porAssinatura.get(a);
      if (!antes) { porAssinatura.set(a, n); continue; }
      // manchete repetida: fica a que tem capa (ou a mais antiga da lista) e o
      // outro veículo vira "também em"
      if (!antes.tambemEm.includes(n.fonte) && n.fonte !== antes.fonte) antes.tambemEm = [...antes.tambemEm, n.fonte].slice(0, 3);
      if (!antes.imagem && n.imagem) porAssinatura.set(a, { ...n, tambemEm: antes.tambemEm });
    }
  }
  return [...porAssinatura.values()];
}

const quando = (n: Materia) => { const t = Date.parse(n.publicado); return Number.isNaN(t) ? 0 : t; };
// Intercala por veículo para a capa não ficar com cinco matérias do mesmo site.
function intercalar(itens: Materia[]): Materia[] {
  const filas = new Map<string, Materia[]>();
  // as filas entram na ordem da lista FONTES (negócios e economia primeiro):
  // é quem abre a capa quando a rodada começa
  for (const f of FONTES) filas.set(f.id, []);
  for (const n of [...itens].sort((a, b) => quando(b) - quando(a))) {
    const fila = filas.get(n.fonteId) || [];
    fila.push(n); filas.set(n.fonteId, fila);
  }
  const saida: Materia[] = [];
  let sobrou = true;
  while (sobrou) {
    sobrou = false;
    for (const fila of filas.values()) { const n = fila.shift(); if (n) { saida.push(n); sobrou = true; } }
  }
  return saida;
}

async function noticias(tema: string, busca: string) {
  const pedido = norm(tema);
  const editoriaId = APELIDOS[pedido] || pedido;
  const editoria = EDITORIAS.find((e) => e.id === editoriaId);
  const termo = busca.trim() || (editoria ? "" : tema.trim());

  if (termo) { // busca livre: o pool dos veículos primeiro, Google Notícias completando
    const alvo = norm(termo).split(/\s+/).filter(Boolean);
    const pool = juntar(await Promise.all(FONTES.map(feed)));
    const casa = pool.filter((n) => { const t = norm(n.titulo + " " + n.resumo); return alvo.every((p) => t.includes(p)); });
    const itens = casa.length >= 8 ? casa : juntar([casa, await googleNoticias(termo)]);
    return {
      fonte: "Reino · busca", editoria: "busca", busca: termo, atualizado: new Date().toISOString(),
      editorias: EDITORIAS.map((e) => ({ id: e.id, rotulo: e.rotulo })),
      itens: intercalar(itens).slice(0, 40),
    };
  }

  const escolhida = editoria || EDITORIAS[0];
  const fontes = escolhida.fontes
    ? FONTES.filter((f) => escolhida.fontes!.includes(f.id))
    : FONTES.filter((f) => escolhida.id === "destaques" || f.temas.includes(escolhida.id));
  let itens = juntar(await Promise.all((fontes.length ? fontes : FONTES).map(feed)));
  if (escolhida.palavras) {
    const filtrados = itens.filter((n) => escolhida.palavras!.test(norm(n.titulo + " " + n.resumo)));
    // recorte estreito rende pouco nos feeds: o Google Notícias completa a aba
    // (essas entram sem capa, e a tela desenha a capa do Reino no lugar)
    itens = filtrados.length >= 12 ? filtrados
      : juntar([filtrados, (await googleNoticias(escolhida.buscaGoogle || escolhida.rotulo)).filter((n) => escolhida.palavras!.test(norm(n.titulo)))]);
  }
  return {
    fonte: "Reino · feeds dos veículos", editoria: escolhida.id, atualizado: new Date().toISOString(),
    editorias: EDITORIAS.map((e) => ({ id: e.id, rotulo: e.rotulo })),
    itens: intercalar(itens).slice(0, 40),
  };
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
        return resposta(await noticias(texto(c.tema, 60), texto(c.busca, 60)), 200, 300);
      case "noticias-editorias":
        return resposta({ editorias: EDITORIAS.map((e) => ({ id: e.id, rotulo: e.rotulo })), fontes: FONTES.map((f) => ({ id: f.id, nome: f.nome, site: f.site })) }, 200, 3600);
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
