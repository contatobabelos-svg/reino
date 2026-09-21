import React from "react";
import { Avatar } from "../core/Avatar.jsx";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

export function SocialComposer({ autor, placeholder = "O que está acontecendo no Reino?", onPublicar, max = 280 }) {
  const [texto, setTexto] = React.useState("");
  const resto = max - texto.length;
  const enviar = (e) => { e.preventDefault(); if (!texto.trim() || resto < 0) return; onPublicar && onPublicar(texto.trim()); setTexto(""); };
  return (
    <form className="hg-compor" onSubmit={enviar}>
      <Avatar name={autor} />
      <div className="hg-compor-corpo">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} rows={texto ? 3 : 2} aria-label="Nova publicação" />
        <div className="hg-compor-rodape">
          <div className="hg-compor-extras">
            <button type="button" aria-label="Imagem"><Icon name="vitrine" /></button>
            <button type="button" aria-label="Localização"><Icon name="pin" /></button>
            <button type="button" aria-label="Empresa"><Icon name="camadas" /></button>
          </div>
          <div className="hg-compor-envio">
            {texto ? <span className={"hg-compor-conta" + (resto < 20 ? " is-alerta" : "")}>{resto}</span> : null}
            <Button variant="cyan" type="submit" disabled={!texto.trim() || resto < 0}>Publicar</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
