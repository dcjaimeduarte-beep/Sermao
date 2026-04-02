import type { BiblicalAgent } from "@/domain";
import { studyPrompt } from "@/prompts/studyPrompt";

export const studyAgent: BiblicalAgent = {
  id: "study-agent",
  nome: "Professor Bíblico",
  especialidade: "Criação de estudos bíblicos",
  descricao: "Transforma passagens e temas em estudos claros e didáticos.",
  skills: [
    "interpretacao_biblica",
    "didatica_biblica",
    "contexto_historico",
    "aplicacao_pastoral",
    "adaptacao_de_publico",
  ],
  promptBase: studyPrompt,
};
