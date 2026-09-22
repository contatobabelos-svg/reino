#!/usr/bin/env python3
"""Reino · gera a semente das 77 contas de TESTE (TODO AI, 22/09).

Empresas, pessoas e conversas são INVENTADAS (nomes combinados por sorteio fixo); só cidades,
UFs e nichos são reais. Qualquer semelhança com empresa real é coincidência. As contas ficam em
privado.contas_teste: membro real não vê nada delas; admin vê. Sem senha, sem usuário.

Uso:  python3 supabase/semente-teste/gerar-contas-teste.py > semente.sql
      (rodar o SQL como postgres; apagar tudo com supabase/semente-teste/remover-contas-teste.sql)
Sempre gera o mesmo resultado (random.seed fixo); os horários são relativos a now().
"""
import random, uuid, json

random.seed(77)
NS = uuid.UUID("7e57c0de-0000-4000-8000-000000000077")

CIDADES = [  # (cidade, UF, região) — municípios reais, todas as 27 UFs
    ("São Paulo", "SP", "Sudeste"), ("Campinas", "SP", "Sudeste"), ("Ribeirão Preto", "SP", "Sudeste"), ("Santos", "SP", "Sudeste"), ("Sorocaba", "SP", "Sudeste"),
    ("São José dos Campos", "SP", "Sudeste"), ("Rio de Janeiro", "RJ", "Sudeste"), ("Niterói", "RJ", "Sudeste"), ("Petrópolis", "RJ", "Sudeste"),
    ("Belo Horizonte", "MG", "Sudeste"), ("Uberlândia", "MG", "Sudeste"), ("Juiz de Fora", "MG", "Sudeste"), ("Montes Claros", "MG", "Sudeste"),
    ("Vitória", "ES", "Sudeste"), ("Vila Velha", "ES", "Sudeste"),
    ("Curitiba", "PR", "Sul"), ("Londrina", "PR", "Sul"), ("Maringá", "PR", "Sul"), ("Florianópolis", "SC", "Sul"), ("Joinville", "SC", "Sul"),
    ("Blumenau", "SC", "Sul"), ("Porto Alegre", "RS", "Sul"), ("Caxias do Sul", "RS", "Sul"), ("Pelotas", "RS", "Sul"),
    ("Salvador", "BA", "Nordeste"), ("Feira de Santana", "BA", "Nordeste"), ("Recife", "PE", "Nordeste"), ("Caruaru", "PE", "Nordeste"),
    ("Fortaleza", "CE", "Nordeste"), ("Juazeiro do Norte", "CE", "Nordeste"), ("São Luís", "MA", "Nordeste"), ("Teresina", "PI", "Nordeste"),
    ("Natal", "RN", "Nordeste"), ("Mossoró", "RN", "Nordeste"), ("João Pessoa", "PB", "Nordeste"), ("Campina Grande", "PB", "Nordeste"),
    ("Maceió", "AL", "Nordeste"), ("Aracaju", "SE", "Nordeste"),
    ("Brasília", "DF", "Centro-Oeste"), ("Goiânia", "GO", "Centro-Oeste"), ("Anápolis", "GO", "Centro-Oeste"), ("Cuiabá", "MT", "Centro-Oeste"),
    ("Rondonópolis", "MT", "Centro-Oeste"), ("Campo Grande", "MS", "Centro-Oeste"), ("Dourados", "MS", "Centro-Oeste"),
    ("Manaus", "AM", "Norte"), ("Belém", "PA", "Norte"), ("Santarém", "PA", "Norte"), ("Porto Velho", "RO", "Norte"), ("Rio Branco", "AC", "Norte"),
    ("Boa Vista", "RR", "Norte"), ("Macapá", "AP", "Norte"), ("Palmas", "TO", "Norte"),
]
# nicho → (termos para o nome, o que oferece, nicho que procura)
NICHOS = {
    "Contabilidade": (["Contabilidade", "Contábil", "Assessoria Contábil"], "abertura de empresa e fiscal", "Tecnologia"),
    "Advocacia": (["Advocacia", "Advogados", "Jurídico"], "contratos e trabalhista", "Contabilidade"),
    "Marketing": (["Marketing", "Comunicação", "Agência Digital"], "tráfego pago e redes sociais", "Imobiliária"),
    "Tecnologia": (["Tecnologia", "Sistemas", "Software"], "sistemas de gestão e sites", "Marketing"),
    "Imobiliária": (["Imóveis", "Imobiliária", "Negócios Imobiliários"], "locação comercial", "Construção"),
    "Construção": (["Construtora", "Engenharia", "Reformas"], "obras e reformas comerciais", "Imobiliária"),
    "Saúde": (["Clínica", "Saúde Integrada", "Centro Médico"], "exames ocupacionais", "Marketing"),
    "Odontologia": (["Odontologia", "Odonto", "Clínica Odontológica"], "convênio odontológico para empresas", "Marketing"),
    "Alimentação": (["Alimentos", "Buffet", "Refeições"], "refeição corporativa e coffee break", "Eventos"),
    "Logística": (["Logística", "Transportes", "Entregas"], "frete e entrega regional", "Alimentação"),
    "Energia": (["Energia Solar", "Solar", "Energia"], "energia solar para comércio", "Construção"),
    "Educação": (["Educação", "Cursos", "Escola de Negócios"], "treinamento de equipes", "Tecnologia"),
    "Eventos": (["Eventos", "Produções", "Cerimonial"], "eventos corporativos", "Alimentação"),
    "Seguros": (["Seguros", "Corretora de Seguros", "Proteção"], "seguro empresarial e frota", "Logística"),
    "Beleza": (["Estética", "Beleza", "Studio"], "estética e bem-estar", "Marketing"),
    "Design": (["Design", "Estúdio Criativo", "Branding"], "identidade visual", "Tecnologia"),
    "Financeiro": (["Gestão Financeira", "Consultoria Financeira", "BPO Financeiro"], "BPO financeiro", "Contabilidade"),
    "Pet": (["Pet", "Clínica Veterinária", "Pet Center"], "atendimento veterinário", "Marketing"),
}
PALAVRAS = ["Ipê", "Jatobá", "Aroeira", "Carnaúba", "Buriti", "Araucária", "Mandacaru", "Cajá", "Jacarandá", "Sucupira", "Angico",
            "Baraúna", "Cedro Alto", "Serra Azul", "Vale Verde", "Rio Claro", "Horizonte", "Vértice", "Aurora", "Farol", "Ponte Nova",
            "Prumo", "Âncora", "Bússola", "Alvorada", "Planície", "Mirante", "Cais", "Estrela Guia", "Novo Rumo", "Trilha", "Oásis",
            "Maré", "Cerrado Vivo", "Pantanal", "Caatinga", "Sertão", "Litoral", "Coqueiral", "Seringal", "Pau-Brasil", "Tucano",
            "Sabiá", "Guará", "Onça Pintada", "Pitanga", "Acerola", "Jambo", "Graviola", "Umbu", "Pequi", "Açaí", "Cupuaçu",
            "Castanha", "Babaçu", "Juriti", "Arara", "Ametista", "Topázio", "Turmalina", "Quartzo", "Granito", "Basalto", "Aço Forte",
            "Nascente", "Correnteza", "Cascata", "Brisa", "Lume", "Centelha", "Raiz", "Semente", "Colheita", "Safra", "Terra Firme", "Rota",
            "Marajó", "Jequitibá", "Caraúbas", "Imbuia", "Bacuri", "Taperebá", "Manacá", "Quaresmeira", "Tamarindo", "Mangaba", "Ingá", "Siriema"]
