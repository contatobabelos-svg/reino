/* Dados de demonstração do UI kit — subconjunto de app/js/dados-demo.js do produto
   (10 pessoas e 29 empresas inventadas; qualquer semelhança é coincidência). */
window.BABEL_DEMO = {
  perfil: { nome: "Marcelo", titulo: "Imperador", cidade: "Campinas", uf: "SP", bairro: "Cambuí" },
  kpis: [
    { label: "Empresas no Reino", value: "2.041", trend: 12 },
    { label: "Avaliações", value: "8.317", trend: 8 },
    { label: "Cidades ativas", value: "346", trend: 4 },
    { label: "Nota média", value: "4,6", suffix: "★", trend: 0.1 },
  ],
  feed: [
    { autor: "Marcelo", empresa: "Reino", quando: "2 min", texto: "Reino, hoje abrimos o Mapa do Brasil inteiro para os Imperadores. Explorem os territórios e chamem quem ainda não entrou.", curtidas: 58, comentarios: 14 },
    { autor: "Ana Ribeiro", empresa: "Pulso Marketing Digital", quando: "8 min", texto: "Abrimos agenda para diagnósticos gratuitos de presença digital esta semana.", curtidas: 24, comentarios: 6 },
    { autor: "Camila Duarte", empresa: "Pinheiro Tech Solutions", quando: "35 min", texto: "Procuramos parceiros de contabilidade em Curitiba para atender startups.", curtidas: 17, comentarios: 9 },
    { autor: "Eduarda Lopes", empresa: "Capibaribe Clínica", quando: "1 h", texto: "Nova unidade inaugurada no bairro da Boa Vista. Obrigada, Reino!", curtidas: 41, comentarios: 12 },
    { autor: "Henrique Alves", empresa: "Planalto Consultoria", quando: "3 h", texto: "Guilda Planalto aberta para escritórios do Centro-Oeste.", curtidas: 13, comentarios: 3 },
    { autor: "Gabriela Rocha", empresa: "Pampa Marketing", quando: "5 h", texto: "Case: +38% de leads para uma imobiliária de Porto Alegre em 60 dias.", curtidas: 29, comentarios: 5 },
    { autor: "Felipe Nunes", empresa: "Orla Saúde Integrada", quando: "ontem", texto: "Buscamos agência de marketing no Rio para campanha de check-up.", curtidas: 8, comentarios: 4 },
  ],
  match: [
    { nome: "Conta Certa Contabilidade", nicho: "Contabilidade", cidade: "Campinas", compatibilidade: 96 },
    { nome: "Balanço Fiel Contadores", nicho: "Contabilidade", cidade: "Uberlândia", compatibilidade: 88 },
    { nome: "Lar Ideal Imóveis", nicho: "Imobiliária", cidade: "Ribeirão Preto", compatibilidade: 88 },
    { nome: "Capixaba Imóveis", nicho: "Imobiliária", cidade: "Vitória", compatibilidade: 76 },
    { nome: "Vale Norte Logística", nicho: "Logística", cidade: "Goiânia", compatibilidade: 84 },
    { nome: "Sul Design Studio", nicho: "Design", cidade: "Curitiba", compatibilidade: 81 },
    { nome: "Prisma Seguros", nicho: "Seguros", cidade: "Belo Horizonte", compatibilidade: 79 },
    { nome: "Maré Alta Turismo", nicho: "Turismo", cidade: "Salvador", compatibilidade: 74 },
    { nome: "Cerrado Energia Solar", nicho: "Energia", cidade: "Brasília", compatibilidade: 72 },
  ],
  metricas: [
    { nome: "Avaliações feitas", rotulo: "14 / 25", percentual: 56 },
    { nome: "Empresas cadastradas", rotulo: "3 / 5", percentual: 60 },
    { nome: "Conexões de match", rotulo: "6 / 10", percentual: 60 },
  ],
  conquistas: [
    { nome: "Primeiro passo", descricao: "Cadastrou a primeira empresa no Reino.", desbloqueada: true },
    { nome: "Crítico honesto", descricao: "Fez 10 avaliações.", desbloqueada: false, progresso: 56 },
    { nome: "Construtor", descricao: "Cadastrou 3 empresas.", desbloqueada: true },
    { nome: "Casamenteiro", descricao: "Fechou 10 conexões de match.", desbloqueada: false, progresso: 60 },
    { nome: "Guildeiro", descricao: "Entrou em uma guilda.", desbloqueada: true },
    { nome: "Rumo ao trono", descricao: "Alcançou o título de Príncipe.", desbloqueada: false, progresso: 64 },
  ],
  minhaGuilda: {
    nome: "Guilda Paulista", lider: "Ana Ribeiro", pontos: 3840,
    membros: [{ nome: "Ana Ribeiro", titulo: "Rei" }, { nome: "Marcelo", titulo: "Imperador" }, { nome: "Diego Martins", titulo: "Barão" }, { nome: "Felipe Nunes", titulo: "Duque" }],
  },
  guildas: [
    { nome: "Guilda Paulista", nicho: "Multinicho", regiao: "Sudeste", membros: 4, pontos: 3840 },
    { nome: "Guilda Araucária", nicho: "Tecnologia", regiao: "Sul", membros: 2, pontos: 2210 },
    { nome: "Guilda Planalto", nicho: "Advocacia", regiao: "Centro-Oeste", membros: 2, pontos: 1760 },
    { nome: "Guilda do Nordeste", nicho: "Saúde", regiao: "Nordeste", membros: 2, pontos: 1490 },
  ],
  titulos: [
    { nome: "Imperador", mensalidade: 997, descricao: "Comanda o mapa do Brasil inteiro.", mapa: "Brasil", beneficios: ["Mapa do Brasil inteiro", "Grupo de Imperador no feed de negócios"] },
    { nome: "Rei", mensalidade: 497, descricao: "Comanda o Brasil dividido por regiões.", mapa: "Brasil por regiões", beneficios: ["Mapa do Brasil por regiões", "Grupo de Rei no feed de negócios"] },
    { nome: "Príncipe", mensalidade: 247, descricao: "Comanda uma região e seus estados.", mapa: "Região com estados", beneficios: ["Mapa da região com os estados", "Grupo de Príncipe no feed de negócios"] },
    { nome: "Duque", mensalidade: 97, descricao: "Comanda um estado e suas cidades.", mapa: "Estado com cidades", beneficios: ["Mapa do estado com as cidades", "Grupo de Duque no feed de negócios"] },
    { nome: "Marquês", mensalidade: 77, descricao: "Fala no Bate Papo do Reino.", mapa: "Estado com cidades", beneficios: ["Inteligência de Mercado do Reino", "Envia mensagem no Bate Papo do Reino"] },
    { nome: "Conde", mensalidade: 67, descricao: "Destaque em uma cidade.", mapa: "Estado com cidades", beneficios: ["E-mail próprio", "Gestor Financeiro", "Perfil verificado", "Vitrine destacada"] },
    { nome: "Visconde", mensalidade: 57, descricao: "Primeiro degrau da nobreza.", mapa: "Estado com cidades", beneficios: ["Perfil no Reino", "Acesso ao Clube de Benefícios"] },
    { nome: "Barão", mensalidade: 47, descricao: "Entrada no Reino.", mapa: "Estado com cidades", beneficios: ["Perfil no Reino"] },
  ],

  /* Do mapa mental: o título define o alcance do mapa e quem fala no Bate Papo. */
  regras: {
    alcanceMapa: { Imperador: "Brasil", Rei: "Brasil por regiões", "Príncipe": "Região com estados" },
    alcanceMapaPadrao: "Estado com cidades",
    chatFala: ["Marquês", "Duque", "Príncipe", "Rei", "Imperador"],
  },

  noticias: [
    { fonte: "Mercado", titulo: "Selic mantida: o que muda para o custo de crédito das PMEs", quando: "12 min", tag: "Finanças" },
    { fonte: "Reino", titulo: "Programa de afiliados paga bônus extra por indicação de Duque", quando: "1 h", tag: "Afiliados" },
    { fonte: "Mercado", titulo: "Serviços puxam alta do varejo no trimestre", quando: "3 h", tag: "Finanças" },
    { fonte: "Reino", titulo: "Vitrine Premium passa a aparecer no topo da Busca Inteligente", quando: "ontem", tag: "Afiliados" },
  ],

  academy: [
    { nome: "Primeiros passos no Reino", aulas: 6, duracao: "42 min", progresso: 100, nivel: "Barão" },
    { nome: "Como indicar e ganhar comissão", aulas: 8, duracao: "1 h 10", progresso: 62, nivel: "Visconde" },
    { nome: "Fechando negócios pelo Match", aulas: 5, duracao: "38 min", progresso: 20, nivel: "Conde" },
    { nome: "Inteligência de Mercado do Reino", aulas: 9, duracao: "1 h 35", progresso: 0, nivel: "Marquês" },
    { nome: "Liderando uma guilda", aulas: 7, duracao: "55 min", progresso: 0, nivel: "Duque" },
    { nome: "Território e expansão regional", aulas: 4, duracao: "31 min", progresso: 0, nivel: "Príncipe" },
  ],

  eventos: [
    { nome: "Encontro da Guilda Paulista", data: "22 set · 19h", local: "Campinas · SP", tipo: "Presencial", vagas: "12 vagas" },
    { nome: "Live: Inteligência de Mercado", data: "25 set · 20h", local: "Online", tipo: "Online", vagas: "aberto" },
    { nome: "Rodada de negócios do Sudeste", data: "02 out · 14h", local: "São Paulo · SP", tipo: "Presencial", vagas: "8 vagas" },
    { nome: "Posse dos novos Duques", data: "10 out · 19h", local: "Online", tipo: "Online", vagas: "aberto" },
  ],

  gruposFeed: ["Grupo de Imperador", "Grupo de Rei", "Grupo de Príncipe", "Grupo de Duque"],

  /* Rede ao vivo do mapa: x/y em % (uso em painel fixo) e dLng/dLat em graus em
     relação ao centro do bairro (uso ancorado ao globo, nível bairro ≈ 2 km).
     Sem fotos — os dados do produto não têm imagens de pessoas. */
  rede: {
    nos: [
      { id: "conta-certa", nome: "Conta Certa", nicho: "Contabilidade", cidade: "Campinas", estado: "SP", x: 22, y: 34, dLng: -0.0062, dLat: 0.0034 },
      { id: "pulso", nome: "Pulso Marketing", nicho: "Marketing", cidade: "São Paulo", estado: "SP", x: 48, y: 22, dLng: -0.0004, dLat: 0.0061 },
      { id: "nuvem-azul", nome: "Nuvem Azul", nicho: "Tecnologia", cidade: "São Paulo", estado: "SP", x: 72, y: 32, dLng: 0.005, dLat: 0.004 },
      { id: "ribeiro", nome: "Ribeiro & Assoc.", nicho: "Advocacia", cidade: "Sorocaba", estado: "SP", x: 34, y: 58, dLng: -0.0036, dLat: -0.0018 },
      { id: "orla", nome: "Orla Saúde", nicho: "Saúde", cidade: "Santos", estado: "SP", x: 62, y: 66, dLng: 0.0027, dLat: -0.0036 },
      { id: "pampa", nome: "Pampa Marketing", nicho: "Marketing", cidade: "Ribeirão Preto", estado: "SP", x: 84, y: 56, dLng: 0.0074, dLat: -0.0014 },
      { id: "pinheiro", nome: "Pinheiro Tech", nicho: "Tecnologia", cidade: "Campinas", estado: "SP", x: 46, y: 46, dLng: -0.0009, dLat: 0.0009 },
    ],
    raios: [
      ["conta-certa", "pulso"], ["pulso", "nuvem-azul"], ["conta-certa", "pinheiro"],
      ["pinheiro", "orla"], ["pinheiro", "nuvem-azul"], ["ribeiro", "pinheiro"],
      ["orla", "pampa"], ["nuvem-azul", "pampa"], ["ribeiro", "conta-certa"],
    ],
  },

  vitrinePremium: [
    { nome: "Conta Certa Contabilidade", nicho: "Contabilidade", cidade: "Campinas", nota: 4.8 },
    { nome: "Nuvem Azul Tecnologia", nicho: "Tecnologia", cidade: "São Paulo", nota: 4.5 },
  ],
  afiliado: { link: "https://www.babel-os.com/cadastro?ref=demo1234", indicados: 7, comissoesPendentes: 245.5, nivel: "Prata", proximo: "faltam 3 para Ouro", progresso: 70 },

  /* Vendas, Clube, Rede Completa e Chat: módulos novos, sem contrapartida no
     produto — valores fictícios coerentes com a escala do Reino. */
  vendas: [
    { name: "Faturamento total", value: "R$ 128.400", percent: 100 },
    { name: "Faturamento mensal", value: "R$ 32.100", percent: 45 },
    { name: "CPL (custo por lead)", value: "R$ 18,90", percent: 26 },
    { name: "CVR (conversão)", value: "3,4%", percent: 14 },
  ],
  statusNegocios: [
    { name: "Em negociação", value: 45 },
    { name: "Fechados", value: 32 },
    { name: "Agendados", value: 18 },
    { name: "Em espera", value: 5 },
  ],
  negociosSemana: { pontos: [180, 214, 196, 258, 241, 302, 342], rotulos: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] },
  alertas: [
    { tipo: "alta", titulo: "Proposta expirando", texto: "Conta Certa Contabilidade · vence hoje", quando: "5 min" },
    { tipo: "agenda", titulo: "Reunião remarcada", texto: "Pinheiro Tech Solutions · quinta, 14h", quando: "25 min" },
    { tipo: "alta", titulo: "Indicado sem contato", texto: "3 indicados aguardam retorno", quando: "1 h" },
    { tipo: "agenda", titulo: "Evento no Reino", texto: "Encontro da Guilda Paulista · sexta, 19h", quando: "2 h" },
    { tipo: "alta", titulo: "Match novo", texto: "Prisma Seguros quer conversar", quando: "3 h" },
    { tipo: "agenda", titulo: "Aula disponível", texto: "Reino Academy · módulo 2 liberado", quando: "ontem" },
  ],
  beneficios: [
    { nome: "Contabilidade Conta Certa", oferta: "20% na abertura de empresa", nicho: "Contabilidade", validade: "até 30/09" },
    { nome: "Pulso Marketing Digital", oferta: "Diagnóstico de presença digital grátis", nicho: "Marketing", validade: "vagas limitadas" },
    { nome: "Nuvem Azul Tecnologia", oferta: "3 meses de hospedagem sem custo", nicho: "Tecnologia", validade: "até 15/10" },
    { nome: "Ribeiro & Associados", oferta: "Primeira consulta jurídica sem custo", nicho: "Advocacia", validade: "contínuo" },
    { nome: "Orla Saúde Integrada", oferta: "Check-up empresarial com 35% off", nicho: "Saúde", validade: "até 20/10" },
    { nome: "Pampa Marketing", oferta: "Landing page inclusa no primeiro mês", nicho: "Marketing", validade: "até 05/10" },
  ],
  acessos: {
    visitas: [42, 58, 51, 74, 69, 88, 96],
    rotulos: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    origem: [
      { name: "Link direto", value: "218", percent: 100 },
      { name: "Rede social do Reino", value: "134", percent: 61 },
      { name: "Revista", value: "72", percent: 33 },
      { name: "Vitrine", value: "41", percent: 19 },
    ],
    resumo: [
      { label: "Cliques no link", value: "465", trend: 14 },
      { label: "Cadastros", value: "38", trend: 9 },
      { label: "Conversão", value: "8,2", suffix: "%", trend: 1.4 },
      { label: "Comissões pagas", value: "1.980", trend: 22 },
    ],
  },
  conversas: [
    { nome: "Ana Ribeiro", empresa: "Pulso Marketing Digital", ultima: "Fechado, envio a proposta hoje.", quando: "3 min", naoLidas: 2 },
    { nome: "Guilda Paulista", empresa: "4 membros", ultima: "Diego: alguém atende Sorocaba?", quando: "18 min", naoLidas: 5 },
    { nome: "Conta Certa Contabilidade", empresa: "Match 96%", ultima: "Podemos conversar amanhã?", quando: "1 h" },
    { nome: "Camila Duarte", empresa: "Pinheiro Tech Solutions", ultima: "Obrigada pela indicação!", quando: "ontem" },
    { nome: "Rafael Moura", empresa: "Vale Norte Logística", ultima: "Consigo atender Goiânia na semana que vem.", quando: "ontem", naoLidas: 1 },
    { nome: "Bianca Lopes", empresa: "Sul Design Studio", ultima: "Mando o portfólio por aqui.", quando: "ontem" },
    { nome: "Guilda Sul", empresa: "6 membros", ultima: "Marcos: reunião na terça, 10h.", quando: "2 dias" },
  ],
  mensagens: [
    { de: "Ana Ribeiro", texto: "Oi Marcelo! Vi que você entrou na Guilda Paulista.", quando: "09:12" },
    { de: "eu", texto: "Entrei sim. Quero fechar parceria em Campinas.", quando: "09:14" },
    { de: "Ana Ribeiro", texto: "Perfeito. Fechado, envio a proposta hoje.", quando: "09:15" },
  ],
  ativos: [
    { symbol: "PETR4", name: "Petrobras", value: 48.95, changeValue: 0.62, changePercent: 1.28, volume: 32400000, low: 48.1, high: 49.3 },
    { symbol: "VALE3", name: "Vale", value: 77.98, changeValue: -0.5, changePercent: -0.64, volume: 18400000, low: 77.5, high: 78.9 },
    { symbol: "ITUB4", name: "Itaú Unibanco", value: 42.62, changeValue: 0.18, changePercent: 0.41, volume: 21100000, low: 42.3, high: 42.9 },
    { symbol: "BBDC4", name: "Bradesco", value: 16.29, changeValue: -0.11, changePercent: -0.67, volume: 15800000, low: 16.2, high: 16.5 },
    { symbol: "ABEV3", name: "Ambev", value: 15.6, changeValue: -0.18, changePercent: -1.12, volume: 12300000, low: 15.5, high: 15.9 },
    { symbol: "B3SA3", name: "B3", value: 12.44, changeValue: 0.09, changePercent: 0.73, volume: 9800000, low: 12.3, high: 12.6 },
    { symbol: "WEGE3", name: "WEG", value: 38.2, changeValue: 0.72, changePercent: 1.92, volume: 7400000, low: 37.6, high: 38.5 },
    { symbol: "MGLU3", name: "Magazine Luiza", value: 9.8, changeValue: -0.32, changePercent: -3.16, volume: 41200000, low: 9.7, high: 10.2 },
  ].map((a, i) => ({ ...a, points: Array.from({ length: 14 }, (_, k) => a.value * (1 + Math.sin(k + i) * 0.006)) })),
  regioes: [
    { nome: "Sudeste", empresas: 812, cidades: [["São Paulo", "SP", 402], ["Belo Horizonte", "MG", 118], ["Rio de Janeiro", "RJ", 143]] },
    { nome: "Sul", empresas: 421, cidades: [["Curitiba", "PR", 168], ["Porto Alegre", "RS", 131], ["Florianópolis", "SC", 74]] },
    { nome: "Nordeste", empresas: 396, cidades: [["Recife", "PE", 121], ["Salvador", "BA", 138], ["Fortaleza", "CE", 96]] },
    { nome: "Centro-Oeste", empresas: 241, cidades: [["Brasília", "DF", 112], ["Goiânia", "GO", 79], ["Cuiabá", "MT", 50]] },
    { nome: "Norte", empresas: 171, cidades: [["Manaus", "AM", 78], ["Belém", "PA", 62], ["Palmas", "TO", 31]] },
  ],
  notificacoes: [
    { autor: "Match Reino", titulo: "Novo match 96%", texto: "Conta Certa Contabilidade combina com você.", quando: "10 min" },
    { autor: "Conquistas", titulo: "Conquista desbloqueada", texto: "Guildeiro: você entrou na Guilda Paulista.", quando: "2 h" },
  ],
  revista: [
    { edicao: "Nº 3", data: "setembro 2026", titulo: "As guildas que mais cresceram no trimestre", resumo: "Guilda Paulista lidera em pontos; Araucária em novos membros." },
    { edicao: "Nº 2", data: "agosto 2026", titulo: "Match Reino: parcerias que viraram contrato", resumo: "Três histórias de empresas que se conheceram pelo Reino." },
    { edicao: "Nº 1", data: "julho 2026", titulo: "Bem-vindo ao Reino", resumo: "Como funcionam títulos, território e reputação." },
  ],
};
