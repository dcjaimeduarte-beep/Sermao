import OpenAI from "openai";
import type { BiblicalAgent, GeneratedContent, SupportAgentConfig, UserRequest } from "@/domain";
import { buildUserContext } from "@/utils/formatOutput";

function createClient(): OpenAI {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "API key não configurada. Crie um arquivo .env com VITE_OPENAI_API_KEY=sua_chave (veja .env.example)."
    );
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

/** Executa o agente principal com streaming em tempo real. */
export async function runAgent(
  agent: BiblicalAgent,
  request: UserRequest,
  onChunk?: (text: string) => void
): Promise<GeneratedContent> {
  const client = createClient();
  const userContext = buildUserContext(request);

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8000,
    messages: [
      { role: "system", content: agent.promptBase },
      {
        role: "user",
        content: `${userContext}\n\nGere o conteúdo completo agora, com toda a riqueza histórica, literária e aplicação pastoral em linguagem contemporânea.`,
      },
    ],
    stream: true,
  });

  let fullText = "";

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      fullText += text;
      onChunk?.(text);
    }
  }

  return {
    agentId: agent.id,
    agentName: agent.nome,
    content: fullText,
  };
}

/** Executa um agente de suporte com prompt focado (sem streaming). */
async function runSupportAgent(
  config: SupportAgentConfig,
  request: UserRequest,
  client: OpenAI
): Promise<GeneratedContent & { label: string; icone: string }> {
  const userContext = buildUserContext(request);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    messages: [
      { role: "system", content: config.focusPrompt },
      {
        role: "user",
        content: `${userContext}\n\nProduz a sua contribuição especializada agora, de forma concisa, estruturada e de alto valor ministerial.`,
      },
    ],
    stream: false,
  });

  const content = response.choices[0]?.message?.content ?? "";

  return {
    agentId: config.agent.id,
    agentName: config.agent.nome,
    content,
    label: config.label,
    icone: config.icone,
  };
}

/** Executa todos os agentes de apoio em paralelo. */
export async function runSupportAgents(
  configs: SupportAgentConfig[],
  request: UserRequest
): Promise<Array<GeneratedContent & { label: string; icone: string }>> {
  const client = createClient();
  return Promise.all(configs.map((cfg) => runSupportAgent(cfg, request, client)));
}
