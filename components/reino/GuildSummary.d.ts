/** Cabeçalho da guilda do usuário (brasão dourado + pontos) seguido da lista de membros. */
export interface GuildMember { nome: string; titulo?: string }
export interface GuildSummaryProps {
  nome: string;
  lider: string;
  pontos?: number;
  membros?: GuildMember[];
}
export declare function GuildSummary(props: GuildSummaryProps): JSX.Element;
