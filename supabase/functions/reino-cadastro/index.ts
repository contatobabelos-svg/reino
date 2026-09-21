// Reino · cadastro do login imersivo (W). Recebe multipart/form-data:
//   nome, empresa, cnpj, email, usuario, senha, foto (arquivo webp/jpeg), indicado_por?, titulo?, redirecionar?
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
  cnpjValido, CORS, emailValido, empresaValida, ipDe, limparUsuario, mascararEmail, nomeValido, resposta,
  senhaValida, soDigitos, urlVolta, usuarioValido,
} from "../_shared/reino-validar.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// endereço que o navegador enxerga (no local o SUPABASE_URL de dentro do contêiner é http://kong:8000)
const URL_PUBLICA = (Deno.env.get("REINO_URL_PUBLICA") || SUPABASE_URL).replace(/\/$/, "");
const FOTO_MAX = 2 * 1024 * 1024;
const TITULOS = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei", "Imperador"];

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

  let form: FormData;
  try { form = await req.formData(); } catch { return erro("corpo", "Envio inválido. Recarregue a página e tente de novo."); }
  const txt = (k: string) => String(form.get(k) ?? "").trim();

  const nome = txt("nome").replace(/\s+/g, " ");
  const empresa = txt("empresa").replace(/\s+/g, " ");
  const cnpj = soDigitos(form.get("cnpj"));
  const email = txt("email").toLowerCase();
  const usuario = limparUsuario(form.get("usuario"));
  const senha = String(form.get("senha") ?? "");
  const indicadoPor = txt("indicado_por").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;
  const foto = form.get("foto");
  const titulo = TITULOS.includes(txt("titulo")) ? txt("titulo") : null; // título escolhido antes (opcional)

  if (!nomeValido(nome)) return erro("campo_invalido", "Digite seu nome completo (nome e sobrenome).", "nome");
  if (!empresaValida(empresa)) return erro("campo_invalido", "Digite o nome da sua empresa.", "empresa");
  if (!cnpjValido(cnpj)) return erro("campo_invalido", "Esse CNPJ não é válido. Confira os números.", "cnpj");
  if (!(foto instanceof File) || foto.size === 0) return erro("campo_invalido", "Envie uma foto de perfil.", "foto");
  if (foto.size > FOTO_MAX) return erro("campo_invalido", "A foto passou de 2 MB. Escolha outra.", "foto");
  if (!emailValido(email)) return erro("campo_invalido", "Digite um e-mail válido.", "email");
  if (!usuarioValido(usuario)) return erro("campo_invalido", "Usuário: 3 a 24 letras minúsculas, números, ponto ou sublinhado.", "usuario");
  if (!senhaValida(senha)) return erro("campo_invalido", "A senha precisa de pelo menos 8 caracteres.", "senha");

  const bytes = new Uint8Array(await foto.arrayBuffer());
  const tipo = tipoDaFoto(bytes);
  if (!tipo) return erro("campo_invalido", "A foto precisa ser WebP ou JPEG.", "foto");

  const admin = createClient(SUPABASE_URL, SERVICE, sem);
  const { data: livre, error: eLivre } = await admin.rpc("usuario_disponivel", { p_usuario: usuario });
  if (eLivre) { console.error("usuario_disponivel", eLivre); return erro("servidor", "Não foi possível conferir o usuário agora. Tente de novo.", undefined, 500); }
  if (livre !== true) return erro("usuario_indisponivel", "Esse usuário já existe. Escolha outro.", "usuario");
  const { data: existe, error: eExiste } = await admin.rpc("reino_email_existe", { p_email: email });
  if (eExiste) { console.error("reino_email_existe", eExiste); return erro("servidor", "Não foi possível conferir o e-mail agora. Tente de novo.", undefined, 500); }
  if (existe === true) return erro("email_em_uso", "Esse e-mail já tem conta no Reino. Use \"Já tenho conta\".", "email");

  // signup normal com a chave pública: o Auth aplica as regras dele e manda o e-mail de confirmação
  const ip = ipDe(req);
  const publico = createClient(SUPABASE_URL, ANON, { ...sem, global: { headers: { "X-Forwarded-For": ip, "sb-forwarded-for": ip } } });
  const { data, error } = await publico.auth.signUp({
    email, password: senha,
    options: { emailRedirectTo: urlVolta(form.get("redirecionar")), data: { nome, empresa, cnpj, usuario, titulo, indicado_por: indicadoPor } },
  });
  if (error) {
    const m = `${error.code || ""} ${error.message || ""}`;
    if (/already|registered|exists/i.test(m)) return erro("email_em_uso", "Esse e-mail já tem conta no Reino. Use \"Já tenho conta\".", "email");
    if (/database error/i.test(m)) return erro("usuario_indisponivel", "Esse usuário acabou de ser escolhido por outra pessoa. Escolha outro.", "usuario");
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

  if (data.session) {
    return resposta({ ok: true, confirmar: false, access_token: data.session.access_token, refresh_token: data.session.refresh_token, user: { id: user.id, email: user.email }, foto: link });
  }
  return resposta({ ok: true, confirmar: true, email_mascarado: mascararEmail(email), foto: link });
});
