Ícone do conjunto próprio do produto — use sempre este, nunca emoji nem outro pacote de ícones.

```jsx
<Icon name="guilda" size={19} />
```

O SVG não tem tamanho próprio: dentro de `Button`, `IconButton`, `Sidebar` etc. a classe do pai já define 16–22px. Passe `size` só fora desses contextos. Os mesmos arquivos estão em `assets/icons/*.svg` para uso sem React.
