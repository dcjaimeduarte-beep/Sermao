import type { BiblicalAgent } from "@/domain";
import { outlinePrompt } from "@/prompts/outlinePrompt";

export const outlineAgent: BiblicalAgent = {
  id: "outline-agent",
  nome: "Esboçista Bíblico",
  especialidade: "Criação de esboços de pregação",
  descricao: "Cria esboços pregáveis, claros, organizados e aplicáveis.",
  skills: [
    "interpretacao_biblica",
    "homiletica",
    "aplicacao_pastoral",
    "adaptacao_de_publico",
  ],
  promptBase: outlinePrompt,
};
