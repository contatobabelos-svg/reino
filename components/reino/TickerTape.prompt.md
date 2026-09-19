Letreiro de cotações — primeiro elemento da tela da Bolsa, sangrando até as bordas.

```jsx
<TickerTape items={[{ symbol: "PETR4", value: 48.95, changePercent: 1.28 }]} onSelect={abrir} />
```

A duração vem da quantidade de itens (5s por ativo, mínimo 20s). O conteúdo é duplicado para o loop — o componente já faz isso.
