/** Título da tela, com subtítulo e ações à direita. */
export interface PageHeadProps {
  title: string;
  /** Some em telas de até 820px de altura e no celular. */
  subtitle?: string;
  /** Botões, widget de afiliado ou chips alinhados à direita. */
  children?: React.ReactNode;
}
export declare function PageHead(props: PageHeadProps): JSX.Element;
