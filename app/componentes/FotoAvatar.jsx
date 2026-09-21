const { Avatar, Icon } = window.BabelOSDesignSystem_5ad360;

/* FotoAvatar — avatar com foto real quando existe; iniciais quando não.
   Com `editavel`, aceita arrastar a imagem em cima ou tocar para escolher
   (galeria/câmera). A foto fica guardada por chave (nome ou id). */
function FotoAvatar({ chave, nome, size = 44, gradient, editavel, className = "", camera }) {
  const F = window.ReinoFotos;
  const k = chave || nome;
  const [url, setUrl] = React.useState(() => (F ? F.obter(k) : null));
  const [sobre, setSobre] = React.useState(false);
  React.useEffect(() => { if (!F) return; setUrl(F.obter(k)); return F.ouvir(() => setUrl(F.obter(k))); }, [k]);
  const escolher = async (e) => { e.preventDefault(); e.stopPropagation(); if (!editavel || !F) return; await F.escolher(k, { camera }); };
  const soltar = async (e) => {
    e.preventDefault(); e.stopPropagation(); setSobre(false);
    if (!editavel || !F) return;
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) await F.definirArquivo(k, f);
  };
  const est = { width: size, height: size };
  if (!url) {
    return (
      <span className={"hg-foto" + (editavel ? " is-editavel" : "") + (sobre ? " is-sobre" : "") + (className ? " " + className : "")} style={est}
            onClick={editavel ? escolher : undefined} onDragOver={editavel ? (e) => { e.preventDefault(); setSobre(true); } : undefined}
            onDragLeave={editavel ? () => setSobre(false) : undefined} onDrop={editavel ? soltar : undefined}
            title={editavel ? "Toque ou arraste uma foto" : undefined} role={editavel ? "button" : undefined}>
        <Avatar name={nome} gradient={gradient} size={size} />
        {editavel ? <i className="hg-foto-mais" aria-hidden="true"><Icon name="mais" /></i> : null}
      </span>
    );
  }
  return (
    <span className={"hg-foto has-foto" + (editavel ? " is-editavel" : "") + (sobre ? " is-sobre" : "") + (className ? " " + className : "")} style={est}
          onClick={editavel ? escolher : undefined} onDragOver={editavel ? (e) => { e.preventDefault(); setSobre(true); } : undefined}
          onDragLeave={editavel ? () => setSobre(false) : undefined} onDrop={editavel ? soltar : undefined}
          title={editavel ? "Trocar foto" : nome} role={editavel ? "button" : undefined}>
      <img src={url} alt={nome || ""} />
      {editavel ? <i className="hg-foto-mais" aria-hidden="true"><Icon name="mais" /></i> : null}
    </span>
  );
}

Object.assign(window, { FotoAvatar });
