import type { BiblicalAgent } from "@/domain";
import { outlineAgent } from "./outlineAgent";
import { sermonAgent } from "./sermonAgent";
import { studyAgent } from "./studyAgent";
import { theologyReviewAgent } from "./theologyReviewAgent";

export const agentRegistry: BiblicalAgent[] = [
  outlineAgent,
  sermonAgent,
  studyAgent,
  theologyReviewAgent,
];
