import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Avatar } from "../core/Avatar.jsx";
import { IconButton } from "../core/IconButton.jsx";

export function TopBar({ placeholder = "Buscar empresas, nichos ou cidades no Reino…", user, role = "Membro do Reino", photo, notifications, messages, onMenu, onSearch, onNotifications, onMessages, actions }) {
  return (
    <header className="hg-top">
      <button className="hg-icon-btn hg-burger" onClick={onMenu} aria-label="Abrir menu"><Icon name="menu" /></button>
      <label className="hg-search">
        <span className="sr-only">Busca global</span>
        <Icon name="busca" />
        <input type="search" placeholder={placeholder} autoComplete="off" onChange={onSearch ? (e) => onSearch(e.target.value) : undefined} />
      </label>
      <div className="hg-top-actions">
        {actions}
        <IconButton icon="sino" label="Notificações" dot={!!notifications} onClick={onNotifications} />
        <IconButton icon="msg" label="Mensagens" dot={!!messages} onClick={onMessages} />
        <a className="hg-user" href="perfil.html" aria-label="Minha conta">
          {photo ? <img className="hg-avatar" src={photo} alt="" width="38" height="38" /> : <Avatar name={user} />}
          <div><b>{user || "Seu perfil"}</b><small>{user ? role : "Configurar"}</small></div>
        </a>
      </div>
    </header>
  );
}