NOMES = ["Ana", "Bruno", "Carla", "Diego", "Eduarda", "Fábio", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Lucas", "Mariana",
         "Nelson", "Olívia", "Paulo", "Rafaela", "Samuel", "Tatiane", "Vinícius", "Beatriz", "Caio", "Débora", "Everton", "Fernanda",
         "Gustavo", "Helena", "Igor", "Juliana", "Leandro", "Mônica", "Otávio", "Patrícia", "Renato", "Simone", "Thiago", "Vanessa",
         "Wagner", "Yasmin", "Rodrigo", "Luana", "Márcio", "Priscila", "Alexandre", "Camila", "Daniel", "Elaine", "Felipe", "Giovana",
         "Hugo", "Letícia", "Matheus", "Natália", "Roberta", "Sérgio", "Tânia", "Ulisses", "Viviane", "Adriano", "Bianca", "Cristiano"]
SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Carvalho",
              "Araújo", "Ribeiro", "Gomes", "Martins", "Rocha", "Barbosa", "Moura", "Cardoso", "Teixeira", "Correia", "Mendes",
              "Freitas", "Vieira", "Monteiro", "Batista", "Farias", "Moreira", "Pinto", "Cavalcanti", "Dias", "Castro", "Campos",
              "Queiroz", "Siqueira", "Nogueira", "Tavares", "Brandão", "Macedo", "Figueiredo"]
