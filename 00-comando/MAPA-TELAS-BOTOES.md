# Mapa de telas e botões — Reino (babel-os)

Gerado em 2026-09-21 pelo agente explorador (Sonnet 5), conferido pela Vyra. Estado do código: `main` + seção N ainda não commitada.
Etiquetas: **[MORTO]** = não faz nada ou só mostra aviso · **[DEMO]** = depende de dado fictício ou só local (não grava no Supabase).

## Login (LoginScreen.jsx)
Primeira tela quando não há sessão (`App.jsx:116-125`). Modos: entrar, cadastro, esqueci, nova-senha (esse abre sozinho pelo link do e-mail).

| Botão | O que faz | Onde |
|---|---|---|
| Aba "Entrar" / "Criar conta" | Troca o formulário | LoginScreen.jsx:87-88 |
| "Esqueci minha senha" / "Voltar para entrar" | Troca de modo | LoginScreen.jsx:98, 103 |
| Foto do avatar (cadastro) | Câmera/galeria → `ReinoFotos` (localStorage) | LoginScreen.jsx:113 |
| "Tenho um link de afiliado" / "Colar" | Mostra o campo / cola da área de transferência | LoginScreen.jsx:133, 127 |
| "Entrar no Reino" | **Real**: `ReinoContas.entrar` → Supabase Auth | LoginScreen.jsx:54, 137 |
| "Criar minha conta" | **Real**: signup + indicação na tabela `cadastros` | LoginScreen.jsx:55-73 |
| "Enviar link por e-mail" | **Real**: `recuperarSenha` → `/auth/v1/recover` | LoginScreen.jsx:31, 138 |
| "Salvar nova senha" | **Real**: `trocarSenha` → `PUT /auth/v1/user` | LoginScreen.jsx:42, 138 |
| "PC" / "App" | Grava `reino.modo` e alterna `is-modo-app` | App.jsx:120-123 |

## Pré-cadastro (PreCadastroScreen.jsx)
Só se chega pelo Dashboard (aviso "ingresso em análise" ou toast de módulo trancado).

| Botão | O que faz | Onde |
|---|---|---|
| "Já tenho conta" | `ir("index.html")` | :17 |
| Chips de título | Grava `reino.tituloEscolhido` | :29 |
| Selects Região/Estado/Cidade/Nicho | **[MORTO]** sem `onChange`; o mapa é sempre o mesmo EmptyState | :39-49 |
| Copiar do AffiliateLink | **[MORTO]** `onCopy={() => {}}` | :22 |
| "Confirmar ingresso no Reino →" | **[DEMO]** grava só `localStorage.reino.situacao = "membro"` | :59 |

## Navegação global (App.jsx + Sidebar/TopBar/TabBar)

| Elemento | O que faz | Onde |
|---|---|---|
| Logo "Reino" | `<a href="index.html">` (recarrega a página) | Sidebar |
| Itens do menu (18 + 5 do App) | `ir(href)` | App.jsx:56-68, 134 |
| Recolher/expandir menu | Grava `reino.menu` | App.jsx:135-137 |
| Hambúrguer (mobile) | Abre/fecha o menu | App.jsx:139-140 |
| Busca do topo | **[MORTO]** sem `onSearch` | App.jsx:139 |
| Sino | Gaveta com `BABEL_DEMO.notificacoes` **[DEMO]** | App.jsx:140, 151-153 |
| Mensagens | `ir("chat.html")` | App.jsx:140 |
| Cartão do usuário | `ir("perfil.html")` | App.jsx:96-100 |
| Selo "Imperador" | Decorativo (só admin) | App.jsx:88-93 |
| "PC"/"App" | Alterna o modo | App.jsx:77-83 |
| Pílula "Dados fictícios" | **[MORTO]** `href="#"` | App.jsx:141 |
| Barra inferior (Dashboard, Guildas, Clube, Rede, Acessos) | `ir(href)` | App.jsx:150 |

