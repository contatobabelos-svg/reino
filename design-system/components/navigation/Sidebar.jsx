import React from "react";
import { Icon } from "../core/Icon.jsx";

export const MENU_BABEL = [
  ["index.html", "visao", "Dashboard"],
  ["academy.html", "revista", "Reino Academy"],
  ["niveis.html", "coroa", "Níveis"],
  ["eventos.html", "agenda", "Eventos"],
  ["guildas.html", "guilda", "Guildas por segmento"],
  ["mapa.html", "mapa", "Mapa Reino"],
  ["rede-social.html", "social", "Rede social"],
  ["chat.html", "msg", "Bate Papo do Reino"],
  ["match.html", "match", "Match Reino"],
  ["conquistas.html", "trofeu", "Conquistas"],
  ["clube.html", "estrela", "Clube de Benefícios"],
  ["rede-completa.html", "camadas", "Rede Completa"],
  ["meus-acessos.html", "analises", "Meus acessos"],
  ["bolsa.html", "bolsa", "Bolsa de Valores"],
  ["pesquisa.html", "buscaIA", "Busca Inteligente"],
  ["vitrine.html", "vitrine", "Vitrine"],
  ["perfil.html", "tecnicos", "Minha conta"],
  ["configuracoes.html", "config", "Configurações"],
];

export function Sidebar({ current = "index.html", items = MENU_BABEL, status = "demo", logo, collapsed, onToggle, onNavigate }) {
  const rotulo = status === "api" ? "API conectada" : status === "demo" ? "Modo demonstração" : "Sem fonte de dados";
  return (
    <aside className="hg-side">
      <a className="hg-brand" href="index.html" aria-label="Reino">{logo ? <img src={logo} width="30" height="30" alt="" /> : <span className="hg-brand-coroa"><Icon name="coroa" /></span>}<span>Rei<b>no</b></span></a>
      <nav className="hg-nav" aria-label="Principal">
        {items.map(([href, icon, texto]) => (
          <a key={href} href={href} aria-current={href === current ? "page" : undefined} data-rotulo={texto} title={collapsed ? texto : undefined}
             onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(href); } : undefined}>
            <Icon name={icon} /><span>{texto}</span>
          </a>
        ))}
      </nav>
      <div className="hg-side-foot">
        <b><span className={"hg-dot " + (status === "api" ? "is-on" : "is-off")} />{rotulo}</b>
        {status === "api" ? "Os painéis carregam da sua API."
          : status === "demo" ? <>Dados fictícios. <a href="configuracoes.html">Conectar API</a></>
          : <><a href="configuracoes.html">Configure a API</a> para ver dados reais.</>}
      </div>
      {onToggle ? (
        <button type="button" className="hg-side-seta" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
      ) : null}
    </aside>
  );
}
