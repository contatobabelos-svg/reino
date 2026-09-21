import React from "react";

/* Conjunto de ícones do Babel OS: traçado 1.8 em grade 24, pontas redondas.
   Path data copiado de app/js/shell.js (window.BabelIcones). */
export const BABEL_ICON_PATHS = {
  visao: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  ordens: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  tecnicos: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  analises: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  relatorios: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  buscaIA: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 7.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
  sino: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  rota: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  camadas: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="m2 13 10 5 10-5"/>',
  alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
  grafico: '<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  baixar: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  filtro: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  mapa: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  social: '<circle cx="12" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M10.5 8.6 6.5 15.4M13.5 8.6l4 6.8M8 18h8"/>',
  match: '<path d="M8 7a4 4 0 1 0 0 10"/><path d="M16 7a4 4 0 1 1 0 10"/><path d="M8 12h8M13 9l3 3-3 3"/>',
  trofeu: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/>',
  revista: '<path d="M4 5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 8h5M8 12h8M8 16h8"/>',
  noticias: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>',
  vitrine: '<path d="M3 9 5 4h14l2 5M3 9h18v11H3zM3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  coroa: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  estrela: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  guilda: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="M9 8v7l3-2 3 2V8"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  bolsa: '<path d="M3 3v18h18"/><path d="M7 14v3M7 9v2M11 8v8M15 11v4M15 5v3M19 7v6"/><path d="M6 11h2v3H6zM10 10h2v4h-2zM14 8h2v3h-2zM18 9h2v2h-2z"/>',
  brain: '<path d="M12 2a7 7 0 0 0-4.6 12.3c.5.5.8 1.1.9 1.7H12h3.7c.1-.6.4-1.2.9-1.7A7 7 0 0 0 12 2z"/><path d="M10 18v2a2 2 0 0 0 4 0v-2"/><path d="M9.5 8.5C10 7 11 6 12 6s2.5 1 2.5 2.5S13 11 12 11s-2.5-.5-2.5-2.5z"/>',
};

export function Icon({ name, size, strokeWidth = 1.8, style, ...rest }) {
  const d = BABEL_ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={size ? { width: size, height: size, ...style } : style}
      dangerouslySetInnerHTML={{ __html: d }}
      {...rest}
    />
  );
}