## Dashboard (DashboardScreen.jsx) — primeira tela depois do login

| Botão | O que faz | Onde |
|---|---|---|
| "Personalizar" / "Mostrar de novo" / "Restaurar tudo" / ✕ de cada widget | Mostra ou esconde widgets (`reino.widgets.ocultos`) | :227-362 |
| ‹ › seletor de grupo do feed | Troca o grupo de título **[DEMO]** | :200-208 |
| "Concluir meu ingresso" | `ir("pre-cadastro.html")` | :269 |
| "Abrir rede social" | `ir("rede-social.html")` | :272 |
| Notícias: manchetes / "Ver todas" | **Real** (`reino-apis`) / `ir("noticias.html")` | :33-57 |
| Bate Papo: lista / "Abrir o Bate Papo" | **[DEMO]** / `ir("chat.html")` | :284-289 |
| Música: pílulas, play/pause, "Abrir Música" | **Real** Deezer, prévia de 30 s / navega | :100-120 |
| Assistente: campo + "Ir", "Abrir <tela>", "Abrir Assistente" | **Real** `reino-apis` / navega | :133-162 |
| "Ver conquistas" / "Ver todos os matches" | Navega | :303, 324 |
| "Abrir a Bolsa" / "Meus acessos" | Navega; em pré-cadastro só mostra aviso de trancado | :346-357 |
| Copiar link de afiliado | **Real** (área de transferência) | :362 |
| Toast "Concluir ingresso" | `ir("pre-cadastro.html")` | :370 |

## Reino Academy (AcademyScreen.jsx)

| Botão | O que faz | Onde |
|---|---|---|
| "Importar do YouTube" (admin) + envio | **Real**: Edge Function `academy-importar` → `academy_trilhas`/`academy_aulas` | :44-71 |
| "Cancelar" | Fecha o formulário | :88 |
| "Assistir" (aula do banco) | Modal com YouTube | :156 |
| "Assistir" / "Remover" (aula local) | **[DEMO]** legado em localStorage | :181-182 |
| "Fechar" | Fecha o modal | :209 |

## Níveis (NiveisScreen.jsx)
| "Subir de título" | **[MORTO]** sem `onClick` | :45 |
|---|---|---|

## Eventos (EventosScreen.jsx)
| Botão | O que faz | Onde |
|---|---|---|
| Select "Tipo" | Filtra eventos **[DEMO]** | :13 |
| "Entrar" / "Reservar" | **[MORTO]** | :27 |

## Guildas (GuildasScreen.jsx)
| Botão | O que faz | Onde |
|---|---|---|
| "Criar guilda" | **[MORTO]** | :8 |
| "Entrar" (cada guilda) | **[MORTO]** | :20 |

## Mapa Reino (MapaScreen → Globo em MapaPanel → ReinoMapa)
O zoom e a descida Terra → Brasil → Estado → Cidade → Bairro são gestos no canvas (`globo.js`).

| Botão | O que faz | Onde |
|---|---|---|
| Nó de empresa (NetworkMapLocal) | Cartão da empresa **[DEMO]** | NetworkMapLocal.jsx:42 |
| "← Globo" | Volta pro globo | ReinoMapa.jsx:485 |
| "Buscar empresas aqui" / campo Empresas | **Real**: Google Places | ReinoMapa.jsx:212-230, 486 |
| Busca de endereço | **Real**: Nominatim | ReinoMapa.jsx:435-445 |
| Chips de camada | Liga/desliga. Real: Região (`empresas_reais`), Cliques, Cadastros. **[DEMO]**: Reino/Rede | ReinoMapa.jsx:447-455 |
| "Traçar rota" | Rota real via OSRM (2 cliques) | ReinoMapa.jsx:410-422 |
| "Desenhar área" / "Limpar" | Polígono que conta os pontos dentro / zera | ReinoMapa.jsx:424-432, 514 |
| Clique em ponto/cluster, ✕ dos cartões, tel/site | Detalhe, zoom, fechar, links reais | ReinoMapa.jsx:383-408, 533-567 |

