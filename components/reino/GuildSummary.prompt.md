Resumo da guilda do usuário. Vai dentro de um `Panel tone="conquistas"`.

```jsx
<Panel title="Minha guilda" tone="conquistas" fill>
  <GuildSummary nome="Guilda Paulista" lider="Ana Ribeiro" pontos={3840}
    membros={[{ nome: "Ana Ribeiro", titulo: "Rei" }, { nome: "Bruno Carvalho", titulo: "Duque" }]} />
</Panel>
```

Para a lista "Explorar guildas", use `AchievementBadge` com `icon="guilda"`, como o produto faz.
