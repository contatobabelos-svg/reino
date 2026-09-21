/**
 * Anel de progresso com número no centro — progresso de título e score de reputação.
 */
export interface ProgressRingProps {
  /** 0–100. O arco anima em 1,4s ao mudar. */
  value?: number;
  /** Texto miúdo sob o número. Ex.: "Progresso", "de 5 estrelas". */
  label?: string;
  /** gold = conquistas/reputação; cyan = métricas neutras. */
  tone?: "gold" | "cyan";
  /** 140px, para o layout lado a lado da reputação. */
  small?: boolean;
  size?: string;
}
export declare function ProgressRing(props: ProgressRingProps): JSX.Element;
