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
Gere agora o SERMÃO PREGÁVEL no formato de MANUSCRITO NUMERADO.
NÃO produza esboço, estudo, molde I/II/III, nem ilustrações.
Cada movimento do percurso é um BLOCO-TIPO completo:
- # N. TÍTULO (caixa alta, sem a referência no título)
- citação em > com a referência
- 3 a 6 linhas curtas da cena
- ### Contexto + 2 a 3 textos que iluminam (citações)
- ### Aplicação pessoal (persona)
- # PALAVRA PROFÉTICA DESTE BLOCO
Não entregue bloco raso (só título + 3 linhas + palavra). Expositivo, textual e temático usam o mesmo bloco.
Cabeçalho + **# 1. INTRODUÇÃO** (o livro + a palavra/tema em menção). Percurso a partir do nº 2. Fecho: contrastes + declaração + frase final.
Vários livros: uma composição; 1ª = eixo.`,

  "outline-agent": `
Gere agora o ESBOÇO DE PÚLPITO.
NÃO produza manuscrito corrido nem estudo de grupo. NÃO use I/II/III.
TODOS os tipos (expositivo, textual e temático) usam o MESMO BLOCO-TIPO em cada movimento:
- # N. TÍTULO
- citação em > (referência)
- linhas curtas da cena
- 3 setas ➡️
- ### Contexto + 2 a 3 textos que iluminam
- ### Aplicação pessoal (sempre)
- # PALAVRA PROFÉTICA DESTE BLOCO
Temático NÃO é raso. Não pule contexto nem textos de fundo.
Cabeçalho + **# 1. INTRODUÇÃO** (o livro + a palavra/tema em menção) + percurso em blocos a partir do nº 2 + fecho.
Expositivo, textual e temático: a introdução muda o sabor (livro+perícope / palavra-chave / tema no cânon); o bloco do percurso é o mesmo.
Vários livros: uma composição; 1ª = eixo.`,

  "study-agent": `
Gere agora o ESTUDO BÍBLICO PARA GRUPO no mesmo BLOCO-TIPO.
NÃO produza sermão nem esboço com setas ➡️.
Cada movimento:
- # N. TÍTULO + Nota para o líder + citação em > + linhas da cena
- ### Contexto + 2 a 3 textos que iluminam
- ### Aplicação pessoal
- ### Para o grupo (diagnóstico + desafio) + Dinâmica
- # PALAVRA PROFÉTICA DESTE BLOCO
Comece com **# 1. INTRODUÇÃO** (o livro + a palavra/tema em menção + pergunta de abertura). Percurso a partir do nº 2.
Depois: lições, perguntas do encontro, oração em 4 movimentos, declaração, frase final.
Frases curtas. Citações em bloco (>).`,
};

/** O PHP deste plano descarta POST maior que ~16 KB. Abaixo disso o JSON vai inteiro. */
const PROXY_SAFE_BYTES = 12_000;

async function gzipUtf8(text: string): Promise<Uint8Array | null> {
  const Ctor = (globalThis as { CompressionStream?: typeof CompressionStream }).CompressionStream;
  if (!Ctor) return null;
  const stream = new Blob([text]).stream().pipeThrough(new Ctor("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function postInChunks(url: string, text: string, signal?: AbortSignal): Promise<Response> {
  const id = `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 16);
  const size = 3000;
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));

  for (let i = 0; i < parts.length; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ _chunk: { id, i, n: parts.length, data: parts[i] } }),
      signal,
    });
    if (!res.ok) return res;
    await res.text();
  }

  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ _chunk: { id, finish: true, n: parts.length } }),
    signal,
  });
}

/**
 * Em desenvolvimento (npm run dev:web): usa a API da OpenAI diretamente
 * com a chave do arquivo .env (VITE_OPENAI_API_KEY).
 *
 * Em produção (build publicado): usa o proxy PHP do servidor.
 * A chave fica no servidor, nunca exposta no JS.
 * Pedidos grandes vão compactados: o plano corta POST acima de ~16 KB.
 */
function createClient(): OpenAI {
  if (import.meta.env.PROD) {
    const proxyUrl = new URL("/proxy/openai.php", window.location.origin).toString();
    return new OpenAI({
      apiKey: "proxy", // valor ignorado — autenticação acontece no PHP
      baseURL: `${window.location.origin}/proxy/v1`,
      dangerouslyAllowBrowser: true,
      fetch: async (input, init) => {
        const source = input instanceof Request ? input : null;
        const method = (init?.method ?? source?.method ?? "POST").toUpperCase();
        let text = "";
        if (typeof init?.body === "string") text = init.body;
        else if (init?.body instanceof Uint8Array) text = new TextDecoder().decode(init.body);
        else if (source) text = await source.clone().text();

        const signal = init?.signal ?? source?.signal;
        if (method !== "POST" || text.length <= PROXY_SAFE_BYTES) {
          return fetch(proxyUrl, { method, headers: init?.headers ?? source?.headers, body: text || undefined, signal });
        }

        const packed = await gzipUtf8(text);
        if (packed && packed.byteLength <= PROXY_SAFE_BYTES) {
          const headers = new Headers(init?.headers ?? source?.headers);
          headers.delete("content-length");
          headers.set("content-type", "application/octet-stream");
          return fetch(proxyUrl, { method: "POST", headers, body: packed, signal });
        }

        return postInChunks(proxyUrl, text, signal);
      },
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