## Rede social (RedeSocialScreen.jsx + Stories.jsx) — tudo **[DEMO]**, nada persiste

| Botão | O que faz | Onde |
|---|---|---|
| Nav Guildas / Mensagens | Navega | :81 |
| Nav Início / Explorar / Notificações / Perfil | **[MORTO]** | :81 |
| "Publicar" (nav) | Foca o compositor | :85 |
| Abas do feed | Filtra o feed local | :92-94 |
| Stories (criar, ver, curtir, responder, apagar, compositor completo) | Só `sessionStorage` | Stories.jsx |
| Compositor: Imagem / Localização / Empresa | **[MORTO]** | :50-52 |
| Compositor: "Publicar" | Post só em memória | :56 |
| Post: Curtir / Repostar | Contador local | :27-31 |
| Post: Responder / Compartilhar | **[MORTO]** | :26, 32 |
| "Buscar no Reino", "Seguir", hashtags | **[MORTO]** | :106-116 |
| "Ver todos os matches" / "Mostrar mais" | Navega | :112, 117 |

## Bate Papo (ChatScreen.jsx) — **[DEMO]**, tudo em memória

| Botão | O que faz | Onde |
|---|---|---|
| Sino de network | Abre o painel de pedidos | :74, 99 |
| "Pesquisar conversa" / "Anexar" | **[MORTO]** | :78, 131 |
| Conversa / menu mobile / clique em mensagem | Abre, volta, seleciona | :82-112 |
| "Fazer network" | Simula o pedido e o aceite (setTimeout) | :118 |
| Enviar, Aceitar/Recusar, "Sim, abrir chat", "Ir para a conversa", ✕ | Estado local | :133-153 |

Regra de propósito: só de Marquês para cima pode enviar mensagem.

## Match (MatchScreen.jsx)
Só leitura **[DEMO]**, sem botões.

## Conquistas (ConquistasScreen.jsx)
| "Ver hierarquia" | **[MORTO]** | :12 |
|---|---|---|

## Clube de Benefícios (ClubeScreen.jsx)
| Botão | O que faz | Onde |
|---|---|---|
| Select "Nicho" | Filtra **[DEMO]** | :16 |
| "Resgatar" | **[MORTO]** | :26 |

## Rede Completa (RedeCompletaScreen.jsx) — ~15 mil empresas **[DEMO]**
| Botão | O que faz | Onde |
|---|---|---|
| Busca, chips de região, nicho, ordenar | Filtros locais | :56-63 |
| Cartão / conexão | Expande / troca de empresa | :79, 101 |
| "Ver no mapa" | Globo voa até a cidade | :106 |
| "Fazer network" | `ir("chat.html")` | :107 |
| "Mostrar mais N" | +24 | :117 |
| Foto da empresa | Só localStorage | FotoAvatar |

## Meus acessos (AcessosScreen.jsx) — **real** (afiliados.js)
| Botão | O que faz | Onde |
|---|---|---|
| "Copiar" / "Compartilhar" | Área de transferência / `navigator.share` | :40-41 |
| Abas Todos / Cadastrou / Clicou | Filtra os indicados reais | :72 |

## Bolsa (BolsaScreen.jsx) — tudo **[DEMO]** (a tela avisa)
| Botão | O que faz | Onde |
|---|---|---|
| Ticker / linha do ativo | Gaveta com detalhe | :22, 62 |
| "Adicionar" ativo | **[MORTO]** | :46-48 |
| Ordenar | Reordena | :49-54 |
| "Lista padrão" | **[MORTO]** | :55 |
| ✕ da gaveta | Fecha | :69 |

