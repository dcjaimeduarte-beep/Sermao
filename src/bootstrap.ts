import { masterAgent } from "./agents/masterAgent";
import { runAgent, runSupportAgents } from "./services/aiRouter";
import type { UserRequest } from "./domain";

async function bootstrap() {
  const request: UserRequest = {
    tipoConteudo: "sermao",
    tipoSermao: "textual",
    publico: "misto",
    duracaoMinutos: 50,
    tema: "Permanecendo em Cristo",
    textoBase: "João 15:1-8",
    profundidade: "profunda",
    incluirContextoHistorico: true,
    incluirAplicacao: true,
    incluirApeloFinal: true,
  };

  const routed = masterAgent(request);

  const principalResult = await runAgent(routed.principal, request);
  const supportResults = await runSupportAgents(routed.apoio, request);

  console.log("AGENTE PRINCIPAL:");
  console.log(principalResult.content);

  console.log("\nAGENTES DE APOIO:");
  for (const result of supportResults) {
    console.log(`\n--- ${result.label} (${result.agentName}) ---`);
    console.log(result.content);
  }
}

bootstrap().catch(console.error);
