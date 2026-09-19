import React from "react";
import { Icon } from "./Icon.jsx";

const iniciais = (nome) =>
  String(nome || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

export function Avatar({ name, gradient, size, className = "", ...rest }) {
  const style = {};
  if (gradient === "match") style.background = "linear-gradient(135deg,#8b5cff,#e04bff)";
  if (gradient === "noticia") style.background = "linear-gradient(135deg,#1fcf8f,#3b82ff)";
  if (size) { style.width = size; style.height = size; }
  return (
    <span className={["hg-avatar", className].filter(Boolean).join(" ")} style={style} {...rest}>
      {name ? iniciais(name) : <Icon name="tecnicos" />}
    </span>
  );
}
