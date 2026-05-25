import type { BiblicalAgent, RoutedAgents, SupportAgentConfig, UserRequest } from "@/domain";
import {
  exegesisResearchPrompt,
  homileticsInsightPrompt,
  outlineInsightPrompt,
  stewardshipInsightPrompt,
  theologicalInsightsPrompt,
} from "@/prompts/supportPrompts";
import { outlineAgent } from "./outlineAgent";
import { sermonAgent } from "./sermonAgent";
import { studyAgent } from "./studyAgent";
import { theologyReviewAgent } from "./theologyReviewAgent";

// Palavras inequivocamente ligadas a dar/ofertar/dízimo.
// Termos genéricos como "serviço", "missão", "amor" foram removidos
// pois acionariam o agente em temas não relacionados (ex.: serviço na igreja, missão evangelística).
const STEWARDSHIP_KEYWORDS = [
  "dízimo", "dizimo", "dízimos", "dizimos",
  "oferta", "ofertas", "ofertar", "ofertório",
  "dizimar",
  "generosidade", "generoso", "generosa",
  "mordomia", "mordomo",
  "dádiva", "dadiva",
  "dar ao senhor", "dar a deus", "dar para deus",
  "dar com alegria",
  "finanças e fé", "financas e fe",
  "dinheiro e fé", "dinheiro e fe",
  "dar dos bens", "dar do salário", "dar do salario",
  "bênção financeira", "bencao financeira",
  "prosperar para dar",
];

function isGenerosityTheme(request: UserRequest): boolean {
  const haystack = [request.tema, request.textoBase, request.textoBase2, request.contextoGeracao]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return STEWARDSHIP_KEYWORDS.some((kw) => haystack.includes(kw));
}

function makeSupport(
  agent: BiblicalAgent,
  focusPrompt: string,
  label: string,
  icone: string
): SupportAgentConfig {
  return { agent, focusPrompt, label, icone };
}

export function masterAgent(request: UserRequest): RoutedAgents {
  let principal: BiblicalAgent;
  let apoio: SupportAgentConfig[];

  const addStewardship = isGenerosityTheme(request)
    ? [makeSupport(theologyReviewAgent, stewardshipInsightPrompt, "Mordomia e Generosidade", "🤲")]
    : [];

  switch (request.tipoConteudo) {
    case "esboco":
      principal = outlineAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(sermonAgent, homileticsInsightPrompt, "Pregador", "🎙️"),
        ...addStewardship,
      ];
      break;

    case "sermao":
      principal = sermonAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(outlineAgent, outlineInsightPrompt, "Esboçista", "📝"),
        ...addStewardship,
      ];
      break;

    case "estudo":
      principal = studyAgent;
      apoio = [
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(sermonAgent, homileticsInsightPrompt, "Pregador", "🎙️"),
        makeSupport(outlineAgent, outlineInsightPrompt, "Esboçista", "📝"),
        ...addStewardship,
      ];
      break;

    default:
      principal = sermonAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        ...addStewardship,
      ];
      break;
  }

  return { principal, apoio };
}

/** Retorna os 3 agentes principais + agentes de apoio compartilhados para geração simultânea. */
export function masterAgentAll(request?: UserRequest): { agents: BiblicalAgent[]; apoio: SupportAgentConfig[] } {
  const addStewardship = request && isGenerosityTheme(request)
    ? [makeSupport(theologyReviewAgent, stewardshipInsightPrompt, "Mordomia e Generosidade", "🤲")]
    : [];

  return {
    agents: [sermonAgent, outlineAgent, studyAgent],
    apoio: [
      makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
      makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
      ...addStewardship,
    ],
  };
}
