/** Cabeçalho interno de painel: título, subtítulo e ✕ de ocultar. */
export interface SectionHeadProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3;
}
export declare function SectionHead(props: SectionHeadProps): JSX.Element;
