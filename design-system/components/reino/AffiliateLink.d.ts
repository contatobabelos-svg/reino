/** Widget de link de indicação (único painel verde do produto), no topo do dashboard e do pré-cadastro. */
export interface AffiliateLinkProps {
  link?: string;
  indicados?: number;
  comissoes?: number;
  aviso?: string;
  onCopy?: () => void;
  onClose?: () => void;
}
export declare function AffiliateLink(props: AffiliateLinkProps): JSX.Element;
