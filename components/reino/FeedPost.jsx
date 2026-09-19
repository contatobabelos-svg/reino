import React from "react";
import { Avatar } from "../core/Avatar.jsx";

export function FeedPost({ autor, empresa, quando, texto, curtidas = 0, comentarios = 0 }) {
  const num = (n) => Number(n).toLocaleString("pt-BR");
  return (
    <li className="hg-post">
      <Avatar name={autor} />
      <div>
        <strong>{autor}</strong>
        <span className="hg-post-meta">{empresa}{quando ? " · " + quando : ""}</span>
        <p>{texto}</p>
        <span className="hg-post-meta">♥ {num(curtidas)} · 💬 {num(comentarios)}</span>
      </div>
    </li>
  );
}
