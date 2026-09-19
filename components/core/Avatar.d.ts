/** Círculo de iniciais com halo azul; sem nome, cai no ícone de pessoa. */
export interface AvatarProps {
  /** Nome completo — só as duas primeiras iniciais aparecem. */
  name?: string;
  /** brand = azul→violeta (padrão); match = violeta→magenta; noticia = verde→azul. */
  gradient?: "brand" | "match" | "noticia";
  size?: number;
  className?: string;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
