# REINO · Babel OS

Rede de negócios brasileira montada como um reino. No ar em https://o-reino.vercel.app.

| Pasta | O que tem |
|---|---|
| `app/` | O app: `telas/`, `componentes/`, `servicos/` (banco), `estilos/`, `dados/`, `assets/`, `nucleo/` |
| `design-system/` | Cores, fontes, componentes `hg-*` e o pacote do design system |
| `supabase/` | Migrações e funções do banco (projeto `fxlansnepokjxdikxocb`) |
| `scripts/` | Ferramentas, como a que prepara o vídeo do login |
| `docs/` | Contexto, aulas e referências |
| `00-comando/` | Pedidos (`TODO.md`), plano de entrega, mapa de telas e logs |
| `arquivo/` | Versões antigas guardadas só para consulta; nada daqui vai ao ar |

Testar no computador:

```sh
sh montar-site.sh && cd site && python3 -m http.server 8123
```

Regras do projeto e estrutura detalhada: `CLAUDE.md`.
