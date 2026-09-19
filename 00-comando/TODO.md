# TODO — REINO (app Babel OS)

Cada pedido do fundador vira uma seção por letra. `[x]` concluído com evidência no
`logs/LOG.md`; `[ ]` pendente. Nada sai desta lista sem ser feito ou descartado por escrito.

## A — "essa é a pasta atualizada do reino, vamos trabalhar nela com supabase e Vercel com dominio proprio" (18/09)
- [x] A1 Aplicar o zip `Babel OS Design System-4` na pasta (backup em `~/Downloads/Reino-backup-2026-09-18`)
- [x] A2 Repositório `contatobabelos-svg/reino` com a versão nova
- [x] A3 Projeto Vercel `o-reino` (time Babel OS) ligado ao GitHub, deploy a cada push
- [x] A4 Supabase `fxlansnepokjxdikxocb` conectado ao app
- [ ] A5 Domínio próprio — `reino.com` indisponível; opções: `oreino.app`, `reinobabel.com`, `reino.com.br` (Registro.br). **Aguarda escolha do fundador**
- [ ] A6 Apagar projetos duplicados `reino` (time Babel OS e `theus-veyras-projects`). **Aguarda confirmação**

## B — "resolver as questões de segurança e de scroll na tela toda" (19/09)
- [x] B1 RLS por dono no Supabase (`supabase/2026-09-19_seguranca_rls_por_dono.sql`)
- [x] B2 Painel admin com o login do administrador; link `?adm=` removido
- [x] B3 Token do login renovado sozinho; perfil e código voltam a gravar
- [x] B4 Rolagem: globo e mapa deixam a página rolar; roda sobre cabeçalho, menu e barra inferior
- [x] B5 Site servindo os fontes (`montar-site.sh`), não o pacote antigo
- [ ] B6 Testar o painel admin logado como `adm…@reino.app` (fundador)
- [ ] B7 Ligar "proteção contra senhas vazadas" no painel do Supabase (fundador)
- [ ] B8 Restringir a chave `REINO_GOOGLE` ao domínio no Google Cloud (fundador)

## C — "crie uma pasta .claude assim" (19/09)
- [x] C1 `.claude/settings.json` + `hooks/injetar-contexto.sh` nos 4 eventos
- [x] C2 5 agentes (Ourives, Heraldo, Theus, Escudeiro, Escriba)
- [x] C3 9 skills de `anthropics/skills` e `obra/superpowers`
- [x] C4 `CLAUDE.md` com bloco `REGRAS-ESSENCIAIS` e `.claude/README.md`

## D — "use isso também" (aula de 13/09) (19/09)
- [x] D1 Aula guardada em `06-aulas/AULA-COMPLETA-13-09.md`, com nota de origem
- [x] D2 Método da aula no `CLAUDE.md`: TODO por seções, LOG, log por agente, proibições
- [x] D3 Agentes no esqueleto de 5 partes (fontes, padrões/proibido, log, entrega, confirmar modelo)
- [ ] D4 **Conflito para decidir:** o app mostra números que a aula manda não publicar —
      "Bônus acumulado R$ 245,50" no Dashboard e a tabela `COMISSAO` em `ui_kits/babel-os/afiliados.js`
      (Imperador 997 … Visconde 57, Barão)
- [ ] D5 **Conflito para decidir:** o app tem o título **Barão**; a aula define 7 níveis
      (Visconde → Imperador), sem Barão
- [ ] D6 **Conflito para decidir:** a aula usa a paleta heráldica v2 e EB Garamond (site e insígnias);
      o app usa Exo 2 + Inter e o visual holograma. Confirmar que são superfícies diferentes
