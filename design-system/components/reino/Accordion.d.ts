/** Grupo recolhível para listas geográficas (região → estados → cidades). */
export interface AccordionProps {
  title: React.ReactNode;
  /** Contagem à direita do título, em ciano. */
  value?: React.ReactNode;
  open?: boolean;
  children?: React.ReactNode;
}
export declare function Accordion(props: AccordionProps): JSX.Element;
