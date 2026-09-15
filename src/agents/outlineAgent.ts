import type { BiblicalAgent } from "@/domain";
import { outlinePrompt } from "@/prompts/outlinePrompt";

export const outlineAgent: BiblicalAgent = {
  id: "outline-agent",
  nome: "Esboçista Bíblico",
  especialidade: "Criação de esboços de pregação",
  descricao: "Cria esboços dinâmicos e pregáveis: tema, tópicos no ritmo do texto e frase final de ministério.",
  skills: [
    "interpretacao_biblica",
    "homiletica",
    "aplicacao_pastoral",
    "adaptacao_de_publico",
  ],
  promptBase: outlinePrompt,
};
