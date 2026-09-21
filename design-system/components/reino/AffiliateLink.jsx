import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Input } from "../forms/Input.jsx";
import { Button } from "../core/Button.jsx";

export function AffiliateLink({ link = "—", indicados, comissoes, aviso, onCopy, onClose }) {
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <article className="hg-panel hg-afiliado">
      <div className="hg-head">
        <span className="hg-afiliado-rotulo"><Icon name="link" />Link de afiliado</span>
        {onClose ? <button className="hg-x" onClick={onClose} aria-label="Ocultar widget"><Icon name="x" /></button> : null}
      </div>
      <div className="hg-afiliado-linha">
        <Input readOnly value={link} aria-label="Seu link de afiliado" />
        <Button variant="green" onClick={onCopy} disabled={!onCopy}>Copiar</Button>
      </div>
      <div className="hg-afiliado-meta">
        <span>Indicados <b>{indicados ?? "—"}</b></span>
        <span>Comissões pendentes <b>{comissoes != null ? brl(comissoes) : "—"}</b></span>
        {aviso ? <span>{aviso}</span> : null}
      </div>
    </article>
  );
}
