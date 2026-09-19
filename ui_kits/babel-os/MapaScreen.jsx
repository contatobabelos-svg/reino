/* Mapa Reino — tela imersiva: o globo ocupa tudo, como em app/mapa.html
   (body.is-imersivo + #globo[data-imersivo="1"]). */
function MapaScreen({ usuario }) {
  return (
    <>
      <h1 className="sr-only">Mapa Reino</h1>
      <Globo imersivo usuario={usuario} />
    </>
  );
}

Object.assign(window, { MapaScreen });
