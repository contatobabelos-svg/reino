Painel de vidro: o contêiner padrão de qualquer bloco de conteúdo do Babel OS.

```jsx
<Panel title="Rede social" subtitle="Últimas publicações do Reino" tone="social" onClose={ocultar}>
  <FeedPost autor="Ana Ribeiro" empresa="Pulso Marketing Digital" quando="8 min" texto="…" />
</Panel>
```

`tone` muda só a cor da faixa de luz no topo: `social` (ciano), `conquistas`/`reputacao` (dourado), `match` (magenta), `afiliado` (verde). Use `fill` quando o painel deve esticar até o fim da coluna e a lista interna rolar (`<div className="hg-rolar">`).