TITULOS = ["Rei"] * 2 + ["Príncipe"] * 5 + ["Duque"] * 9 + ["Marquês"] * 12 + ["Conde"] * 13 + ["Visconde"] * 14 + ["Barão"] * 22
FALAM = {"Marquês", "Duque", "Príncipe", "Rei", "Imperador"}
ORDEM = ["Rei", "Príncipe", "Duque", "Marquês", "Conde", "Visconde", "Barão"]

def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"
def ha(horas):  # horário relativo a agora
    return f"now() - interval '{int(horas * 60)} minutes'"

# ---------- 77 empresas ----------
random.shuffle(TITULOS)
cidades = CIDADES + random.sample(CIDADES[:30], 77 - len(CIDADES))
random.shuffle(cidades)
nichos = (list(NICHOS) * 5)[:77]
random.shuffle(nichos)
palavras = random.sample(PALAVRAS, 77)
pessoas, usados = [], set()
while len(pessoas) < 77:
    n = f"{random.choice(NOMES)} {random.choice(SOBRENOMES)}"
    if n not in usados:
        usados.add(n); pessoas.append(n)
E = []
for i in range(77):
    cid, uf, reg = cidades[i]
    nicho = nichos[i]
    E.append(dict(id=str(uuid.uuid5(NS, f"conta-{i}")), nome=pessoas[i], empresa=f"{palavras[i]} {random.choice(NICHOS[nicho][0])}",
                  nicho=nicho, cidade=cid, uf=uf, regiao=reg, titulo=TITULOS[i],
                  email=f"teste-{i + 1:03d}@contas-teste.reino.invalid"))
primeiro = lambda e: e["nome"].split()[0]
procura = lambda e: NICHOS[e["nicho"]][2]

out = ["-- Semente das 77 contas de TESTE (gerada por gerar-contas-teste.py). Tudo fictício.", "begin;"]
for e in E:
    meta = json.dumps({"nome": e["nome"], "titulo": e["titulo"], "cidade": e["cidade"], "uf": e["uf"], "empresa": e["empresa"]}, ensure_ascii=False)
    criado = random.uniform(24 * 20, 24 * 45)
    out.append(
        "insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, "
        "confirmation_token, recovery_token, email_change_token_new, email_change) values "
        f"({q(e['id'])}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', {q(e['email'])}, {ha(criado)}, "
        f"'{{\"provider\":\"email\",\"providers\":[\"email\"],\"conta_teste\":true}}'::jsonb, {q(meta)}::jsonb, {ha(criado)}, {ha(criado)}, '', '', '', '') on conflict (id) do nothing;")
    out.append(f"insert into privado.contas_teste (id) values ({q(e['id'])}) on conflict do nothing;")
    out.append(f"update public.perfis set situacao = 'membro', nome = {q(e['nome'])}, empresa = {q(e['empresa'])}, titulo = {q(e['titulo'])}, "
               f"cidade = {q(e['cidade'])}, uf = {q(e['uf'])}, criado_em = {ha(criado)} where id = {q(e['id'])};")

