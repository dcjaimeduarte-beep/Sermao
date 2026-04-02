import type { BiblicalAgent, RoutedAgents, SupportAgentConfig, UserRequest } from "@/domain";
import {
  exegesisResearchPrompt,
  homileticsInsightPrompt,
  outlineInsightPrompt,
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

  switch (request.tipoConteudo) {
    case "esboco":
      principal = outlineAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(sermonAgent, homileticsInsightPrompt, "Pregador", "🎙️"),
      ];
      break;

    case "sermao":
      principal = sermonAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(outlineAgent, outlineInsightPrompt, "Esboçista", "📝"),
      ];
      break;

    case "estudo":
      principal = studyAgent;
      apoio = [
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
        makeSupport(sermonAgent, homileticsInsightPrompt, "Pregador", "🎙️"),
        makeSupport(outlineAgent, outlineInsightPrompt, "Esboçista", "📝"),
      ];
      break;

    default:
      principal = sermonAgent;
      apoio = [
        makeSupport(studyAgent, exegesisResearchPrompt, "Exegeta Bíblico", "🔍"),
        makeSupport(theologyReviewAgent, theologicalInsightsPrompt, "Teólogo", "📖"),
      ];
      break;
  }

  return { principal, apoio };
}
