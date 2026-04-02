import type { BiblicalAgent } from "@/domain";
import { theologyPrompt } from "@/prompts/theologyPrompt";

export const theologyReviewAgent: BiblicalAgent = {
  id: "theology-review-agent",
  nome: "Revisor Teológico",
  especialidade: "Revisão doutrinária e pastoral",
  descricao: "Valida coerência teológica e fortalece a fidelidade bíblica.",
  skills: [
    "coerencia_teologica",
    "revisao_doutrinaria",
    "interpretacao_biblica",
    "aplicacao_pastoral",
  ],
  promptBase: theologyPrompt,
};