# ---------- Bate Papo do Reino (grupo) ----------
falantes = [e for e in E if e["titulo"] in FALAM]
ABERTURAS = [
    "Bom dia, Reino! Alguém de {procura} em {cidade} ou região? Estamos com demanda nova.",
    "Pessoal, a {empresa} está com agenda aberta para {oferta}. Atendemos {uf} inteiro.",
    "Alguém já fez parceria com empresa de {procura} de outro estado? Quero entender como vocês dividem o atendimento.",
    "Fechamos um contrato bom esta semana graças a uma indicação daqui. Obrigado, Reino!",
    "Procuro parceiro de {procura} para indicar clientes em {cidade}. Quem topa conversar?",
    "Dica para quem está começando: responda os pedidos de network no mesmo dia. Faz diferença.",
    "Estamos contratando em {cidade}. Se alguém souber de gente boa na área de {nicho}, me chama.",
    "Quem vai no encontro presencial da região {regiao}? Queria levar a equipe.",
    "Alguém indica um bom fornecedor de {procura} que atenda {uf}? Já testei dois e não gostei.",
    "Boa tarde! Somos de {nicho} em {cidade}/{uf}. Chegamos agora e queremos conhecer quem atende a região.",
    "Case rápido: um cliente que veio pelo Match virou contrato de 12 meses. Vale muito completar o perfil.",
    "Alguém mais sentiu o movimento cair nesta semana? Aqui em {cidade} deu uma segurada.",
    "Quem trabalha com {oferta} e quer indicar clientes, podemos montar uma troca de indicações.",
    "Abrimos uma unidade nova em {cidade}. Passem lá quando estiverem pela região!",
]
RESPOSTAS = [
    "@{a} conheço uma empresa boa nisso, te chamo no privado.",
    "@{a} aqui em {cidade} a gente atende, posso te passar os detalhes.",
    "Boa, @{a}! Tenho interesse também.",
    "@{a} manda um pedido de network que eu te explico como fazemos.",
    "Concordo com você, @{a}. Aqui funcionou do mesmo jeito.",
    "@{a} parabéns pelo contrato!",
    "@{a} vou estar lá, bora marcar um café.",
    "@{a} atendemos {uf} também, podemos dividir a região.",
    "Excelente, @{a}. Salvei aqui.",
    "@{a} tenho um contato que resolve isso rápido, te apresento.",
]
def fmt(t, e, alvo=None):
    return t.format(procura=procura(e).lower(), oferta=NICHOS[e["nicho"]][1], nicho=e["nicho"].lower(), cidade=e["cidade"],
                    uf=e["uf"], regiao=e["regiao"], empresa=e["empresa"], a=primeiro(alvo) if alvo else "")
t = 72.0
grupo = []
while t > 0.3 and len(grupo) < 115:
    autor = random.choice(falantes)
    grupo.append((autor, fmt(random.choice(ABERTURAS), autor), t))
    t -= random.uniform(0.2, 1.1)
    for _ in range(random.choice([0, 1, 1, 2])):
        resp = random.choice([f for f in falantes if f is not autor])
        grupo.append((resp, fmt(random.choice(RESPOSTAS), resp, autor), t))
        t -= random.uniform(0.05, 0.4)
    t -= random.uniform(0.3, 2.0)
for autor, texto, h in grupo:
    out.append(f"insert into public.chat_mensagens (sala, autor, texto, criado_em) values ('reino', {q(autor['id'])}, {q(texto)}, {ha(max(h, 0.1))});")

# ---------- network: pedidos e privados ----------
def sala(a, b):
    x, y = sorted([a, b]); return f"p:{x}:{y}"
pares, vistos = [], set()
while len(pares) < 55:
    a = random.choice(E)
    cand = [b for b in E if b is not a and (b["nicho"] == procura(a) or b["regiao"] == a["regiao"])]
    b = random.choice(cand)
    k = tuple(sorted([a["id"], b["id"]]))
    if k in vistos: continue
    vistos.add(k); pares.append((a, b))