## Busca Inteligente (PesquisaScreen.jsx)
| Botão | O que faz | Onde |
|---|---|---|
| Campos + "Pesquisar" | Filtra empresas **[DEMO]** | :13, 33 |
| Painel Google Maps | Aviso fixo de "indisponível" | :59 |

## Vitrine (VitrineScreen.jsx)
Só leitura **[DEMO]**, sem botões.

## Minha conta (PerfilScreen.jsx) — quase tudo **real**
| Botão | O que faz | Onde |
|---|---|---|
| "Sair" | Logout no Supabase + recarrega | :51, 58 |
| "Salvar dados" | Grava na tabela `perfis` | :39, 89 |
| "Verificar" / "Salvar código" | Consulta / grava na tabela `codigos` | :30-35, 97-102 |
| "Copiar link" | Área de transferência | :103 |
| "Trocar" senha | Supabase Auth | :110 |
| "Criar link" de campanha / ✕ | **[DEMO]** lista só em localStorage | :119-129 |
| "Ver meus indicados" | `ir("meus-acessos.html")` | :136 |
| Foto | Só localStorage | :68 |

## Notícias (NoticiasScreen.jsx) — **real**
"Atualizar", abas de editoria, manchetes abrem a notícia original (:45-117).

## Música (MusicaScreen.jsx) — **real** (Deezer)
"Buscar", pílulas, play/pause de 30 s, "Deezer ↗" (:20-87).

## Assistente (AssistenteScreen.jsx) — **real**
Pílulas de pergunta, "Enviar", "Abrir <tela>" (:33-130).

## Contas no banco (AdminScreen.jsx) — **real**, só admin
| Botão | O que faz | Onde |
|---|---|---|
| "Atualizar" | Recarrega perfis/codigos/cliques/cadastros | :115 |
| Busca | Filtro local | :139 |
| "Aprovar" / "Recusar" | `PATCH perfis` com `situacao` membro/recusado | :61, 103-104 |

## Configurações (ConfiguracoesScreen.jsx)
| Botão | O que faz | Onde |
|---|---|---|
| "Salvar" / "Testar conexão" | **[MORTO]** só mostram um aviso | :35-36 |
| 4 switches | **[MORTO]** sem `onChange` | :41-44 |

## Telas órfãs (registradas no App.jsx, sem link nenhum)
- **Hierarquia** (`hierarquia.html`): **[DEMO]**, sem botões.
- **Revista** (`revista.html`): **[DEMO]**, o botão "Ler" nunca aparece (os itens não têm `url`).

## HTMLs avulsos
- `pre-cadastro.html`: vitrine do componente; os botões não navegam.
- `mapa.html`: casca fixa; o menu recarrega a página.
- `reino-app.html`: pacote exportado, sem lógica própria.

## Resumo
- **26 telas** (24 no roteador + Login + Pré-cadastro), 2 delas órfãs. **~150 elementos clicáveis.**
- **Reais no Supabase ou em API:** Login/Cadastro/Recuperação, Minha conta, Meus acessos, Contas no banco, Academy (importar), Notícias, Música, Assistente, camadas Região/Cliques/Cadastros do mapa.
- **[MORTO] (26):** Dados fictícios, busca do topo, Ver hierarquia, Subir de título, Entrar/Reservar evento, Criar/Entrar guilda, Resgatar, Salvar/Testar/switches de Configurações, nav e compositor da Rede social, Responder/Compartilhar, Buscar/Seguir/hashtags, Pesquisar conversa, Anexar, Adicionar ativo, Lista padrão, selects e copiar do Pré-cadastro, HTMLs avulsos, Ler da Revista.
- **[DEMO]:** notificações, Bate Papo, feed, Guildas/Conquistas/Níveis/Match/Clube/Eventos/Vitrine/Hierarquia/Revista, Rede Completa, Busca, Bolsa, camadas Reino/Rede do mapa, Rede social e Stories, links de campanha, confirmar ingresso, aulas locais, fotos.
