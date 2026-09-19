/** Barra fina (5px) azul→ciano com brilho. */
export interface ProgressBarProps {
  /** 0–100. */
  value?: number;
  /** Cor única no lugar do gradiente — use var(--gold) em progresso de título. */
  color?: string;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