DIALOGO = [
    ("de", "Oi, {pb}! Vi sua mensagem no grupo e achei que dá liga com o que fazemos na {ea}."),
    ("para", "Oi, {pa}! Que bom. Vocês atendem {cb} também?"),
    ("de", "Atendemos sim, e já temos clientes em {ub}. Posso te mandar nossa apresentação?"),
    ("para", "Manda sim. Tenho dois clientes que precisam de {oa} agora."),
    ("de", "Perfeito. Te mando hoje. Podemos fazer uma call na quinta às 10h?"),
    ("para", "Quinta às 10h fechado. Te mando o link."),
    ("de", "Combinado! Obrigado pela indicação, {pb}."),
    ("para", "Imagina. Se precisar de {ob}, pode contar com a gente."),
]
estados = ["aceito"] * 38 + ["pendente"] * 10 + ["recusado"] * 7
random.shuffle(estados)
for (a, b), est in zip(pares, estados):
    h = random.uniform(8, 70)
    resp = "null" if est == "pendente" else ha(h - random.uniform(0.3, 5))
    out.append("insert into public.network_pedidos (de, para, estado, de_nome, de_empresa, de_titulo, para_nome, para_empresa, para_titulo, criado_em, respondido_em) values "
               f"({q(a['id'])}, {q(b['id'])}, '{est}', {q(a['nome'])}, {q(a['empresa'])}, {q(a['titulo'])}, {q(b['nome'])}, {q(b['empresa'])}, {q(b['titulo'])}, {ha(h)}, {resp}) on conflict do nothing;")
    if est == "aceito":
        hm = h - 5.5
        for lado, txt in DIALOGO[:random.randint(3, len(DIALOGO))]:
            quem = a if lado == "de" else b
            texto = txt.format(pa=primeiro(a), pb=primeiro(b), ea=a["empresa"], cb=b["cidade"], ub=b["uf"], oa=NICHOS[a["nicho"]][1], ob=NICHOS[b["nicho"]][1])
            out.append(f"insert into public.chat_mensagens (sala, autor, texto, criado_em) values ({q(sala(a['id'], b['id']))}, {q(quem['id'])}, {q(texto)}, {ha(max(hm, 0.05))});")
            hm -= random.uniform(0.03, 0.6)

# ---------- guildas ----------
AFINS = {"Saúde": {"Saúde", "Odontologia"}, "Tecnologia": {"Tecnologia", "Design"}, "Construção": {"Construção", "Energia", "Imobiliária"}}
GUILDAS = [("Guilda Paulista", None, "Sudeste", "SP"), ("Guilda Carioca", None, "Sudeste", "RJ"), ("Guilda das Gerais", None, "Sudeste", "MG"),
           ("Guilda Araucária", None, "Sul", None), ("Guilda do Litoral Nordestino", None, "Nordeste", None), ("Guilda do Sertão", None, "Nordeste", None),
           ("Guilda do Cerrado", None, "Centro-Oeste", None), ("Guilda Amazônia", None, "Norte", None),
           ("Guilda dos Contadores", "Contabilidade", None, None), ("Guilda Digital", "Tecnologia", None, None),
           ("Guilda Saúde Brasil", "Saúde", None, None), ("Guilda da Construção", "Construção", None, None)]
