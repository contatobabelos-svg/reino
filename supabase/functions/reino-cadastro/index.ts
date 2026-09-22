// Reino · cadastro do login imersivo (W). Recebe multipart/form-data:
//   nome, empresa, cnpj, cidade, uf, email, usuario, senha, foto (arquivo webp/jpeg),
//   indicado_por?, titulo?, redirecionar?, visita_id?, dispositivo?, captcha_token?
// Também atende, em JSON, a checagem do carrossel (C12 do Parecer 1):
//   POST { acao: "usuario_disponivel", usuario } → { ok: true, disponivel: boolean }
// Valida tudo de novo aqui (o navegador não é confiável), cria a conta pelo signup normal do Auth
// (o Supabase manda o e-mail de confirmação), grava a foto no Storage em avatares/<user_id>.webp
// e o link em perfis.foto. Nada de base64 em coluna.
// Respostas:
//   { ok: true, confirmar: true, email_mascarado }                         → falta validar o e-mail
//   { ok: true, confirmar: false, access_token, refresh_token, user }       → projeto sem confirmação
//   { ok: false, codigo, campo?, mensagem }                                 → erro para mostrar na etapa
// Chamada com a chave publicável (verify_jwt = false no gateway): é cadastro, não há login ainda.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  cidadeValida, cnpjValido, CORS, emailValido, empresaValida, ipDe, limparUf, limparUsuario, mascararEmail,
  nomeValido, resposta, senhaValida, soDigitos, ufValida, urlVolta, usuarioValido,
} from "../_shared/reino-validar.ts";
import { conferirCaptcha, MENSAGEM_CAPTCHA } from "../_shared/reino-captcha.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// C5 do Parecer 1: o Auth só aceita o cabeçalho Sb-Forwarded-For (o IP real de quem está cadastrando)
// quando a chamada usa uma chave SECRETA nova (sb_secret_...). Com a chave publicável, ou com a
// service_role legada, o limite por IP do Auth conta o IP de SAÍDA DESTA FUNÇÃO — ou seja, vira um
// limite do projeto inteiro. Sem o segredo configurado, cai na service_role legada (comportamento de
// antes, só que sem o X-Forwarded-For forjável).
const SECRETA = Deno.env.get("REINO_SECRET_KEY") || SERVICE;
// endereço que o navegador enxerga (no local o SUPABASE_URL de dentro do contêiner é http://kong:8000)
const URL_PUBLICA = (Deno.env.get("REINO_URL_PUBLICA") || SUPABASE_URL).replace(/\/$/, "");
const FOTO_MAX = 2 * 1024 * 1024;
const TITULOS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];
// C6: quando a visita chega sem ?ref=, a indicação é do afiliado da casa — nenhum cadastro fica órfão
// (é o mesmo padrão que o navegador usava em app/servicos/afiliados.js, PADRAO()).
const AFILIADO_PADRAO = (Deno.env.get("REINO_AFILIADO_PADRAO") || "marcelo").toLowerCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sem = { auth: { persistSession: false, autoRefreshToken: false } };
// erro de validação sai com 200 + ok:false (é resposta esperada; o navegador não loga como falha)
const erro = (codigo: string, mensagem: string, campo?: string, status = 200) =>
  resposta({ ok: false, codigo, campo, mensagem }, status);

