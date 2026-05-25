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

  const addStewardship = request.incluirMordomia
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
  const addStewardship = request?.incluirMordomia
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
