/** Painel lateral direito (360px; 420px na bolsa) para notificações, mensagens e detalhe de ativo. */
export interface DrawerProps {
  open?: boolean;
  title: string;
  subtitle?: string;
  /** 420px e com rolagem — o detalhe de ativo da bolsa. */
  wide?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}
export declare function Drawer(props: DrawerProps): JSX.Element;
