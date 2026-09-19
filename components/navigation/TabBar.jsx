import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Os cinco destinos do mapa mental. O rótulo é curto porque a barra tem 62px;
   o nome completo do módulo vai no title/aria-label. */
export const TABBAR_BABEL = [
  ["index.html", "visao", "Dashboard", "Dashboard"],
  ["guildas.html", "guilda", "Guildas", "Guildas por segmento"],
  ["clube.html", "estrela", "Clube", "Clube de Benefícios"],
  ["rede-completa.html", "camadas", "Rede", "Rede Completa"],
  ["meus-acessos.html", "analises", "Acessos", "Meus acessos e estatísticas"],
];

export function TabBar({ current = "index.html", items = TABBAR_BABEL, onNavigate }) {
  return (
    <nav className="hg-tabbar" aria-label="Navegação principal">
      {items.map(([href, icon, texto, completo]) => (
        <a key={href} href={href} aria-current={href === current ? "page" : undefined}
           title={completo || texto} aria-label={completo || texto}
           onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(href); } : undefined}>
          <Icon name={icon} strokeWidth={1.9} /><span>{texto}</span>
        </a>
      ))}
    </nav>
  );
}
