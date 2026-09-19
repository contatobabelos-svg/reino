Publicação da rede social em estilo linha do tempo (como o X): sem caixa, separada por filete, com barra de ações.

```jsx
<div className="hg-timeline">
  <SocialPost autor="Ana Ribeiro" empresa="Pulso Marketing Digital" titulo="Rei" quando="8 min"
    texto="Abrimos agenda para diagnósticos gratuitos de presença digital esta semana." curtidas={24} comentarios={6} repostagens={3} />
</div>
```

Curtir e repostar já alternam estado localmente. Use `SocialComposer` acima da lista para o campo "O que está acontecendo no Reino?". `FeedPost` (a versão antiga em lista) continua disponível para resumos compactos.
