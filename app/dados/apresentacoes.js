/* Reino · Apresentação das abas (AJ3, 22/09) — o que o Assistente do Reino fala na primeira
   vez que a pessoa abre cada aba. Fonte única: o card mostra este texto e a voz pré-gravada
   (app/assets/voz/*.mp3) é gerada a partir dele por scripts/gerar-vozes.cjs. Mudou um texto?
   Rode o script de novo — ele só refaz o áudio do que mudou e atualiza app/dados/vozes.js.
   Regras: duas ou três frases curtas (15 a 20 segundos falados), sem nome da pessoa (o áudio é
   o mesmo para todos) e nada da lista "Proibido publicar" do CLAUDE.md: sem promessa de renda,
   comissão, percentual ou preço. */
(function () {
  window.REINO_APRESENTACOES = {
    "index.html": {
      titulo: "Dashboard",
      texto: "Olá! Eu sou o assistente do Reino. Na primeira vez que você abrir cada aba, eu conto rapidinho para que ela serve. Este é o seu painel: o resumo do que está acontecendo no Reino hoje. Você pode esconder e reorganizar os blocos.",
    },
    "academy.html": {
      titulo: "Reino Academy",
      texto: "Aqui ficam as trilhas de vídeo do Reino. Assista às aulas na ordem: cada título que você conquista libera conteúdos novos.",
    },
    "niveis.html": {
      titulo: "Níveis",
      texto: "Esta é a escada de títulos do Reino, de Barão a Imperador. Cada título amplia o território que você comanda no mapa e o que você pode fazer aqui dentro.",
    },
    "eventos.html": {
      titulo: "Eventos",
      texto: "Em Eventos você encontra os encontros, as lives e as rodadas de negócios do Reino. Escolha um e garanta o seu lugar.",
    },
    "guildas.html": {
      titulo: "Guildas",
      texto: "Guildas são grupos de empresas do mesmo segmento que somam pontos juntas. Entre na guilda do seu ramo e conheça quem trabalha perto de você.",
    },
    "mapa.html": {
      titulo: "Mapa Reino",
      texto: "Este é o mapa do Reino. Cada ponto é uma empresa cadastrada. Gire o globo, clique numa região e aproxime até a cidade e o bairro. Para a sua empresa aparecer aqui, complete a cidade e a UF em Minha conta.",
    },
    "rede-social.html": {
      titulo: "Rede social",
      texto: "Aqui é a rede social do Reino. Publique novidades da sua empresa, curta e comente o que os outros membros postam.",
    },
    "chat.html": {
      titulo: "Bate Papo do Reino",
      texto: "Este é o bate-papo do Reino, um grupo com todos os membros. Toque numa mensagem e peça network: se a pessoa aceitar, abre uma conversa privada entre vocês dois.",
    },
    "match.html": {
      titulo: "Match Reino",
      texto: "No Match, o Reino aproxima a sua empresa de outras que combinam com ela, pelo nicho ou pela região. É um bom lugar para começar uma parceria.",
    },
    "conquistas.html": {
      titulo: "Conquistas",
      texto: "Em Conquistas você acompanha a sua evolução. Avaliar, cadastrar empresas e fazer matches vai somando pontos e desbloqueando insígnias.",
    },
    "clube.html": {
      titulo: "Clube de Benefícios",
      texto: "O Clube de Benefícios reúne as ofertas que as empresas do Reino abrem para os outros membros. Use à vontade e, se quiser, ofereça a sua.",
    },
    "rede-completa.html": {
      titulo: "Rede Completa",
      texto: "A Rede Completa mostra todas as empresas do Reino em cartões. Filtre por região ou nicho e toque num cartão para ver os detalhes e achar a empresa no mapa.",
    },
    "meus-acessos.html": {
      titulo: "Meus acessos",
      texto: "Aqui você vê quem clicou no seu link do Reino e quem se cadastrou por ele, dia a dia. O seu link fica em Minha conta.",
    },
    "bolsa.html": {
      titulo: "Bolsa de Valores",
      texto: "Na Bolsa você acompanha as cotações e a variação dos principais ativos do mercado. Toque num ativo para ver mais detalhes.",
    },
    "pesquisa.html": {
      titulo: "Busca Inteligente",
      texto: "Use a Busca Inteligente para encontrar empresas por nicho, estado e cidade. É o jeito mais rápido de achar o fornecedor ou o parceiro certo.",
    },
    "vitrine.html": {
      titulo: "Vitrine",
      texto: "A Vitrine mostra uma empresa em destaque em cada região. Passe por aqui para conhecer quem está brilhando no Reino.",
    },
    "revista.html": {
      titulo: "Revista do Reino",
      texto: "A Revista do Reino traz edições, matérias e histórias das empresas que fazem parte da rede.",
    },
    "hierarquia.html": {
      titulo: "Hierarquia",
      texto: "Aqui fica a hierarquia do Reino: os títulos de nobreza e a ordem entre eles.",
    },
    "noticias.html": {
      titulo: "Notícias do Reino",
      texto: "Em Notícias você lê o que está movendo os negócios hoje, direto dos veículos que publicam. Toque numa notícia para abrir a matéria completa.",
    },
    "musica.html": {
      titulo: "Música do Reino",
      texto: "Aqui você ouve prévias de trinta segundos de qualquer música, direto no navegador. Pesquise uma faixa e aperte o play.",
    },
    "assistente.html": {
      titulo: "Assistente do Reino",
      texto: "Esta é a minha casa! Pergunte qualquer coisa sobre como usar o Reino, e eu respondo na hora e mostro o caminho até a tela certa.",
    },
    "perfil.html": {
      titulo: "Minha conta",
      texto: "Esta é a sua conta. Complete aqui a empresa, o CNPJ, a cidade e a UF: sem a cidade, a sua empresa não aparece no mapa. Aqui também ficam a sua foto, a senha e o seu link do Reino.",
    },
    "configuracoes.html": {
      titulo: "Configurações",
      texto: "Em Configurações você ajusta como o Reino funciona para você. Por aqui também dá para ligar de novo as minhas apresentações, se quiser ouvir tudo outra vez.",
    },
    "admin.html": {
      titulo: "Contas no banco",
      texto: "Esta aba é só dos administradores: aqui aparecem todas as contas criadas no Reino, para aprovar e acompanhar.",
    },
  };
})();
