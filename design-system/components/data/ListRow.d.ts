/** Linha de lista de 3 colunas (avatar · texto · valor/hora). */
export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Coluna da direita como hora ("8 min", "ontem"). */
  time?: string;
  /** Nome usado nas iniciais; `false` remove o avatar. */
  avatar?: string | false;
  avatarGradient?: "brand" | "match" | "noticia";
  /** Coluna da direita livre: Pill, Stars, GlowNumber. */
  right?: React.ReactNode;
  as?: "li" | "div";
}
export declare function ListRow(props: ListRowProps): JSX.Element;
