/* Babel OS · Reino — DADOS DE DEMONSTRAÇÃO (fictícios)
   Responde aos mesmos endpoints descritos em API.md, sem servidor.
   Ativo quando nenhuma API está configurada e "babel.demo" ≠ "0" (Configurações → Dados de demonstração).
   10 pessoas e 29 empresas inventadas; qualquer semelhança com nomes reais é coincidência. */
(function () {
  "use strict";

  const UF = { RO: "Rondônia", AC: "Acre", AM: "Amazonas", RR: "Roraima", PA: "Pará", AP: "Amapá", TO: "Tocantins", MA: "Maranhão", PI: "Piauí", CE: "Ceará", RN: "Rio Grande do Norte", PB: "Paraíba", PE: "Pernambuco", AL: "Alagoas", SE: "Sergipe", BA: "Bahia", MG: "Minas Gerais", ES: "Espírito Santo", RJ: "Rio de Janeiro", SP: "São Paulo", PR: "Paraná", SC: "Santa Catarina", RS: "Rio Grande do Sul", MS: "Mato Grosso do Sul", MT: "Mato Grosso", GO: "Goiás", DF: "Distrito Federal" };
  const REGIAO_UF = { RO: "norte", AC: "norte", AM: "norte", RR: "norte", PA: "norte", AP: "norte", TO: "norte", MA: "nordeste", PI: "nordeste", CE: "nordeste", RN: "nordeste", PB: "nordeste", PE: "nordeste", AL: "nordeste", SE: "nordeste", BA: "nordeste", MG: "sudeste", ES: "sudeste", RJ: "sudeste", SP: "sudeste", PR: "sul", SC: "sul", RS: "sul", MS: "centro-oeste", MT: "centro-oeste", GO: "centro-oeste", DF: "centro-oeste" };
  const NOME_REGIAO = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
  const CIDADES = {
    "São Paulo": ["SP", -23.55, -46.63], Campinas: ["SP", -22.91, -47.06], "Ribeirão Preto": ["SP", -21.18, -47.81], Santos: ["SP", -23.96, -46.33], Sorocaba: ["SP", -23.5, -47.46],
    "Rio de Janeiro": ["RJ", -22.91, -43.17], Niterói: ["RJ", -22.88, -43.1], "Belo Horizonte": ["MG", -19.92, -43.94], Uberlândia: ["MG", -18.92, -48.28], Vitória: ["ES", -20.32, -40.34],
    Curitiba: ["PR", -25.43, -49.27], Londrina: ["PR", -23.31, -51.16], Florianópolis: ["SC", -27.6, -48.55], Joinville: ["SC", -26.3, -48.85], "Porto Alegre": ["RS", -30.03, -51.23],
    Salvador: ["BA", -12.97, -38.5], Recife: ["PE", -8.05, -34.88], Fortaleza: ["CE", -3.73, -38.53], Goiânia: ["GO", -16.68, -49.25], Brasília: ["DF", -15.79, -47.88],
    Cuiabá: ["MT", -15.6, -56.1], Manaus: ["AM", -3.12, -60.02], Belém: ["PA", -1.46, -48.5],
  };

  const TITULOS = [
    { nome: "Imperador", mensalidade: 997, descricao: "Comanda o mapa do Brasil inteiro." },
    { nome: "Rei", mensalidade: 497, descricao: "Comanda o Brasil dividido por regiões." },
    { nome: "Príncipe", mensalidade: 247, descricao: "Comanda uma região e seus estados." },
    { nome: "Duque", mensalidade: 97, descricao: "Comanda um estado e suas cidades." },
    { nome: "Conde", mensalidade: 67, descricao: "Destaque em uma cidade." },
    { nome: "Barão", mensalidade: 47, descricao: "Entrada no Reino." },
  ];

  const PESSOAS = [
    { nome: "Ana Ribeiro", titulo: "Rei", cidade: "São Paulo" },
    { nome: "Bruno Carvalho", titulo: "Duque", cidade: "Campinas" },
    { nome: "Camila Duarte", titulo: "Príncipe", cidade: "Curitiba" },
    { nome: "Diego Martins", titulo: "Barão", cidade: "Belo Horizonte" },
    { nome: "Eduarda Lopes", titulo: "Conde", cidade: "Recife" },
    { nome: "Felipe Nunes", titulo: "Duque", cidade: "Rio de Janeiro" },
    { nome: "Gabriela Rocha", titulo: "Barão", cidade: "Porto Alegre" },
    { nome: "Henrique Alves", titulo: "Imperador", cidade: "Brasília" },
    { nome: "Isabela Freitas", titulo: "Conde", cidade: "Salvador" },
    { nome: "João Pedro Lima", titulo: "Barão", cidade: "Goiânia" },
  ];
  const EU = PESSOAS[1]; // perfil "logado" na demonstração

  // [nome, nicho, cidade, abrangência, dono (índice em PESSOAS), semanas atrás]
  const EMP = [
    ["Ribeiro & Associados Advocacia", "Advocacia", "São Paulo", "Nacional", 0, 7],
    ["Conta Certa Contabilidade", "Contabilidade", "Campinas", "Regional", 1, 6],
    ["Clínica Vida Plena", "Saúde", "Campinas", "Local", 1, 6],
    ["Pulso Marketing Digital", "Marketing", "São Paulo", "Nacional", 0, 5],
    ["Lar Ideal Imóveis", "Imobiliária", "Ribeirão Preto", "Regional", 3, 5],
    ["Nuvem Azul Tecnologia", "Tecnologia", "São Paulo", "Mundial", 7, 4],
    ["Escola Horizonte", "Educação", "Santos", "Local", 5, 4],
    ["Alicerce Construções", "Construção", "Sorocaba", "Regional", 1, 3],
    ["Martins Consultoria Jurídica", "Advocacia", "Belo Horizonte", "Regional", 3, 7],
    ["Balanço Fiel Contadores", "Contabilidade", "Uberlândia", "Local", 3, 2],
    ["Orla Saúde Integrada", "Saúde", "Rio de Janeiro", "Regional", 5, 6],
    ["Farol Comunicação", "Marketing", "Niterói", "Local", 5, 3],
    ["Capixaba Imóveis", "Imobiliária", "Vitória", "Local", 5, 1],
    ["Araucária Advogados", "Advocacia", "Curitiba", "Regional", 2, 7],
    ["Pinheiro Tech Solutions", "Tecnologia", "Curitiba", "Nacional", 2, 5],
    ["Norte do Paraná Contábil", "Contabilidade", "Londrina", "Local", 2, 2],
    ["Ilha Bela Odontologia", "Saúde", "Florianópolis", "Local", 2, 4],
    ["Ponte Engenharia", "Construção", "Joinville", "Regional", 2, 1],
    ["Pampa Marketing", "Marketing", "Porto Alegre", "Regional", 6, 3],
    ["Guaíba Educação Executiva", "Educação", "Porto Alegre", "Nacional", 6, 0],
    ["Baía de Todos Advocacia", "Advocacia", "Salvador", "Regional", 8, 6],
    ["Recife Contas & Tributos", "Contabilidade", "Recife", "Regional", 4, 4],
    ["Capibaribe Clínica", "Saúde", "Recife", "Local", 4, 2],
    ["Jangada Digital", "Tecnologia", "Fortaleza", "Nacional", 4, 1],
    ["Cerrado Imóveis", "Imobiliária", "Goiânia", "Regional", 9, 3],
    ["Planalto Consultoria", "Advocacia", "Brasília", "Nacional", 7, 5],
    ["Pantanal Construtora", "Construção", "Cuiabá", "Regional", 7, 2],
    ["Rio Negro Saúde", "Saúde", "Manaus", "Regional", 7, 0],
    ["Ver-o-Peso Escola de Idiomas", "Educação", "Belém", "Local", 9, 1],
  ];

  const BAIRROS = ["Jardim Paulista", "Cambuí", "Taquaral", "Vila Madalena", "Jardim Sumaré", "Itaim Bibi", "Gonzaga", "Campolim", "Savassi", "Santa Mônica", "Botafogo", "Icaraí", "Praia do Canto", "Batel", "Batel", "Gleba Palhano", "Lagoa da Conceição", "América", "Moinhos de Vento", "Moinhos de Vento", "Pituba", "Boa Viagem", "Boa Vista", "Aldeota", "Setor Bueno", "Asa Sul", "Goiabeiras", "Adrianópolis", "Umarizal"];

  // Gerador determinístico para avaliações (sempre os mesmos números)
  let semente = 42;
  const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);

  const empresas = EMP.map(([nome, nicho, cidade, abrangencia, dono, semanas], i) => {
    const [uf, lat, lng] = CIDADES[cidade];
    const n = 2 + Math.floor(rnd() * 7);
    const pool = PESSOAS.map((_, k) => k).filter((k) => k !== dono);
    for (let j = pool.length - 1; j > 0; j--) { const t = Math.floor(rnd() * (j + 1)); [pool[j], pool[t]] = [pool[t], pool[j]]; }
    const avaliadores = pool.slice(0, n);
    const notas = avaliadores.map(() => (rnd() < 0.55 ? 5 : rnd() < 0.7 ? 4 : rnd() < 0.8 ? 3 : 2));
    return { id: `demo-${i + 1}`, nome, nicho, cidade, bairro: BAIRROS[i], uf, estado: UF[uf], regiao: REGIAO_UF[uf], lat, lng, abrangencia, dono: PESSOAS[dono].nome, titulo: PESSOAS[dono].titulo, semanas, notas, avaliadores };
  });
  // Base FICTÍCIA do Brasil todo (js/demo-brasil.js): 346 cidades reais, 420 pessoas, ~2 mil empresas
  const DB = window.DEMO_BRASIL;
  if (DB) {
    const base = PESSOAS.length;
    DB.pessoas.forEach(([nome, t]) => PESSOAS.push({ nome, titulo: DB.titulos[t] }));
    DB.empresas.forEach(([nome, ni, ci, ai, dono, semanas, bi], i) => {
      const [cidade, uf, lat, lng] = DB.cidades[ci];
      const n = 1 + Math.floor(rnd() * 9);
      const avaliadores = Array.from({ length: n }, () => base + Math.floor(rnd() * DB.pessoas.length));
      const notas = avaliadores.map(() => (rnd() < 0.5 ? 5 : rnd() < 0.7 ? 4 : rnd() < 0.8 ? 3 : rnd() < 0.7 ? 2 : 1));
      const p = PESSOAS[base + dono];
      empresas.push({ id: `demo-br-${i + 1}`, nome, nicho: DB.nichos[ni], cidade, bairro: DB.bairros[bi], uf, estado: UF[uf], regiao: REGIAO_UF[uf], lat, lng, abrangencia: DB.abrangencias[ai], dono: p.nome, titulo: p.titulo, semanas, notas, avaliadores });
    });
    // companhias listadas: dados reais de nome e sede; nada de nota ou dono inventado
    DB.listadas.forEach(([nome, ticker, ni, ci, bairro]) => {
      const [cidade, uf, lat, lng] = DB.cidades[ci];
      empresas.push({ id: `b3-${ticker}`, nome, ticker, listada: true, nicho: DB.nichos[ni], cidade, bairro, uf, estado: UF[uf], regiao: REGIAO_UF[uf], lat, lng, abrangencia: "Nacional", dono: "Relações com Investidores", titulo: `Listada na B3 · ${ticker}`, semanas: 11, notas: [], avaliadores: [] });
    });
  }

  const media = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const todasNotas = empresas.flatMap((e) => e.notas);
  const r1 = (n) => Math.round(n * 10) / 10;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const publica = (e) => ({ id: e.id, nome: e.nome + (e.ticker ? ` (${e.ticker})` : ""), nicho: e.nicho, cidade: e.cidade, estado: e.estado, uf: e.uf, regiao: NOME_REGIAO[e.regiao], abrangencia: e.abrangencia, nota: e.notas.length ? r1(media(e.notas)) : null, avaliacoes: e.notas.length, listada: !!e.listada });
  const chaveCidade = (e) => `${e.cidade}|${e.uf}`;
  const mesmaCidade = (e, p) => norm(e.cidade) === norm(p.cidade) && (!p.estado || e.uf === String(p.estado).toUpperCase() || norm(e.estado) === norm(p.estado));

  function filtrar(p) {
    return empresas.filter((e) =>
      (!p.q || norm(`${e.nome} ${e.nicho} ${e.cidade}`).includes(norm(p.q))) &&
      (!p.nicho || e.nicho === p.nicho) &&
      (!p.estado || e.estado === p.estado || e.uf === String(p.estado).toUpperCase()) &&
      (!p.cidade || norm(e.cidade) === norm(p.cidade)) &&
      (!p.regiao || norm(NOME_REGIAO[e.regiao]) === norm(p.regiao) || e.regiao === p.regiao));
  }
  const contar = (lst, chave) => lst.reduce((acc, e) => ((acc[e[chave]] = (acc[e[chave]] || 0) + 1), acc), {});

  const NICHOS_COMPLEMENTARES = { Advocacia: ["Contabilidade", "Imobiliária"], Contabilidade: ["Advocacia", "Tecnologia"], Saúde: ["Marketing", "Tecnologia"], Marketing: ["Tecnologia", "Educação"], Imobiliária: ["Construção", "Advocacia"], Tecnologia: ["Marketing", "Contabilidade"], Educação: ["Marketing", "Tecnologia"], Construção: ["Imobiliária", "Advocacia"] };

  const minhas = empresas.filter((e) => e.dono === EU.nome);
  const minhaAvaliacoes = empresas.filter((e) => e.avaliadores.includes(1)).length;

  const rotas = {
    perfil: () => ({ nome: EU.nome, titulo: EU.titulo, cidade: EU.cidade, uf: CIDADES[EU.cidade][0], bairro: empresas.find((e) => e.dono === EU.nome && e.cidade === EU.cidade)?.bairro }),

    "reino/kpis": () => ({
      empresas: { valor: empresas.length, variacao: 12 },
      avaliacoes: { valor: todasNotas.length, variacao: 8 },
      cidades: { valor: new Set(empresas.map(chaveCidade)).size, variacao: 4 },
      notaMedia: { valor: r1(media(todasNotas)), variacao: 0.1, unidadeVariacao: "" },
    }),

    "reino/regioes": () => Object.keys(NOME_REGIAO).map((r) => {
      const doR = empresas.filter((e) => e.regiao === r);
      const porCidade = {};
      doR.forEach((e) => (porCidade[chaveCidade(e)] = (porCidade[chaveCidade(e)] || 0) + 1));
      return { nome: NOME_REGIAO[r], empresas: doR.length, nota: r1(media(doR.flatMap((e) => e.notas))), cidades: Object.entries(porCidade).map(([k, qtd]) => ({ nome: k.split("|")[0], estado: k.split("|")[1], empresas: qtd })) };
    }),

    "reino/mapa": (p) => {
      const base = filtrar({ nicho: p.nicho });
      const porReg = contar(base, "regiao"), porUF = contar(base, "uf");
      const grupos = {};
      base.filter((e) => !p.estado || e.uf === String(p.estado).toUpperCase()).forEach((e) => { const g = (grupos[chaveCidade(e)] ||= { nome: e.cidade, uf: e.uf, lat: e.lat, lng: e.lng, empresas: 0 }); g.empresas++; });
      const cidades = Object.values(grupos);
      return { total: base.length, regioes: porReg, estados: porUF, cidades };
    },

    "reino/filtros": () => ({
      nichos: [...new Set(empresas.map((e) => e.nicho))].sort().map((nome) => ({ nome })),
      estados: [...new Set(empresas.map((e) => e.estado))].sort().map((nome) => ({ nome })),
      cidades: [...new Set(empresas.map((e) => e.cidade))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((nome) => ({ nome })),
    }),

    "reino/empresas": (p) => filtrar(p).map(publica),

    "reino/reputacao": () => ({
      media: r1(media(todasNotas)),
      total: todasNotas.length,
      distribuicao: [5, 4, 3, 2, 1].map((estrelas) => ({ estrelas, quantidade: todasNotas.filter((n) => n === estrelas).length })),
    }),

    "reino/analises": () => {
      const semanas = [7, 6, 5, 4, 3, 2, 1, 0];
      const porNicho = contar(empresas, "nicho");
      return {
        cadastros: semanas.map((s) => ({ rotulo: s === 0 ? "Hoje" : `-${s} sem.`, valor: empresas.filter((e) => e.semanas >= s).length })),
        nichos: Object.entries(porNicho).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, q]) => ({ nome, percentual: Math.round((q / empresas.length) * 100) })),
      };
    },

    "reino/match": (p) => {
      const meusNichos = new Set(minhas.map((e) => e.nicho));
      const alvo = new Set([...meusNichos].flatMap((n) => NICHOS_COMPLEMENTARES[n] || []));
      const minhaUF = CIDADES[EU.cidade][0];
      return empresas
        .filter((e) => alvo.has(e.nicho) && e.dono !== EU.nome && !e.listada)
        .map((e) => ({ ...publica(e), compatibilidade: e.cidade === EU.cidade ? 96 : e.uf === minhaUF ? 88 : REGIAO_UF[minhaUF] === e.regiao ? 76 : 61 }))
        .sort((a, b) => b.compatibilidade - a.compatibilidade)
        .slice(0, Number(p.limite) || 30);
    },

    "reino/vitrine": () => Object.keys(NOME_REGIAO).map((r) => {
      const melhor = empresas.filter((e) => e.regiao === r && e.notas.length >= 4).sort((a, b) => media(b.notas) - media(a.notas) || b.notas.length - a.notas.length)[0];
      return melhor && { ...publica(melhor), regiao: NOME_REGIAO[r] };
    }).filter(Boolean),

    "reino/titulos": () => TITULOS,

    // Bairros de uma cidade, com posição aproximada (demonstração) e contagens
    "reino/bairros": (p) => {
      const daCidade = empresas.filter((e) => mesmaCidade(e, p));
      const nomes = [...new Set(daCidade.map((e) => e.bairro))];
      return nomes.map((nome, k) => {
        const doB = daCidade.filter((e) => e.bairro === nome);
        const ang = (k / Math.max(nomes.length, 1)) * Math.PI * 2 + 0.6;
        const dist = nomes.length > 1 ? (k % 2 ? 0.022 : 0.04) : 0.012;
        return { nome, lat: doB[0].lat + Math.sin(ang) * dist, lng: doB[0].lng + Math.cos(ang) * dist, empresas: doB.length, empresarios: new Set(doB.map((e) => e.dono)).size };
      });
    },

    // Empresários de um bairro, com as empresas de cada um
    "reino/empresarios": (p) => {
      const doB = empresas.filter((e) => mesmaCidade(e, p) && (!p.bairro || norm(e.bairro) === norm(p.bairro)));
      const donos = [...new Set(doB.map((e) => e.dono))];
      return donos.map((nome) => ({
        nome,
        titulo: doB.find((e) => e.dono === nome).titulo,
        empresas: doB.filter((e) => e.dono === nome).map(publica),
      }));
    },

    "conquistas/resumo": () => ({
      progresso: 64, tituloAtual: EU.titulo, proximoTitulo: "Príncipe",
      metricas: [
        { nome: "Avaliações feitas", rotulo: `${minhaAvaliacoes} / 25`, percentual: (minhaAvaliacoes / 25) * 100 },
        { nome: "Empresas cadastradas", rotulo: `${minhas.length} / 5`, percentual: (minhas.length / 5) * 100 },
        { nome: "Conexões de match", rotulo: "6 / 10", percentual: 60 },
      ],
    }),

    conquistas: () => [
      { nome: "Primeiro passo", descricao: "Cadastrou a primeira empresa no Reino.", desbloqueada: true },
      { nome: "Crítico honesto", descricao: "Fez 10 avaliações.", desbloqueada: minhaAvaliacoes >= 10, progresso: Math.min(100, minhaAvaliacoes * 10) },
      { nome: "Construtor", descricao: "Cadastrou 3 empresas.", desbloqueada: minhas.length >= 3, progresso: Math.round((minhas.length / 3) * 100) },
      { nome: "Casamenteiro", descricao: "Fechou 10 conexões de match.", desbloqueada: false, progresso: 60 },
      { nome: "Guildeiro", descricao: "Entrou em uma guilda.", desbloqueada: true },
      { nome: "Rumo ao trono", descricao: "Alcançou o título de Príncipe.", desbloqueada: false, progresso: 64 },
    ],

    "social/feed": (p) => [
      { autor: "Ana Ribeiro", empresa: "Pulso Marketing Digital", quando: "8 min", texto: "Abrimos agenda para diagnósticos gratuitos de presença digital esta semana.", curtidas: 24, comentarios: 6 },
      { autor: "Camila Duarte", empresa: "Pinheiro Tech Solutions", quando: "35 min", texto: "Procuramos parceiros de contabilidade em Curitiba para atender startups.", curtidas: 17, comentarios: 9 },
      { autor: "Eduarda Lopes", empresa: "Capibaribe Clínica", quando: "1 h", texto: "Nova unidade inaugurada no bairro da Boa Vista. Obrigada, Reino!", curtidas: 41, comentarios: 12 },
      { autor: "Henrique Alves", empresa: "Planalto Consultoria", quando: "3 h", texto: "Guilda Planalto aberta para escritórios do Centro-Oeste.", curtidas: 13, comentarios: 3 },
      { autor: "Gabriela Rocha", empresa: "Pampa Marketing", quando: "5 h", texto: "Case: +38% de leads para uma imobiliária de Porto Alegre em 60 dias.", curtidas: 29, comentarios: 5 },
      { autor: "Felipe Nunes", empresa: "Orla Saúde Integrada", quando: "ontem", texto: "Buscamos agência de marketing no Rio para campanha de check-up.", curtidas: 8, comentarios: 4 },
    ].slice(0, Number(p.limite) || 30),

    "guildas/minha": () => ({
      nome: "Guilda Paulista", lider: "Ana Ribeiro", pontos: 3840,
      membros: [PESSOAS[0], PESSOAS[1], PESSOAS[3], PESSOAS[5]].map((x) => ({ nome: x.nome, titulo: x.titulo })),
    }),
    guildas: () => [
      { id: "g1", nome: "Guilda Paulista", nicho: "Multinicho", regiao: "Sudeste", membros: 4, pontos: 3840 },
      { id: "g2", nome: "Guilda Araucária", nicho: "Tecnologia", regiao: "Sul", membros: 2, pontos: 2210 },
      { id: "g3", nome: "Guilda Planalto", nicho: "Advocacia", regiao: "Centro-Oeste", membros: 2, pontos: 1760 },
      { id: "g4", nome: "Guilda do Nordeste", nicho: "Saúde", regiao: "Nordeste", membros: 2, pontos: 1490 },
    ],

    afiliado: () => ({ codigo: "demo1234", link: "https://www.babel-os.com/cadastro?ref=demo1234", indicados: 7, comissoesPendentes: 245.5 }),
    "afiliado/resolver": () => ({ nome: EU.nome }),

    noticias: () => [
      { tema: "afiliados", titulo: "Programas de indicação crescem entre pequenas empresas", resumo: "Donos de negócio usam links de afiliado para ampliar a carteira sem aumentar o custo de aquisição.", fonte: "Demonstração", data: "hoje" },
      { tema: "financas", titulo: "Como separar as finanças da empresa e da pessoa física", resumo: "Checklist com 5 passos para organizar o caixa antes de expandir.", fonte: "Demonstração", data: "ontem" },
      { tema: "afiliados", titulo: "Comissão multinível: o que declarar no imposto", resumo: "Entenda como registrar as comissões recebidas por indicação.", fonte: "Demonstração", data: "2 dias" },
      { tema: "financas", titulo: "Crédito para PMEs: taxas médias do trimestre", resumo: "Comparativo das modalidades mais usadas por empresas de serviços.", fonte: "Demonstração", data: "3 dias" },
    ],

    "busca-inteligente": (p) => {
      const termos = norm(p.q).split(/\s+/).filter((t) => t.length > 2);
      const achadas = empresas.filter((e) => termos.some((t) => norm(`${e.nome} ${e.nicho} ${e.cidade} ${e.estado}`).includes(t)));
      return {
        resposta: achadas.length
          ? `Encontrei ${achadas.length} empresa(s) no Reino para “${p.q}”. As mais bem avaliadas aparecem primeiro.`
          : `Não encontrei empresas para “${p.q}”. Tente um nicho (ex.: contabilidade) ou uma cidade.`,
        empresas: achadas.map(publica).sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0)).slice(0, 8),
      };
    },

    revista: () => [
      { edicao: "Nº 3", data: "setembro 2026", titulo: "As guildas que mais cresceram no trimestre", resumo: "Guilda Paulista lidera em pontos; Araucária em novos membros." },
      { edicao: "Nº 2", data: "agosto 2026", titulo: "Match Reino: parcerias que viraram contrato", resumo: "Três histórias de empresas que se conheceram pelo Reino." },
      { edicao: "Nº 1", data: "julho 2026", titulo: "Bem-vindo ao Reino", resumo: "Como funcionam títulos, território e reputação." },
    ],

    notificacoes: () => [
      { autor: "Match Reino", titulo: "Novo match 96%", texto: "Conta Certa Contabilidade combina com você.", quando: "10 min" },
      { autor: "Conquistas", titulo: "Conquista desbloqueada", texto: "Guildeiro: você entrou na Guilda Paulista.", quando: "2 h" },
    ],
    mensagens: () => [
      { autor: "Camila Duarte", titulo: "Camila Duarte", texto: "Oi! Vi seu escritório no Reino, podemos conversar?", quando: "20 min" },
    ],

    preferencias: () => null,
  };

  window.BabelDemo = function (recurso, params) {
    const r = rotas[recurso];
    return r ? r(params || {}) : [];
  };
})();
