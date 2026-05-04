import OpenAI from "openai";
import type { BiblicalAgent, ContentType, GeneratedContent, SupportAgentConfig, UserRequest } from "@/domain";
import { buildUserContext } from "@/utils/formatOutput";

/** Mapeia o ID de cada agente principal ao seu tipoConteudo correto */
const AGENT_TIPO_CONTEUDO: Record<string, ContentType> = {
  "sermon-agent":  "sermao",
  "outline-agent": "esboco",
  "study-agent":   "estudo",
};

/** Instrução final específica por agente — reforça o formato de saída esperado */
const AGENT_USER_INSTRUCTION: Record<string, string> = {
  "sermon-agent": `
Gere agora o SERMÃO COMPLETO E PREGÁVEL — pronto para o púlpito.
NÃO produza esboço nem estudo bíblico. Produza texto corrido pastoral com:
- Introdução narrativa e impactante
- Desenvolvimento em pontos expositivos com exposição, explicação, ilustração e aplicação integrada em cada ponto
- Conclusão com síntese emocional e chamada
O sermão deve ter fluxo de pregação real — não uma lista de tópicos, mas uma mensagem com coração pastoral.`,

  "outline-agent": `
Gere agora o ESBOÇO DE PREGAÇÃO — estrutura hierárquica e organizada, ferramenta para o pregador.
NÃO produza texto corrido de sermão nem estudo com perguntas. Produza:
- Proposição central em uma frase
- Pontos numerados (I, II, III) com subtópicos em recuo
- Cada ponto: exposição resumida + ilustração + aplicação prática
- Material de apoio para o pregador ao final
O esboço deve ser visualmente claro — o pregador precisa enxergar a estrutura de relance.`,

  "study-agent": `
Gere agora o ESTUDO BÍBLICO PARA GRUPO — material didático para célula, EBD ou discipulado.
NÃO produza sermão nem esboço de pregação. Produza:
- Pergunta de abertura para engajar o grupo
- Explicação por tópicos (didática, acessível)
- Perguntas de reflexão pessoal, compreensão e discussão em grupo
- Aplicações práticas individuais e coletivas
- Oração de encerramento sugerida
O estudo deve convidar à participação e reflexão coletiva — não é uma mensagem para ouvir, é um material para estudar juntos.`,
};

/**
 * Em desenvolvimento (npm run dev:web): usa a API da OpenAI diretamente
 * com a chave do arquivo .env (VITE_OPENAI_API_KEY).
 *
 * Em produção (build publicado): usa o proxy PHP do servidor
 * (/proxy/v1) — a chave fica segura no servidor, nunca exposta no JS.
 */
function createClient(): OpenAI {
  if (import.meta.env.PROD) {
    // Produção: chama o proxy PHP — chave configurada em proxy/openai.php
    // Usa URL absoluta (obrigatório pelo SDK da OpenAI)
    const proxyBase = `${window.location.origin}/proxy/v1`;
    return new OpenAI({
      apiKey: "proxy", // valor ignorado — autenticação acontece no PHP
      baseURL: proxyBase,
      dangerouslyAllowBrowser: true,
    });
  }

  // Desenvolvimento: usa chave do .env diretamente
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
  const agentInstruction = AGENT_USER_INSTRUCTION[agent.id]
    ?? "Gere o conteúdo completo agora, com toda a riqueza histórica, literária e aplicação pastoral em linguagem contemporânea.";

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8000,
    messages: [
      { role: "system", content: agent.promptBase },
      {
        role: "user",
        content: `${userContext}\n\n${agentInstruction}`,
      },
    ],
    stream: true,
  });

  let fullText = "";

  try {
    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content ?? "";
      if (text) {
        fullText += text;
        onChunk?.(text);
      }
    }
  } catch (streamErr) {
    // Se o stream quebrar após já ter conteúdo parcial, retorna o que foi gerado
    if (fullText.length > 0) return { agentId: agent.id, agentName: agent.nome, content: fullText };
    throw streamErr;
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

  const content = response.choices?.[0]?.message?.content ?? "";

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

/** Executa os 3 agentes principais em paralelo (sem streaming).
 *  Cada agente recebe o tipoConteudo correto para o seu tipo,
 *  e o sermonAgent sempre recebe tipoSermao (mesmo que não fosse o tipo selecionado no form). */
export async function runAllMainAgents(
  agents: BiblicalAgent[],
  request: UserRequest
): Promise<GeneratedContent[]> {
  const client = createClient();

  return Promise.all(
    agents.map(async (agent) => {
      // Override tipoConteudo para o tipo correto deste agente
      const agentTipo = AGENT_TIPO_CONTEUDO[agent.id];
      const agentRequest: UserRequest = {
        ...request,
        tipoConteudo: agentTipo ?? request.tipoConteudo,
        // Garante que o sermonAgent sempre receba tipoSermao
        tipoSermao: agentTipo === "sermao"
          ? (request.tipoSermao ?? "expositivo")
          : undefined,
      };

      const userContext = buildUserContext(agentRequest);
      const agentInstruction = AGENT_USER_INSTRUCTION[agent.id]
        ?? "Gere o conteúdo completo agora, com toda a riqueza histórica, literária e aplicação pastoral em linguagem contemporânea.";

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 6000,
        messages: [
          { role: "system", content: agent.promptBase },
          {
            role: "user",
            content: `${userContext}\n\n${agentInstruction}`,
          },
        ],
        stream: false,
      });

      return {
        agentId: agent.id,
        agentName: agent.nome,
        content: response.choices?.[0]?.message?.content ?? "",
      };
    })
  );
}
