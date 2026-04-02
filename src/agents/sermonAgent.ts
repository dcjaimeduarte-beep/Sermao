import type { BiblicalAgent } from "@/domain";
import { sermonPrompt } from "@/prompts/sermonPrompt";

export const sermonAgent: BiblicalAgent = {
  id: "sermon-agent",
  nome: "Pregador Bíblico",
  especialidade: "Desenvolvimento de sermões completos",
  descricao: "Produz sermões expositivos, textuais e temáticos.",
  skills: [
    "interpretacao_biblica",
    "exegese_pratica",
    "contexto_historico",
    "homiletica",
    "aplicacao_pastoral",
    "adaptacao_de_publico",
  ],
  promptBase: sermonPrompt,
};
