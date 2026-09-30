export interface DocsSource {
  source: string;
  markdown: string;
}

interface DocsEntry {
  source: string;
  title: string;
  body: string;
}

const STOP = new Set([
  "para", "como", "uma", "uns", "umas", "por", "dos", "das", "seu", "sua", "seus", "suas",
  "nao", "sem", "sob", "ate", "mas", "mais", "este", "esta", "esse", "essa", "isso", "aquele",
  "quando", "onde", "sobre", "entre", "pelo", "pela", "pelos", "pelas", "aos", "nas", "nos",
  "num", "numa", "ser", "tem", "foi", "sao", "esta", "voce", "voces", "com", "que", "quem",
  "qual", "quais", "muito", "muita", "todo", "toda", "todos", "todas", "apenas", "tambem",
  "igreja", "sermao", "sermaes", "estudo", "esboco", "pastor", "pastora", "pregador", "palavra",
  "contexto", "pastoral", "tema", "texto", "pedido", "quero", "precisa", "dentro",
]);

/** Palavra do briefing → termos que de fato aparecem nos verbetes de docs/. */
const ALIASES: Record<string, string[]> = {
  esperanca: ["ressurreicao", "escatologia"],
  luto: ["ressurreicao"],
  morte: ["ressurreicao"],
  falecimento: ["ressurreicao"],
  consolo: ["ressurreicao"],
  perdao: ["perdao", "propiciacao", "redencao"],
  arrepend: ["metanoia", "conversao"],
  comunhao: ["koinonia"],
  amor: ["agape"],
  graca: ["graca"],
  fe: ["fe"],
  lei: ["lei"],
  alianca: ["alianca"],
  messias: ["messias", "cristo"],
  cristo: ["cristo", "messias", "encarnacao"],
  jesus: ["cristo", "encarnacao"],
  batismo: ["batismo"],
  oracao: ["abba"],
  justific: ["justificacao"],
  salvacao: ["salvacao"],
  santidad: ["santificacao"],
  santific: ["santificacao"],
  espirito: ["espirito"],
  paulo: ["paulo"],
  pedro: ["pedro"],
  davi: ["davi"],
  moises: ["moises"],
  abraao: ["abraao"],
  isaias: ["isaias"],
  galileia: ["galileia", "palestina"],
  jerusalem: ["jerusalem"],
  jerosol: ["jerusalem"],
  fariseu: ["fariseus"],
  saduceu: ["saduceus"],
  traduc: ["traducao", "almeida", "septuaginta"],
  ara: ["almeida"],
  nvi: ["nvi", "traducao"],
  ntlh: ["ntlh", "traducao"],
  hebraico: ["hebraico"],
  grego: ["grego"],
  original: ["exegese", "hebraico", "grego"],
  exeges: ["exegese", "hermeneutica"],
  hermeneut: ["hermeneutica", "exegese"],
  histor: ["historia", "arqueologia", "palestina"],
  cultura: ["cultura", "greco", "judaico"],
  geograf: ["palestina", "jerusalem"],
  paralelos: ["salvacao", "tipologia"],
  ekklesia: ["ekklesia"],
  koinonia: ["koinonia"],
  agape: ["agape"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitEntries(source: string, markdown: string): DocsEntry[] {
  const entries: DocsEntry[] = [];
  let parent = "";
  let title = "";
  let body: string[] = [];

  const flush = () => {
    const text = body.join("\n").trim();
    if (title && text.length >= 80) {
      entries.push({ source, title, body: text.slice(0, 1200) });
    }
    body = [];
  };

  for (const line of markdown.split("\n")) {
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      const label = heading[2].trim();
      if (heading[1] === "##") {
        parent = label;
        title = label;
      } else {
        title = parent ? `${parent} — ${label}` : label;
      }
    } else if (title) {
      body.push(line);
    }
  }
  flush();
  return entries;
}

function queryTokens(query: string): { tokens: string[]; fromQuery: Set<string> } {
  const normalized = normalize(query);
  const words = normalized
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOP.has(word));

  const extra: string[] = [];
  for (const [key, targets] of Object.entries(ALIASES)) {
    const boundary = key.length < 5 ? "([^a-z0-9]|$)" : "";
    const pattern = new RegExp(`(^|[^a-z0-9])${key}${boundary}`);
    if (pattern.test(normalized)) extra.push(...targets);
  }

  return {
    tokens: [...new Set([...words, ...extra])],
    fromQuery: new Set(words),
  };
}

function containsToken(hay: string, token: string): boolean {
  if (token.length >= 5) return hay.includes(token);
  return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`).test(hay);
}

function scoreEntry(entry: DocsEntry, tokens: string[], fromQuery: Set<string>): number {
  const title = normalize(entry.title);
  const body = normalize(entry.body);
  let score = 0;
  for (const token of tokens) {
    if (containsToken(title, token)) score += 5;
    else if (containsToken(body, token)) score += fromQuery.has(token) ? 2 : 1;
  }
  return score;
}

/**
 * Escolhe verbetes de docs/ que casam com o briefing pastoral, o tema e a passagem.
 * Devolve texto pronto para colar no pedido, ou string vazia.
 */
export function selectDocsEntries(sources: DocsSource[], query: string): string {
  const { tokens, fromQuery } = queryTokens(query);
  if (!tokens.length) return "";

  const ranked = sources
    .flatMap((source) => splitEntries(source.source, source.markdown))
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens, fromQuery) }))
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score);

  const picked: DocsEntry[] = [];
  let used = 0;
  for (const item of ranked) {
    if (picked.length >= 5) break;
    if (used + item.entry.body.length > 5000) continue;
    picked.push(item.entry);
    used += item.entry.body.length;
  }

  if (!picked.length) return "";

  const blocks = picked
    .map((entry) => `### ${entry.title}\nFonte: ${entry.source}\n${entry.body}`)
    .join("\n\n");

  return `
════════════════════════════════════════
FONTES INTERNAS (docs/) — USE NO ENRIQUECIMENTO
════════════════════════════════════════
Verbetes escolhidos porque combinam com o contexto pastoral, o tema ou a passagem.
Use-os no contexto histórico, nas passagens, nas traduções, na exegese e na aplicação.
Não cite o nome do arquivo ao ouvinte. Não contradiga o verbete. Não invente o que ele não diz.
Se o verbete não servir à passagem-eixo, deixe-o de fora em vez de forçar.

${blocks}`;
}
