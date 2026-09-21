/** Selo âmbar de dados fictícios: fixo no rodapé, ou `inline` no cabeçalho. */
export interface DemoBadgeProps {
  inline?: boolean;
  href?: string;
  children?: React.ReactNode;
}
export declare function DemoBadge(props: DemoBadgeProps): JSX.Element;
