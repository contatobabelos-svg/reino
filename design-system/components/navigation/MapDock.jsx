import React from "react";
import { Icon } from "../core/Icon.jsx";

export function MapDock({ items = [], value, onChange, label = "Opções do mapa" }) {
  return (
    <div className="hg-map-dock" role="tablist" aria-label={label}>
      {items.map((it) => (
        it.href ? (
          <a key={it.value || it.href} className="hg-icon-btn" href={it.href} title={it.label} data-rotulo={it.label}><Icon name={it.icon} /></a>
        ) : (
          <button key={it.value} className="hg-icon-btn" role="tab" aria-selected={value === it.value}
                  data-rotulo={it.label} title={it.label} onClick={() => onChange && onChange(it.value)}>
            <Icon name={it.icon} />
          </button>
        )
      ))}
    </div>
  );
}
