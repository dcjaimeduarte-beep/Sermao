import type { AgentSkill } from "./agent.types";

export type ContentType = "esboco" | "sermao" | "estudo";
export type SermonStyle = "expositivo" | "textual" | "tematico";
export type AudienceType =
  | "criancas"
  | "adolescentes"
  | "jovens"
  | "mulheres"
  | "homens"
  | "misto"
  | "nao_convertidos";

export interface UserRequest {
  tipoConteudo: ContentType;
  tipoSermao?: SermonStyle;
  publico: AudienceType;
  duracaoMinutos: number;
  tema?: string;
  textoBase?: string;
  /** Notas, situação da igreja, objetivos pastorais — incluído no pedido ao modelo. */
  contextoGeracao?: string;
  profundidade?: "simples" | "media" | "profunda";
  incluirContextoHistorico?: boolean;
  incluirAplicacao?: boolean;
  incluirApeloFinal?: boolean;
}

export interface BiblicalAgent {
  id: string;
  nome: string;
  especialidade: string;
  descricao: string;
  skills: AgentSkill[];
  promptBase: string;
}

export interface GeneratedContent {
  agentId: string;
  agentName: string;
  content: string;
}

export interface SupportAgentConfig {
  agent: BiblicalAgent;
  /** Prompt que substitui o promptBase do agente no modo de suporte/pesquisa */
  focusPrompt: string;
  /** Rótulo exibido na UI (ex.: "Exegeta Bíblico") */
  label: string;
  /** Ícone exibido na UI */
  icone: string;
}

export interface RoutedAgents {
  principal: BiblicalAgent;
  apoio: SupportAgentConfig[];
}
