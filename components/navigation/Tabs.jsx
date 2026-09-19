import React from "react";

export function Tabs({ items = [], value, onChange }) {
  return (
    <div className="hg-tabs" role="tablist">
      {items.map((it) => {
        const id = typeof it === "string" ? it : it.value;
        const rotulo = typeof it === "string" ? it : it.label;
        return (
          <button key={id} role="tab" aria-selected={value === id} onClick={() => onChange && onChange(id)}>{rotulo}</button>
        );
      })}
    </div>
  );
}
