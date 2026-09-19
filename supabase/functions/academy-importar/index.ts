// Reino Academy · importa aulas do YouTube a partir de uma URL e já monta a estrutura.
//   URL de vídeo (watch, youtu.be, shorts, embed, live) → aula dentro da trilha do canal
//                                                        (a trilha é criada se ainda não existir)
//   URL de canal (/channel/UC…, /@handle)               → trilha com os vídeos mais recentes
// Só administrador (perfis.situacao = 'admin'); as tabelas também exigem admin via RLS.
// Vídeo usa o oEmbed público do YouTube (sem chave). Canal usa a youtube138 (RapidAPI),
// com a chave lida do Vault pela função segredo_rapidapi() — nunca vai para o app.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NIVEIS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];
const MAX_CANAL = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Alvo = { tipo: "video"; id: string } | { tipo: "canal"; canal: string } | { tipo: "invalido" };

function analisar(bruta: string): Alvo {
  let u: URL;
  try { u = new URL(bruta.trim()); } catch { return { tipo: "invalido" }; }
  if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname)) return { tipo: "invalido" };
  const id = u.hostname.endsWith("youtu.be")
    ? u.pathname.slice(1)
    : u.searchParams.get("v") || (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,20})/) || [])[1];
  if (id && /^[\w-]{6,20}$/.test(id)) return { tipo: "video", id };
  const canal = (u.pathname.match(/^\/(channel\/UC[\w-]{20,24}|@[\w.-]{2,60})/) || [])[1];
  if (canal) return { tipo: "canal", canal };
  return { tipo: "invalido" };
}

// Página pública do canal: resolve @handle → UC… e pega o nome e a imagem.
async function dadosDoCanal(canal: string) {
  const html = await (await fetch("https://www.youtube.com/" + canal, { headers: { "Accept-Language": "pt-BR" } })).text();
  const id = canal.startsWith("channel/") ? canal.slice(8) : (html.match(/"channelId":"(UC[\w-]{22})"/) || [])[1];
  const meta = (p: string) => (html.match(new RegExp(`<meta property="og:${p}" content="([^"]*)"`)) || [])[1];
  const limpa = (s?: string) => s?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return { id, titulo: limpa(meta("title")), capa: meta("image"), descricao: limpa(meta("description")) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta({ erro: "Use POST." }, 405);

  const auth = req.headers.get("Authorization") || "";
  const db = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await db.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
  if (!user) return resposta({ erro: "Entre com sua conta de administrador." }, 401);
  const { data: perfil } = await db.from("perfis").select("situacao").eq("id", user.id).maybeSingle();
  if (perfil?.situacao !== "admin") return resposta({ erro: "Só administrador importa aulas." }, 403);

  let corpo: { url?: string; nivel?: string };
  try { corpo = await req.json(); } catch { return resposta({ erro: "Corpo inválido." }, 400); }
  const nivel = corpo.nivel && NIVEIS.includes(corpo.nivel) ? corpo.nivel : null;
  const alvo = analisar(corpo.url || "");
  if (alvo.tipo === "invalido") return resposta({ erro: "Cole um link de vídeo ou de canal do YouTube." }, 400);

  // trilha do canal: acha ou cria (unique fonte + fonte_id)
  const trilhaDoCanal = async (fonteId: string, titulo: string, capa?: string, descricao?: string) => {
    const { data: achada } = await db.from("academy_trilhas").select("*").eq("fonte", "youtube_canal").eq("fonte_id", fonteId).maybeSingle();
    if (achada) return achada;
    const { data: nova, error } = await db.from("academy_trilhas")
      .insert({ titulo, capa, descricao, fonte: "youtube_canal", fonte_id: fonteId }).select().single();
    if (error) throw new Error("trilha: " + error.message);
    return nova;
  };
  const proximaOrdem = async (trilhaId: string) => {
    const { data } = await db.from("academy_aulas").select("ordem").eq("trilha_id", trilhaId).order("ordem", { ascending: false }).limit(1);
    return ((data && data[0]?.ordem) ?? 0) + 1;
  };

  try {
    if (alvo.tipo === "video") {
      const oe = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + alvo.id)}`);
      if (!oe.ok) return resposta({ erro: "O YouTube não encontrou esse vídeo (privado, removido ou sem incorporação)." }, 404);
      const v = await oe.json();
      const fonteId = (v.author_url || "").replace("https://www.youtube.com/", "") || v.author_name;
      const trilha = await trilhaDoCanal(fonteId, v.author_name || "Aulas avulsas");
      const { data: aula, error } = await db.from("academy_aulas").upsert({
        trilha_id: trilha.id, youtube_id: alvo.id, titulo: v.title, canal: v.author_name,
        capa: `https://i.ytimg.com/vi/${alvo.id}/hqdefault.jpg`, nivel, ordem: await proximaOrdem(trilha.id),
      }, { onConflict: "trilha_id,youtube_id", ignoreDuplicates: false }).select().single();
      if (error) throw new Error("aula: " + error.message);
      return resposta({ tipo: "video", trilha, aulas: [aula] });
    }

    // canal → trilha com os vídeos mais recentes (youtube138)
    const c = await dadosDoCanal(alvo.canal);
    if (!c.id) return resposta({ erro: "Não achei esse canal no YouTube." }, 404);
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: chave } = await admin.rpc("segredo_rapidapi");
    if (!chave) return resposta({ erro: "Chave da RapidAPI não configurada no Vault." }, 500);
    const r = await fetch("https://youtube138.p.rapidapi.com/channel/videos/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-rapidapi-host": "youtube138.p.rapidapi.com", "x-rapidapi-key": chave },
      body: JSON.stringify({ id: c.id, filter: "videos_latest", cursor: "", hl: "pt", gl: "BR" }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 403) return resposta({ erro: "A API youtube138 ainda não está assinada na RapidAPI. Links de vídeo avulso funcionam; para canal inteiro, assine a youtube138." }, 402);
    if (!r.ok) return resposta({ erro: "youtube138 respondeu " + r.status, detalhe: j?.message }, 502);
    const videos = (j.contents || []).map((x: any) => x?.video).filter((v: any) => v?.videoId).slice(0, MAX_CANAL);
    if (!videos.length) return resposta({ erro: "O canal não devolveu vídeos." }, 404);
    const trilha = await trilhaDoCanal("channel/" + c.id, c.titulo || "Canal do YouTube", c.capa, c.descricao);
    let ordem = await proximaOrdem(trilha.id);
    const linhas = videos.reverse().map((v: any) => ({   // do mais antigo para o mais novo = ordem de estudo
      trilha_id: trilha.id, youtube_id: v.videoId, titulo: v.title || "Sem título", canal: c.titulo,
      descricao: v.descriptionSnippet || null, capa: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      duracao_seg: Number.isFinite(+v.lengthSeconds) ? +v.lengthSeconds : null, nivel, ordem: ordem++,
    }));
    const { data: aulas, error } = await db.from("academy_aulas")
      .upsert(linhas, { onConflict: "trilha_id,youtube_id", ignoreDuplicates: true }).select();
    if (error) throw new Error("aulas: " + error.message);
    return resposta({ tipo: "canal", trilha, aulas });
  } catch (e) {
    return resposta({ erro: "Falha ao importar.", detalhe: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
