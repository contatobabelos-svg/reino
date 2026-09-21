/** Cabeçalho fixo: hambúrguer (celular), busca global em cápsula, sino, mensagens e perfil. */
export interface TopBarProps {
  placeholder?: string;
  /** Nome do usuário; sem valor mostra "Seu perfil · Configurar". */
  user?: string;
  /** Linha miúda sob o nome. Padrão "Membro do Reino". */
  role?: string;
  /** URL da foto de perfil; sem valor, cai nas iniciais. */
  photo?: string;
  notifications?: boolean;
  messages?: boolean;
  onNotifications?: () => void;
  onMessages?: () => void;
  onMenu?: () => void;
  onSearch?: (q: string) => void;
  /** Nós extras antes dos ícones (ex.: DemoBadge inline). */
  actions?: React.ReactNode;
}
export declare function TopBar(props: TopBarProps): JSX.Element;
