/**
 * Painel de vidro holográfico — a superfície base de toda a interface.
 */
export interface PanelProps {
  /** Cor da faixa de luz no topo. Sem valor = ciano. */
  tone?: "social" | "conquistas" | "match" | "reputacao" | "afiliado";
  /** Ocupa a altura disponível da coluna (classe hg-encher). */
  fill?: boolean;
  title?: string;
  subtitle?: string;
  /** Mostra o botão ✕ de ocultar widget no canto. */
  onClose?: () => void;
  /** Nós à direita do título (chip, seletor, barra de ferramentas). */
  actions?: React.ReactNode;
  /** 2 por padrão; use 3 em painéis secundários. */
  headingLevel?: 1 | 2 | 3;
  className?: string;
  children?: React.ReactNode;
}
export declare function Panel(props: PanelProps): JSX.Element;