// confere a assinatura do arquivo, não só o tipo declarado
function tipoDaFoto(b: Uint8Array): "image/webp" | "image/jpeg" | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return erro("metodo", "Use POST.", undefined, 405);

  const ip = ipDe(req);
  const admin = createClient(SUPABASE_URL, SERVICE, sem);
  // true = pode seguir; false = estourou o limite da janela
  const cabe = async (chave: string, max: number, janela = 300) => {
    const { data, error } = await admin.rpc("reino_limite_login", { p_chave: chave, p_max: max, p_janela_seg: janela });
    if (error) { console.error("reino_limite_login", error); return true; } // limite quebrado não pode barrar cadastro
    return data !== false;
  };

  // ---------------------------------------------------------------- checagem do usuário (JSON)
  // C12 do Parecer 1: a RPC usuario_disponivel deixou de ser pública (com a chave publicável dava
  // para varrer a lista de usuários do Reino). A pergunta passa por aqui, com limite por IP: 60
  // checagens em 5 minutos — folgado para quem digita com debounce, curto para quem enumera.
  if ((req.headers.get("content-type") || "").includes("application/json")) {
    const corpo = await req.json().catch(() => ({}));
    if (corpo?.acao !== "usuario_disponivel") return erro("acao", "Ação desconhecida.");
    if (!(await cabe(`chk:${ip}`, 60))) {
      return resposta({ ok: false, codigo: "muitas_tentativas", mensagem: "Muitas checagens seguidas. Aguarde um minuto." }, 429);
    }
    const u = limparUsuario(corpo?.usuario);
    if (!usuarioValido(u)) return resposta({ ok: true, disponivel: false });
    const { data, error } = await admin.rpc("usuario_disponivel", { p_usuario: u });
    if (error) { console.error("usuario_disponivel", error); return erro("servidor", "Não foi possível conferir agora.", undefined, 500); }
    return resposta({ ok: true, disponivel: data === true });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return erro("corpo", "Envio inválido. Recarregue a página e tente de novo."); }
  const txt = (k: string) => String(form.get(k) ?? "").trim();

  const nome = txt("nome").replace(/\s+/g, " ");
  const empresa = txt("empresa").replace(/\s+/g, " ");
  const cnpj = soDigitos(form.get("cnpj"));
  const cidade = txt("cidade").replace(/\s+/g, " ");
  const uf = limparUf(form.get("uf"));
  const email = txt("email").toLowerCase();
  const usuario = limparUsuario(form.get("usuario"));
  const senha = String(form.get("senha") ?? "");
  const indicadoPor = txt("indicado_por").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;
  const foto = form.get("foto");
  const titulo = TITULOS.includes(txt("titulo")) ? txt("titulo") : null; // título escolhido antes (opcional)
  // C6: o clique que trouxe esta pessoa e o aparelho dela — só para a linha de `cadastros`
  const visitaId = UUID_RE.test(txt("visita_id")) ? txt("visita_id") : null;
  const dispositivo = txt("dispositivo") === "celular" ? "celular" : "computador";

  // C2 do Parecer 1: limite por IP e por e-mail ANTES de qualquer trabalho (banco, Storage, Auth).
  // 10 cadastros por IP em 5 minutos: nenhuma pessoa real faz isso; um script faz em segundos.
  // 5 tentativas com o MESMO e-mail em 5 minutos: trava o uso do cadastro para encher a caixa de
  // entrada de outra pessoa. O limite vem antes do CAPTCHA porque é mais barato.
  if (!(await cabe(`cad:ip:${ip}`, 10))) {
    return erro("muitas_tentativas", "Muitos cadastros seguidos deste acesso. Aguarde alguns minutos e tente de novo.", undefined, 429);
  }
  if (email && !(await cabe(`cad:email:${email}`, 5))) {
    return erro("muitas_tentativas", "Já tentamos esse e-mail várias vezes agora há pouco. Aguarde alguns minutos.", "email", 429);
  }
  // CAPTCHA: enquanto o segredo TURNSTILE_SECRET não existir, passa sem token (fase tolerante).
  {
    const v = await conferirCaptcha(form.get("captcha_token"), ip);
    if (!v.ok) {
      console.error("captcha recusado no cadastro:", v.codigos.join(","));
      return erro("captcha", MENSAGEM_CAPTCHA, undefined, 403);
    }
  }

  if (!nomeValido(nome)) return erro("campo_invalido", "Digite seu nome completo (nome e sobrenome).", "nome");
  if (!empresaValida(empresa)) return erro("campo_invalido", "Digite o nome da sua empresa.", "empresa");
  if (!cnpjValido(cnpj)) return erro("campo_invalido", "Esse CNPJ não é válido. Confira os números.", "cnpj");
  if (!cidadeValida(cidade)) return erro("campo_invalido", "Digite a cidade da sua empresa.", "cidade");
  if (!ufValida(uf)) return erro("campo_invalido", "Escreva a cidade e a UF, assim: Campinas, SP.", "cidade");
  if (!(foto instanceof File) || foto.size === 0) return erro("campo_invalido", "Envie uma foto de perfil.", "foto");
  if (foto.size > FOTO_MAX) return erro("campo_invalido", "A foto passou de 2 MB. Escolha outra.", "foto");
  if (!emailValido(email)) return erro("campo_invalido", "Digite um e-mail válido.", "email");
  if (!usuarioValido(usuario)) return erro("campo_invalido", "Usuário: 3 a 24 letras minúsculas, números, ponto ou sublinhado.", "usuario");
  if (!senhaValida(senha)) return erro("campo_invalido", "A senha precisa de pelo menos 8 caracteres.", "senha");

  const bytes = new Uint8Array(await foto.arrayBuffer());
  const tipo = tipoDaFoto(bytes);
  if (!tipo) return erro("campo_invalido", "A foto precisa ser WebP ou JPEG.", "foto");

  // CNPJ único: uma empresa, um cadastro (o índice perfis_cnpj_unico cobre a corrida entre dois envios)
  const { data: cnpjJa, error: eCnpj } = await admin.rpc("reino_cnpj_existe", { p_cnpj: cnpj });
  if (eCnpj) { console.error("reino_cnpj_existe", eCnpj); return erro("servidor", "Não foi possível conferir o CNPJ agora. Tente de novo.", undefined, 500); }
  if (cnpjJa === true) return erro("cnpj_em_uso", "Esse CNPJ já tem cadastro no Reino. Se a empresa é sua, use \"Já tenho conta\".", "cnpj");
  const { data: livre, error: eLivre } = await admin.rpc("usuario_disponivel", { p_usuario: usuario });
  if (eLivre) { console.error("usuario_disponivel", eLivre); return erro("servidor", "Não foi possível conferir o usuário agora. Tente de novo.", undefined, 500); }
  if (livre !== true) return erro("usuario_indisponivel", "Esse usuário já existe. Escolha outro.", "usuario");
  const { data: existe, error: eExiste } = await admin.rpc("reino_email_existe", { p_email: email });
  if (eExiste) { console.error("reino_email_existe", eExiste); return erro("servidor", "Não foi possível conferir o e-mail agora. Tente de novo.", undefined, 500); }
  if (existe === true) return erro("email_em_uso", "Esse e-mail já tem conta no Reino. Use \"Já tenho conta\".", "email");

  // signup com a chave SECRETA e o IP real de quem está cadastrando (C5): o Auth aplica as regras
  // dele, manda o e-mail de confirmação e conta o limite por IP na conta de quem pediu, não da
  // função. Só o Sb-Forwarded-For vai — o X-Forwarded-For do cliente é forjável e a plataforma o
  // reescreve de qualquer jeito. Com chave secreta o Auth pula o CAPTCHA dele, e está certo: quem
  // já validou o token foi esta função, logo acima (o token do Turnstile é de uso único).
  const servidor = createClient(SUPABASE_URL, SECRETA, { ...sem, global: { headers: { "Sb-Forwarded-For": ip } } });
  const { data, error } = await servidor.auth.signUp({
    email, password: senha,
    options: { emailRedirectTo: urlVolta(form.get("redirecionar")), data: { nome, empresa, cnpj, cidade, uf, usuario, titulo, indicado_por: indicadoPor } },
  });
  if (error) {
    const m = `${error.code || ""} ${error.message || ""}`;
    if (/already|registered|exists/i.test(m)) return erro("email_em_uso", "Esse e-mail já tem conta no Reino. Use \"Já tenho conta\".", "email");
    if (/database error/i.test(m)) {
      // o banco recusou o perfil: ou o usuário ou o CNPJ acabou de ser ocupado por outro envio
      const { data: cnpjAgora } = await admin.rpc("reino_cnpj_existe", { p_cnpj: cnpj });
      if (cnpjAgora === true) return erro("cnpj_em_uso", "Esse CNPJ acabou de ser cadastrado por outra pessoa. Se a empresa é sua, use \"Já tenho conta\".", "cnpj");
      return erro("usuario_indisponivel", "Esse usuário acabou de ser escolhido por outra pessoa. Escolha outro.", "usuario");
    }
    if (/rate|too many|over_email/i.test(m)) return erro("limite", "Muitos cadastros seguidos agora. Aguarde alguns minutos e tente de novo.", undefined, 429);
    if (/weak|password/i.test(m)) return erro("campo_invalido", "Essa senha é fraca demais. Escolha outra.", "senha");
    if (/email/i.test(m)) return erro("campo_invalido", "Esse e-mail não foi aceito. Confira e tente de novo.", "email");
    console.error("signUp", error);
    return erro("servidor", "Não foi possível criar a conta agora. Tente de novo.", undefined, 500);
  }
  const user = data.user;
  // e-mail já confirmado em outra conta: o Auth devolve um usuário "de mentira" sem identidades
  if (!user || (Array.isArray(user.identities) && user.identities.length === 0)) {
    return erro("email_em_uso", "Esse e-mail já tem conta no Reino. Use \"Já tenho conta\".", "email");
  }

  // foto → Storage; se falhar, desfaz a conta para a pessoa poder tentar de novo com o mesmo e-mail/usuário
  const arquivo = `${user.id}.${tipo === "image/webp" ? "webp" : "jpg"}`;
  const { error: eUp } = await admin.storage.from("avatares").upload(arquivo, bytes, { contentType: tipo, upsert: true, cacheControl: "3600" });
  let link = "";
  if (!eUp) {
    link = `${URL_PUBLICA}/storage/v1/object/public/avatares/${arquivo}?v=${Date.now()}`;
    const { error: ePerfil } = await admin.from("perfis").update({ foto: link }).eq("id", user.id);
    if (ePerfil) console.error("perfis.foto", ePerfil);
  }
  if (eUp) {
    console.error("upload avatar", eUp);
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
    return erro("servidor", "Não foi possível salvar sua foto agora. Tente de novo.", "foto", 500);
  }

  // C6 (Parecer 1): a linha de indicação nasce AQUI, com a chave de serviço, amarrada ao user.id
  // recém-criado — o navegador não insere mais em `cadastros` (era forjável com a chave pública,
  // e o ranking e a comissão saem dessas linhas). A chave primária é o próprio user.id: uma conta,
  // um registro, sem duplicata nem corrida. Falhar aqui NÃO derruba o cadastro: a conta já existe.
  {
    const { error: eCad } = await admin.from("cadastros").insert({
      id: user.id,
      codigo: indicadoPor || AFILIADO_PADRAO,
      visita_id: visitaId,
      nome, email, titulo, cidade, uf, dispositivo,
      criado_em: new Date().toISOString(),
    });
    if (eCad) console.error("cadastros.insert", eCad);
  }

  if (data.session) {
    return resposta({ ok: true, confirmar: false, access_token: data.session.access_token, refresh_token: data.session.refresh_token, user: { id: user.id, email: user.email }, foto: link });
  }
  return resposta({ ok: true, confirmar: true, email_mascarado: mascararEmail(email), foto: link });
});
