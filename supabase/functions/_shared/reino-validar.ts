// Reino · validações do cadastro/login no servidor (as mesmas regras do app, em
// app/telas/LoginImersivo.jsx). A lista de usuários reservados é igual à da migração
// 2026-09-21_login_imersivo_usuario_empresa_cnpj.sql (privado.usuario_reservado).

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export const USUARIO_RE = /^[a-z0-9][a-z0-9._]{2,23}$/;
export const RESERVADOS = new Set(["admin", "administrador", "adm", "root", "reino", "babel", "babelos", "babel.os",
  "suporte", "ajuda", "contato", "sistema", "system", "api", "www", "imperador", "oficial", "moderador", "teste"]);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const limparUsuario = (s: unknown) => String(s ?? "").trim().toLowerCase();
export const usuarioValido = (u: string) => USUARIO_RE.test(u) && !RESERVADOS.has(u);
export const soDigitos = (s: unknown) => String(s ?? "").replace(/\D/g, "");

export function cnpjValido(c: string): boolean {
  if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string, pesos: number[]) => {
    const s = pesos.reduce((t, p, i) => t + Number(base[i]) * p, 0) % 11;
    return s < 2 ? 0 : 11 - s;
  };
  const d1 = dv(c, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv(c, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(c[12]) && d2 === Number(c[13]);
}

// nome completo: pelo menos duas palavras, só letras (com acento), espaço, apóstrofo, hífen e ponto
export const nomeValido = (n: string) =>
  n.length >= 5 && n.length <= 80 && /^[\p{L}][\p{L}'’.\- ]+$/u.test(n) && n.split(/\s+/).filter((p) => p.length >= 2).length >= 2;
export const empresaValida = (e: string) => e.length >= 2 && e.length <= 120 && /[\p{L}\p{N}]/u.test(e);
export const senhaValida = (s: string) => s.length >= 8 && s.length <= 72;
export const emailValido = (e: string) => e.length <= 254 && EMAIL_RE.test(e);

// fu***@gm***.com — mostra só o começo do nome e do domínio
export function mascararEmail(email: string): string {
  const [nome, dominio = ""] = email.split("@");
  const partes = dominio.split(".");
  const base = partes.shift() || "";
  const resto = partes.length ? "." + partes.join(".") : "";
  const corta = (s: string, n: number) => s.slice(0, Math.min(n, Math.max(1, s.length - 1))) + "***";
  return corta(nome, 2) + "@" + corta(base, 2) + resto;
}

// IP de quem chamou (para o limite de tentativas e para o Auth limitar por pessoa, não pela função)
export const ipDe = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "desconhecido";

// só aceita voltar para o próprio site (http/https); o Auth ainda confere a lista de URLs permitidas
export function urlVolta(v: unknown): string | undefined {
  try {
    const u = new URL(String(v ?? ""));
    return /^https?:$/.test(u.protocol) ? u.origin + "/" : undefined;
  } catch {
    return undefined;
  }
}