membro_de = {}
for nome, nicho, reg, uf in GUILDAS:
    afins = AFINS.get(nicho, {nicho}) if nicho else None
    base = [e for e in E if (not afins or e["nicho"] in afins) and (not reg or e["regiao"] == reg) and (not uf or e["uf"] == uf)
            and len(membro_de.get(e["id"], [])) < 2]
    if len(base) < 3:
        base = [e for e in E if not reg or e["regiao"] == reg]
    membros = random.sample(base, min(len(base), random.randint(4, 9)))
    lider = sorted(membros, key=lambda e: ORDEM.index(e["titulo"]))[0]
    desc = f"Empresas de {nicho.lower()} de todo o Brasil trocando indicações." if nicho else f"Empresas da região {reg} que se indicam e fazem negócio juntas."
    out.append(f"insert into public.guildas (nome, nicho, regiao, descricao, lider, pontos, teste, criado_em) values ({q(nome)}, {q(nicho or 'Multinicho')}, "
               f"{q(reg or 'Brasil')}, {q(desc)}, {q(lider['id'])}, {random.randint(40, 380) * 10}, true, {ha(random.uniform(24 * 10, 24 * 30))});")
    for m in membros:
        membro_de.setdefault(m["id"], []).append(nome)
        out.append("insert into public.guilda_membros (guilda_id, membro, papel, nome, empresa, titulo, cidade, uf, entrou_em) "
                   f"select id, {q(m['id'])}, '{'lider' if m is lider else 'membro'}', {q(m['nome'])}, {q(m['empresa'])}, {q(m['titulo'])}, {q(m['cidade'])}, {q(m['uf'])}, "
                   f"{ha(random.uniform(24, 24 * 9))} from public.guildas where nome = {q(nome)} and teste on conflict do nothing;")

# ---------- matches ----------
mvistos = set()
while len(mvistos) < 150:
    a = random.choice(E)
    comp = [b for b in E if b is not a and b["nicho"] == procura(a)]
    b = random.choice(comp) if comp and random.random() < 0.7 else random.choice([x for x in E if x is not a])
    k = tuple(sorted([a["id"], b["id"]]))
    if k in mvistos: continue
    mvistos.add(k)
    casa = b["nicho"] == procura(a)
    pct = random.randint(78, 97) if casa else random.randint(60, 84)
    motivo = (f"{a['nicho']} procura {b['nicho'].lower()}" if casa else
              f"Mesma região ({a['regiao']})" if a["regiao"] == b["regiao"] else f"{a['nicho']} e {b['nicho'].lower()}: clientes em comum")
    out.append("insert into public.matches (a, b, compatibilidade, motivo, a_nome, a_empresa, a_nicho, a_cidade, a_uf, a_titulo, b_nome, b_empresa, b_nicho, b_cidade, b_uf, b_titulo, teste, criado_em) values "
               f"({q(a['id'])}, {q(b['id'])}, {pct}, {q(motivo)}, {q(a['nome'])}, {q(a['empresa'])}, {q(a['nicho'])}, {q(a['cidade'])}, {q(a['uf'])}, {q(a['titulo'])}, "
               f"{q(b['nome'])}, {q(b['empresa'])}, {q(b['nicho'])}, {q(b['cidade'])}, {q(b['uf'])}, {q(b['titulo'])}, true, {ha(random.uniform(2, 24 * 6))}) on conflict do nothing;")

# ---------- status (24 h) ----------
STATUS = ["Agenda aberta para {oferta} esta semana.", "Equipe completa hoje em {cidade}!", "Mais um cliente fechado pelo Reino 🙌",
          "Procurando parceiro de {procura} em {uf}.", "Café com parceiros da guilda hoje à tarde.", "Novidade chegando na {empresa}. Aguardem!",
          "Obrigado pelas indicações desta semana!", "Hoje é dia de visita a cliente em {cidade}.", "Treinamento da equipe concluído ✅",
          "Vagas abertas para {oferta}. Chama no privado."]
FUNDOS = ["aurora", "neon", "ouro", "floresta", "noite", "brasa"]
for e in random.sample(E, 34):
    for _ in range(random.choice([1, 1, 2])):
        h = random.uniform(0.3, 21)
        out.append(f"insert into public.status (autor, texto, fundo, criado_em, expira_em) values ({q(e['id'])}, {q(fmt(random.choice(STATUS), e))}, "
                   f"{q(random.choice(FUNDOS))}, {ha(h)}, {ha(h)} + interval '24 hours');")

out.append("commit;")
print("\n".join(out))
