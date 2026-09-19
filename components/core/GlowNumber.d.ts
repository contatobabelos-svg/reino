/** Número grande que acende — a marca visual dos indicadores do Reino. */
export interface GlowNumberProps {
  value?: React.ReactNode;
  /** Unidade pequena colada ao número: "★", "%", "pts". */
  suffix?: string;
  /** gold para progresso/reputação; sem valor = azul-branco. */
  tone?: "brand" | "gold";
  /** Sem dado ainda: mostra "—" apagado. */
  empty?: boolean;
  /** Ex.: "1.75rem" no dashboard, "1.4rem" nos KPIs da bolsa. */
  size?: string;
  className?: string;
}
export declare function GlowNumber(props: GlowNumberProps): JSX.Element;
