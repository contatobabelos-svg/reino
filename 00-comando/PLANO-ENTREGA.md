# Plano de entrega profissional do Reino

Pedido do fundador (21/09, seção T do TODO): login funcional; pastas organizadas, com tudo no seu lugar; 300 pessoas
usando o grupo e a rede social ao mesmo tempo; tudo dentro da lei; super responsivo no celular; rápido; seguro; e
nunca perder dado de usuário, **a não ser os stories**.

Diagnóstico de 21/09. O que foi conferido no código e no banco `fxlansnepokjxdikxocb`:

| Tema | Como está hoje |
|---|---|
| Login | Real (Supabase Auth) desde 21/09. Faltam fechar N2–N4. Para enviar os e-mails de confirmação e de senha, o Auth usa o SMTP padrão do Supabase, que manda poucos e-mails por hora. |
| Rede social, grupo e chat | **Tudo de demonstração.** Posts, curtidas, mensagens e stories ficam na memória do navegador e somem ao recarregar. Não há tabelas nem tempo real. |
| Dados do usuário | Fotos, links de campanha e aulas antigas ficam **no localStorage**: se a pessoa trocar de aparelho, perde tudo. As fotos que estão no banco ficam em base64 dentro de uma coluna. |
| Segurança do banco | RLS ligada e `perfis` protegida por trigger. **Mas o `anon` lê a tabela `cadastros` inteira (nome e e-mail de quem se cadastrou)** e lê todos os `cliques`. |
| Velocidade | O JSX é compilado **no navegador** (Babel standalone). O React está na versão de desenvolvimento. São 35 scripts, `_ds_bundle.js` de 4,8 MB e `municipios-tudo.js` de 2,7 MB. No celular, fica lento para abrir. |
| Pastas | Mistura app, exports antigos (`index.html` de 9 MB na raiz, `reino-app.html`, `app-standalone.html`), dados demo, `produto-original/` e material de aula. |
| Botões | Das 26 telas, 26 grupos de botões não fazem nada e 15 telas ou fluxos usam dado fictício (ver `MAPA-TELAS-BOTOES.md`). |
| Ambientes | Só existe produção. Não há ambiente de teste, CI, monitoramento nem teste de carga. |

---

## Fase 0 — Proteger antes de mexer (1º)
1. Exportar o banco inteiro (`pg_dump`) e guardar fora do Supabase, com data no nome.
2. Confirmar o plano do Supabase. O Free pausa o projeto quando fica parado e não tem backup diário restaurável. **Decisão do fundador:** passar para o Pro.
3. Criar um **ambiente de teste**, com o banco de teste separado do de produção e o preview da Vercel apontando para ele. A partir daqui, nada é testado em produção.
4. Tag no git `v0-antes-da-entrega`.

**Pronto quando:** existe um backup baixado e um site de teste com banco próprio.

## Fase 1 — Segurança e dados que não se perdem
1. Fechar os vazamentos da RLS:
   - `cadastros` só para o admin;
   - `cliques` só por agregação;
   - rodar os `get_advisors` de segurança e de performance e zerar os alertas.
2. **Tudo do usuário vai para o banco:**
   - as fotos saem do localStorage e do base64 e vão para o **Storage** (bucket com política por dono e imagem reduzida);
   - links de campanha viram tabela.
3. **Backups:**
   - diário do plano Pro, mais PITR (volta a qualquer minuto) se couber no orçamento;
   - `pg_dump` semanal automático guardado fora do Supabase;
   - teste de restauração uma vez por mês.
4. Nada se apaga de verdade: exclusão com `excluido_em` (soft delete), menos os stories.
5. **Stories** numa tabela própria com `expira_em = criado_em + 24h`, e um cron que apaga os vencidos junto com as mídias. É o único dado que se perde, de propósito.
6. Chaves só no servidor. Revisar as Edge Functions. Limitar as tentativas de login e cadastro, e pôr captcha no cadastro.

**Pronto quando:** o advisor fica sem alertas, um usuário não lê dado de outro (teste automatizado) e a restauração do backup foi testada.

## Fase 2 — Login completo
1. Fechar N2 (sessão e renovação), N3 (esqueci a senha) e N4 (aprovação pelo admin), com testes.
2. **SMTP próprio** (Resend, SES ou similar) com o domínio do Reino. Sem isso, cadastrar 300 pessoas trava nos e-mails.
3. E-mails em português com a marca: confirmação, nova senha, conta aprovada.
4. Excluir a própria conta e baixar os próprios dados (exigência da LGPD).
5. Decidir a atribuição do código padrão, o "marcelo" (P3).

**Pronto quando:** um usuário novo se cadastra, confirma, é aprovado, entra, sai, recupera a senha e exclui a conta, tudo em produção.

## Fase 3 — Pastas organizadas
**21/09: feita a parte das pastas (seção U do TODO)**, sem a troca para o Vite. A estrutura em uso está no `CLAUDE.md`. O Vite (e o `src/`) entra junto com a Fase 4.

Estrutura proposta, com uma pasta por assunto:
```
reino/
├─ app/                  código do app (vira projeto Vite)
│  ├─ src/telas/         uma pasta por tela: Tela.jsx + tela.css
│  ├─ src/componentes/   peças reaproveitadas (FotoAvatar, Stories, Mapa…)
│  ├─ src/servicos/      contas, afiliados, fotos, rede, chat (acesso ao banco)
│  ├─ src/estilos/       tokens e hg-*
│  └─ public/            imagens, vídeos, ícones, manifest
├─ supabase/
│  ├─ migrations/        uma migração por mudança, em ordem
│  ├─ functions/         Edge Functions
│  └─ testes/            testes de RLS
├─ testes/               e2e (Playwright) e carga (k6)
├─ docs/                 README, arquitetura, runbook, LGPD
├─ 00-comando/           TODO, LOG, planos
└─ arquivo/              produto-original, exports antigos, dados demo (fora do build)
```

