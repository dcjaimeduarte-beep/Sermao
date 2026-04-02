import type { AgentSkill } from "./agent.types";

export const skillsCatalog: Record<AgentSkill, string> = {
  interpretacao_biblica: "Interpretação fiel ao contexto bíblico.",
  exegese_pratica: "Capacidade de explicar o texto com clareza e fidelidade.",
  contexto_historico: "Leitura do pano de fundo histórico e literário.",
  homiletica: "Estruturação de sermões, tópicos, transições e conclusão.",
  aplicacao_pastoral: "Aplicação prática para a vida cristã e a igreja.",
  coerencia_teologica: "Alinhamento com doutrina cristã evangélica.",
  adaptacao_de_publico: "Adequação da linguagem conforme o público.",
  didatica_biblica: "Capacidade de ensinar de forma clara e organizada.",
  revisao_doutrinaria: "Revisão para evitar desvios e incoerências.",
};
