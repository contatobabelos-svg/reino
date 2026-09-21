---
name: dominic-skill-creator
description: Dominic Skill Creator do REINO. Use quando o hook Dominic indicar uma skill do mercado ou uma lacuna ("não está em nenhuma área do catálogo"), quando uma mudança pedir uma habilidade que o projeto ainda não tem, ou quando o usuário pedir uma skill nova. Acha a melhor skill do mercado, valida em 4 passos, instala com aprovação ou cria uma skill própria; também restaura backups e explica bloqueios do Dominic.
---

# Dominic Skill Creator

O Dominic tem duas metades:

1. **O hook** (`.claude/dominic/dominic.py`), que roda a cada alteração de arquivo:
   faz backup antes, checa sintaxe depois, bloqueia segredo e código quebrado,
   avisa sobre código mal feito e indica a skill da área (`.claude/dominic/catalogo.json`).
2. **Esta skill**, que entra quando o hook indica algo que o projeto ainda não tem:
   ela acha, valida e instala a melhor skill do mercado, ou cria uma nova.

**Regra de ouro:** nada do mercado é instalado sem passar pelos 4 passos abaixo e
sem aprovação do fundador. Skill é código e instrução que o Claude vai seguir;
instalar às cegas é uma porta para ataque de cadeia de suprimentos.

## Quando o hook bloqueia (saída 2)

A mensagem diz o arquivo, o motivo e o comando para voltar:

- **Sintaxe quebrada:** corrija o trecho apontado (linha:coluna). Se não der,
  volte: `python3 .claude/dominic/dominic.py restaurar <arquivo>`.
- **Segredo no código:** apague a linha, mova o valor para variável de ambiente
  (`vercel env add`) e avise o fundador para **trocar a chave**, porque ela pode ter vazado.
- **SQL que desliga RLS:** não aplique. Reescreva a política por dono (veja `supabase/`).

`python3 .claude/dominic/dominic.py backups <arquivo>` lista as versões guardadas
(7 dias, no máximo 400 pontos de restauração).

## Quando o hook indica uma skill

- **"use: X"** → a skill já está instalada. Carregue com a ferramenta Skill e siga.
- **"do mercado: Y (repo)"** → siga o fluxo de validação abaixo antes de instalar.
- **"não está em nenhuma área"** → é lacuna. Veja `.claude/dominic/estado/lacunas.tsv`
  e siga o fluxo completo: buscar → validar → instalar ou criar → catalogar.

## Fluxo: achar a melhor skill do mercado

1. **Defina a necessidade em uma frase**, a partir da mudança: o que a skill tem
   de ensinar (ex.: "revisar políticas RLS do Supabase").
2. **Busque nesta ordem**, anotando cada candidata:
   - instaladas: `ls .claude/skills` e as skills de plugin disponíveis na sessão;
   - `anthropics/skills`, `obra/superpowers`;
   - repositórios oficiais do fornecedor da ferramenta (ex.: `supabase/agent-skills`);
   - busca web por `"SKILL.md" <tema>` no GitHub.
3. **Valide cada candidata em 4 passos** (Módulo 1.4 de `docs/aulas/AULA-COMPLETA-13-09.md`):
   1. **Estrelas, licença e dono** pela API:
      `gh api repos/<dono>/<repo> --jq '{stars:.stargazers_count, licenca:.license.spdx_id, atualizado:.pushed_at}'`.
      Sem licença = não instala (todos os direitos reservados).
   2. **Leia o `SKILL.md` inteiro.** Descarte se conflitar com o `CLAUDE.md`
      (outras fontes/cores, publicar preço, promessa de renda).
   3. **Procure comandos perigosos** nos scripts da skill:
      `grep -rnE "rm -rf|curl|wget|sudo|subprocess|npm install|pip install|claude -p|eval|base64 -d" <pasta>`.
      Cada ocorrência precisa de justificativa; se não houver, descarte.
   4. **Registre a decisão** (sim ou não, com o motivo) em `.claude/dominic/SKILLS-VALIDADAS.md`.
4. **Peça aprovação ao fundador** com: nome, repo, licença, estrelas, o que faz,
   o que foi encontrado no passo 3. Só então instale.
5. **Instale** copiando só a pasta da skill para `.claude/skills/<nome>/`, com o
   arquivo de licença (copie o `LICENSE` do repo se a pasta não tiver).
   Não rode instalador de terceiros (`npx ...`) sem ler o que ele faz.
6. **Catalogue**: acrescente a skill em `instaladas` da área certa em
   `.claude/dominic/catalogo.json`, ou crie uma área nova com `caminhos` e `conteudo`.
   Valide o JSON: `python3 -m json.tool .claude/dominic/catalogo.json > /dev/null`.

## Fluxo: criar uma skill própria (quando o mercado não serve)

Use a skill `skill-creator` como método e respeite este molde:

```markdown
---
name: <nome-em-kebab-case>
description: <o que faz e QUANDO usar, com as palavras que o usuário diria; é o que decide o disparo>
---

# <Título>
<Regras do REINO que valem para esta tarefa, com caminhos exatos.>
## Passo a passo
## Como verificar (evidência antes de "pronto")
```

- Curta: menos de 200 linhas; o detalhe vai em arquivos ao lado e é citado.
- Específica do Reino: caminhos reais, tokens, regras jurídicas do `CLAUDE.md`.
- **Teste antes de catalogar**: aplique a skill num caso real da mudança que a
  motivou e guarde a evidência.
- Catalogue (passo 6 acima) e registre em `SKILLS-VALIDADAS.md` como "própria".

## Registro

Toda instalação, criação ou descarte vira uma linha em `00-comando/logs/LOG.md`,
com horário de `date "+%Y-%m-%d %H:%M"`. O hook grava cada alteração em
`00-comando/logs/dominic.tsv` (data, ferramenta, arquivo, área, resultado).

## Limites (diga isto ao fundador, sem esconder)

- O Dominic checa **sintaxe**, não comportamento: um JSX que compila ainda pode
  ter bug de lógica. Para isso existem `webapp-testing` e `systematic-debugging`.
- Alterações feitas por `Bash` são detectadas depois; o backup delas é o último
  commit do git, não o hook.
- Os avisos (cor solta, `console.log`, texto jurídico) olham só as linhas novas e
  podem ter falso positivo; são sinal para revisar, não sentença.
