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

const STEWARDSHIP_KEYWORDS = [
  "dízimo", "dizimo", "oferta", "ofertas", "ofertar", "dizimar",
  "generosidade", "generoso", "generosa",
  "mordomia", "mordomo",
  "sacrifício", "sacrificio", "sacrificar",
  "entrega", "entregar",
  "dádiva", "dadiva",
  "dar ao senhor", "dar a deus", "dar para deus",
  "abundância", "abundancia",
  "finanças", "financas", "dinheiro",
  "serviço", "servico", "servir",
  "amor ao próximo", "amor ao proximo",
  "cuidado do próximo", "missão", "missao",
  "altruísmo", "altruismo",
  "desprendimento", "desprender",
  "graça que transborda", "graca que transborda",
  "coração aberto", "coracao aberto",
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
