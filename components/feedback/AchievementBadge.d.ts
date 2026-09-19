/**
 * Emblema quadrado de conquista ou de guilda; fica a 65% de opacidade enquanto bloqueado.
 */
export interface AchievementBadgeProps {
  icon?: string;
  name: string;
  description?: string;
  /** Segunda linha miúda: "4 membros · 3.840 pts". */
  meta?: string;
  /** Desbloqueada: opacidade cheia e borda dourada. */
  unlocked?: boolean;
  /** 0–100; a barra só aparece quando ainda está bloqueada. */
  progress?: number;
  /** Botão opcional no pé (ex.: Entrar na guilda). */
  action?: React.ReactNode;
}
export declare function AchievementBadge(props: AchievementBadgeProps): JSX.Element;