**Pronto quando:** nenhum arquivo solto na raiz, o `montar-site.sh` foi substituído pelo `vite build` e o README explica onde fica cada coisa.

## Fase 4 — Rápido
1. Migrar para o **Vite**: JSX compilado no build, React de produção, código minificado, um pedaço por tela (lazy), globo e municípios carregados só quando o mapa abre.
2. Dados pesados (`municipios-tudo.js`, `geo-*`) viram JSON comprimido e cacheado, ou consulta no banco.
3. Imagens em webp/avif. Vídeo do login com versão leve para o celular.
4. Cabeçalhos de cache na Vercel e PWA (instalável, abre rápido na segunda vez).

**Metas:** tela de login interativa em até 2,5 s no 4G. JS inicial abaixo de 300 KB. Lighthouse de performance 90 ou mais no celular.

## Fase 5 — Rede social e grupo de verdade (300 simultâneos)
1. Tabelas com RLS e índices:
   - `posts`, `curtidas`, `comentarios`, `seguidores`;
   - `grupos` e `membros`;
   - `conversas` e `mensagens`;
   - `stories` (da Fase 1).
2. **Tempo real** com Supabase Realtime: mensagens do grupo e do chat, curtidas e novos posts.
   - No Free o limite é de 200 conexões em tempo real ao mesmo tempo; no **Pro são 500**, por isso o Pro é obrigatório para 300 pessoas.
3. Feed paginado (cursor), contadores em colunas (sem `count(*)` a cada tela), imagens pelo Storage com miniatura.
4. Limite de envio por usuário (anti-spam). Denunciar, ocultar e apagar post pelo admin (moderação).
5. Regra de propósito que já existe: só de Marquês para cima fala no chat. Levar para a RLS, e não só para a tela.

**Pronto quando:** o teste de carga da Fase 8 passa com 300 usuários.

## Fase 6 — Super responsivo no celular
1. Revisar as 26 telas em 360, 390, 414, 768 e 1024 px, sem rolagem para o lado e com alvos de toque de 44 px.
2. Teclado do celular sem cobrir campos. Safe area do iPhone. Modo retrato e paisagem.
3. Teste em aparelho real: um Android intermediário e um iPhone.
4. Vídeo do login em versão vertical (ou com faixas escuras) no celular.

**Pronto quando:** existe um print de cada tela nas 5 larguras, sem defeito, e o teste nos 2 aparelhos passou.

## Fase 7 — Tudo dentro da lei
1. **LGPD:**
   - política de privacidade e termos de uso, com aceite no cadastro;
   - consentimento para foto e localização (GPS);
   - canal do encarregado;
   - exclusão e exportação dos dados (Fase 2).
2. **Conteúdo:** manter as proibições do CLAUDE.md (sem promessa de renda, % do lucro, contador inflado).
   - resolver entre os sócios os preços e comissões em disputa antes do lançamento;
   - tirar ou identificar claramente todo dado fictício (Bolsa, Match, Vitrine…).
3. **Rede social:** termos de uso com regras de conduta, botão de denúncia e registro de remoção (Marco Civil). Guardar os registros de acesso por 6 meses (Marco Civil, art. 15).
4. Revisão por advogado antes de abrir para o público.

## Fase 8 — Testes, carga e botões mortos
1. **Playwright:** um teste por tela, a partir do `MAPA-TELAS-BOTOES.md`, rodando a cada push.
2. **k6** no ambiente de teste com 300 usuários virtuais durante 15 min:
   - login;
   - abrir o feed;
   - postar;
   - curtir;
   - mandar mensagem no grupo;
   - receber em tempo real.
   - **Meta:** 95% das respostas abaixo de 500 ms e zero erro.
3. Os 26 botões mortos: implementar ou esconder. Nenhum botão sem ação no lançamento.

## Fase 9 — Entrega
1. CI no GitHub: build, testes e checagem de segredos antes do deploy. Deploy em produção só a partir da `main` aprovada.
2. Monitoramento:
   - erros no navegador (Sentry ou similar);
   - alerta de site fora do ar;
   - painel de uso do Supabase.
3. Documentação:
   - README;
   - arquitetura;
   - runbook ("site caiu", "restaurar backup", "aprovar usuário");
   - lista de acessos e chaves.
4. Lançamento em etapas: 20 pessoas → 100 → aberto.

---

## Decisões do fundador (travam fases)
| Decisão | Trava |
|---|---|
| Supabase Pro (e PITR?) | Fases 0, 1 e 5 |
| Serviço de e-mail (SMTP) e domínio | Fase 2 |
| Código padrão "marcelo" (P3) | Fase 2 |
| Preços e comissões em disputa | Fase 7 |
| Botões mortos: implementar ou esconder, tela por tela | Fase 8 |
| Advogado para os termos e a privacidade | Fase 7 |

## Ordem
0 → 1 → 2 rodam em sequência, porque proteger os dados vem antes de tudo. A 3 e a 4 andam juntas (a migração para o Vite já reorganiza as pastas). A 5 depende da 1. A 6 roda em paralelo à 5. A 7 e a 8 fecham antes da 9.
