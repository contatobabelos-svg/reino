import React from "react";
import { Avatar } from "../core/Avatar.jsx";
import { Icon } from "../core/Icon.jsx";

const arroba = (nome) => "@" + String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const num = (n) => (n >= 1000 ? (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : String(n ?? 0));

/* Publicação em estilo linha do tempo: avatar redondo, nome + arroba + título,
   texto grande e barra de ações. Sem caixa — separada por filete. */
export function SocialPost({ autor, empresa, titulo, quando, texto, curtidas = 0, comentarios = 0, repostagens = 0, imagem, verificado, curtido, onCurtir, onComentar, onRepostar, onCompartilhar, onAbrir }) {
  const [liked, setLiked] = React.useState(!!curtido);
  const [likes, setLikes] = React.useState(curtidas);
  const [rep, setRep] = React.useState(false);
  const curtir = (e) => { e.stopPropagation(); setLiked((v) => !v); setLikes((n) => n + (liked ? -1 : 1)); onCurtir && onCurtir(); };
  const repostar = (e) => { e.stopPropagation(); setRep((v) => !v); onRepostar && onRepostar(); };
  const parar = (fn) => (e) => { e.stopPropagation(); fn && fn(); };
  return (
    <article className={"hg-tweet" + (onAbrir ? " is-clicavel" : "")} onClick={onAbrir} tabIndex={onAbrir ? 0 : undefined}>
      <Avatar name={autor} />
      <div className="hg-tweet-corpo">
        <header className="hg-tweet-cab">
          <strong>{autor}</strong>
          {verificado || titulo ? <span className="hg-tweet-selo" title={titulo ? "Título: " + titulo : "Verificado"}><Icon name="coroa" /></span> : null}
          <span className="hg-tweet-meta">{arroba(autor)}{empresa ? " · " + empresa : ""}{quando ? " · " + quando : ""}</span>
        </header>
        {titulo ? <span className="hg-tweet-titulo">{titulo}</span> : null}
        <p className="hg-tweet-texto">{texto}</p>
        {imagem ? <img className="hg-tweet-img" src={imagem} alt="" loading="lazy" /> : null}
        <footer className="hg-tweet-acoes">
          <button type="button" onClick={parar(onComentar)} aria-label="Responder"><Icon name="msg" /><span>{num(comentarios)}</span></button>
          <button type="button" className={rep ? "is-on is-verde" : ""} onClick={repostar} aria-label="Repostar"><Icon name="rota" /><span>{num(repostagens + (rep ? 1 : 0))}</span></button>
          <button type="button" className={liked ? "is-on is-rosa" : ""} onClick={curtir} aria-label="Curtir" aria-pressed={liked}>
            <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 20.8 8.6 19.5 11.7 17.5 16.4 12 21 12 21z" /></svg>
            <span>{num(likes)}</span>
          </button>
          <button type="button" onClick={parar(onCompartilhar)} aria-label="Compartilhar"><Icon name="link" /></button>
        </footer>
      </div>
    </article>
  );
}
