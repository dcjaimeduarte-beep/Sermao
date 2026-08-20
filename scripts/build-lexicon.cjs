/**
 * Gera public/bible/lexicon.json para "Pesquisar significado".
 * Dicionário e enciclopédia sempre. Dízimos/ofertas só entram na busca
 * quando o esboço tem a flag de mordomia ligada.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function stripMd(s) {
  return String(s)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleAliases(title) {
  const aliases = [];
  const main = title.replace(/\([^)]*\)/g, " ").replace(/[—–].*$/, " ").trim();
  if (main) aliases.push(main);
  for (const m of title.matchAll(/\(([^)]+)\)/g)) {
    for (const bit of m[1].split(/[,/]/)) {
      const cleaned = bit.replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim();
      if (cleaned.length >= 2) aliases.push(cleaned);
    }
  }
  return [...new Set(aliases.filter(Boolean))];
}

function extractLabeled(body, labels) {
  const lines = body.split("\n");
  for (const label of labels) {
    const re = new RegExp(`^\\s*[-*]?\\s*\\*\\*${label}:\\*\\*\\s*(.*)`, "i");
    for (const line of lines) {
      const m = line.match(re);
      if (m && m[1].trim()) return stripMd(m[1]);
    }
  }
  return "";
}

function firstProse(body) {
  const lines = body
    .split("\n")
    .map((line) => stripMd(line.replace(/^\s*[-*]\s+/, "")))
    .filter((t) => t && !t.startsWith("|") && !t.startsWith("#") && !/^[-:| ]+$/.test(t) && t.length >= 8);
  const preferred = lines.find((t) => /^(Chamado|Missão|Definição|Significado|Tipo|Teologia central)\b/i.test(t));
  if (preferred) return preferred.replace(/^[^:]+:\s*/, "");
  const rest = lines.filter((t) => !/^(Período|Origem|NT|AT|Uso|Passagens)\b/i.test(t));
  return rest[0] || lines[0] || "";
}

function pushEntry(entries, { title, source, meaning, origin, aliases, body }) {
  const cleanTitle = stripMd(title).replace(/\s+/g, " ").trim();
  if (!cleanTitle || cleanTitle.length > 80) return;
  if (/^#+/.test(cleanTitle) || /^(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)$/i.test(cleanTitle)) {
    return;
  }
  const meaningText = (meaning || "").trim();
  const bodyText = (body || "").trim();
  if (!meaningText && bodyText.length < 20) return;
  entries.push({
    title: cleanTitle,
    source,
    meaning: meaningText || firstProse(bodyText),
    origin: (origin || "").trim(),
    aliases: [...new Set((aliases || titleAliases(cleanTitle)).map((a) => a.trim()).filter((a) => a.length >= 2))],
    body: bodyText,
  });
}

function parseDictionary(md) {
  const entries = [];
  const parts = md.split(/^### /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const title = (nl < 0 ? part : part.slice(0, nl)).trim();
    let body = (nl < 0 ? "" : part.slice(nl + 1)).trim();
    body = body.replace(/\n---\s*\n##[\s\S]*$/, "").trim();
    const meaning =
      extractLabeled(body, ["Significado", "Definição", "Tradução"]) || firstProse(body);
    const origin = extractLabeled(body, ["Origem", "Hebraico", "Grego"]);
    const aliases = titleAliases(title);
    const traducao = extractLabeled(body, ["Tradução"]);
    if (traducao) {
      for (const bit of traducao.split(/[,;]/)) {
        const w = bit.replace(/\([^)]*\)/g, "").trim();
        if (w.length >= 2 && w.length <= 40) aliases.push(w);
      }
    }
    pushEntry(entries, {
      title,
      source: "Dicionário",
      meaning,
      origin,
      aliases,
      body,
    });
  }
  return entries;
}

function parseEncyclopediaHeadings(md) {
  const entries = [];
  const parts = md.split(/^### /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const title = (nl < 0 ? part : part.slice(0, nl)).trim();
    let body = (nl < 0 ? "" : part.slice(nl + 1)).trim();
    body = body.replace(/\n---\s*\n##[\s\S]*$/, "").trim();
    if (/^(Antigo Testamento|Novo Testamento)$/i.test(title) && /\*\*[^*]{2,40}\*\*\n/.test(body)) {
      continue;
    }
    pushEntry(entries, {
      title,
      source: "Enciclopédia",
      meaning: firstProse(body),
      origin: "",
      aliases: titleAliases(title),
      body,
    });
  }
  return entries;
}

function parseBoldPeople(md) {
  const entries = [];
  const re = /\*\*([^*]{2,50})\*\*\n((?:[-*] .+\n?)+)/g;
  let m;
  while ((m = re.exec(md))) {
    const title = m[1].trim();
    if (/^(Divisão geográfica|Contexto |Instituições|Características|Cidades)/i.test(title)) continue;
    const body = m[2].trim();
    pushEntry(entries, {
      title,
      source: "Enciclopédia",
      meaning: firstProse(body),
      origin: "",
      aliases: titleAliases(title),
      body,
    });
  }
  return entries;
}

function parseInlineGlossary(md) {
  const entries = [];
  const re = /^[-*] \*\*([^*]{2,40}):\*\*\s+(.+)$/gm;
  let m;
  while ((m = re.exec(md))) {
    const title = m[1].trim();
    const meaning = stripMd(m[2]);
    if (meaning.length < 12) continue;
    if (/^(Passagens|NT|AT|Uso|Tipo|Debate|Atenção|Implicação|Central|Natureza)/i.test(title)) continue;
    pushEntry(entries, {
      title,
      source: "Enciclopédia",
      meaning,
      origin: "",
      aliases: titleAliases(title),
      body: meaning,
    });
  }
  return entries;
}

function parseMeaningTables(md) {
  const entries = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length - 2; i++) {
    const header = lines[i];
    if (!/\|/.test(header)) continue;
    const cols = header.split("|").map((c) => stripMd(c)).filter(Boolean);
    const meaningIdx = cols.findIndex((c) => /significado/i.test(c));
    if (meaningIdx < 0) continue;
    const nameIdx = 0;
    if (!/^\|[-:| ]+\|$/.test(lines[i + 1].trim())) continue;
    for (let j = i + 2; j < lines.length; j++) {
      if (!lines[j].includes("|") || lines[j].trim().startsWith("#")) break;
      const cells = lines[j].split("|").map((c) => stripMd(c)).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length <= Math.max(nameIdx, meaningIdx)) continue;
      const title = cells[nameIdx];
      const meaning = cells[meaningIdx];
      if (!title || !meaning || meaning === "—" || meaning === "-") continue;
      const extra = cells.filter((_, idx) => idx !== nameIdx && idx !== meaningIdx).join(". ");
      pushEntry(entries, {
        title,
        source: "Enciclopédia",
        meaning: extra ? `${meaning}. ${extra}` : meaning,
        origin: "",
        aliases: titleAliases(title),
        body: extra ? `${meaning}. ${extra}` : meaning,
      });
    }
  }
  return entries;
}

const CORE_WORDS = [
  {
    title: "Deus",
    origin: "Hebraico ʾĕlōhîm / YHWH; grego theós",
    meaning: "O Senhor, Criador e Sustentador de todas as coisas; o Deus de Israel, revelado plenamente em Jesus Cristo.",
    aliases: ["Deus", "Elohim", "Yahweh", "Jeová"],
  },
  {
    title: "Senhor",
    origin: "Hebraico YHWH / ʾădōnāy; grego kýrios",
    meaning: "Título de autoridade e adoração: Deus como Dono e Rei; no NT, confessar Jesus como Senhor.",
    aliases: ["Senhor", "Kyrios"],
  },
  {
    title: "Espírito Santo",
    origin: "Hebraico rûaḥ; grego pneûma",
    meaning: "A terceira Pessoa da Trindade: o Espírito de Deus que dá vida, convence do pecado, habita o crente e produz fruto.",
    aliases: ["Espírito", "Espírito Santo", "Pneuma", "Ruach"],
  },
  {
    title: "Pecado",
    origin: "Hebraico ḥaṭṭāʾt; grego hamartía",
    meaning: "Errar o alvo da vontade de Deus — rebelião, culpa e ruptura com o Senhor, da qual o evangelho liberta.",
    aliases: ["Pecado", "pecados", "pecador"],
  },
  {
    title: "Evangelho",
    origin: "Grego euangélion = boa-nova",
    meaning: "A boa-nova de salvação: Cristo morreu pelos pecados, foi sepultado e ressuscitou, segundo as Escrituras.",
    aliases: ["Evangelho"],
  },
  {
    title: "Reino",
    origin: "Grego basileía",
    meaning: "O governo de Deus: já presente em Cristo e ainda aguardado em plenitude na sua vinda.",
    aliases: ["Reino", "Reino de Deus", "Reino dos Céus"],
  },
  {
    title: "Luz",
    origin: "Grego phōs",
    meaning: "Na Escritura, a luz é revelação, santidade e vida em Deus; Cristo é a luz do mundo, em contraste com as trevas do pecado.",
    aliases: ["Luz"],
  },
  {
    title: "Paz",
    origin: "Hebraico shālôm; grego eirḗnē",
    meaning: "Não só ausência de conflito, mas plenitude, reconciliação e bem-estar que vêm de Deus em Cristo.",
    aliases: ["Paz", "shalom"],
  },
  {
    title: "Verdade",
    origin: "Grego alḗtheia",
    meaning: "Aquilo que é real e fiel da parte de Deus; Jesus é o caminho, a verdade e a vida.",
    aliases: ["Verdade"],
  },
  {
    title: "Vida",
    origin: "Grego zōḗ / bíos",
    meaning: "Dom de Deus: existência física e, sobretudo, vida eterna em comunhão com Cristo.",
    aliases: ["Vida"],
  },
  {
    title: "Dízimo",
    origin: "Hebraico maʿăśēr = a décima parte",
    meaning: "A décima parte reconhecida como pertencente ao Senhor — confissão de que Deus é dono do total, não só de um percentual.",
    aliases: ["Dízimo", "dízimos"],
  },
  {
    title: "Oferta",
    origin: "Hebraico qorbān / terûmāh; grego prosphorá",
    meaning: "Dádiva voluntária trazida a Deus, além do dízimo: expressão de gratidão, amor e participação no culto e na missão.",
    aliases: ["Oferta", "ofertas"],
  },
];

function parseTithes(md) {
  const entries = [];
  const parts = md.split(/^### /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const title = (nl < 0 ? part : part.slice(0, nl)).trim();
    let body = (nl < 0 ? "" : part.slice(nl + 1)).trim();
    body = body.replace(/\n---\s*\n##[\s\S]*$/, "").trim();
    pushEntry(entries, {
      title,
      source: "Dízimos e ofertas",
      meaning: firstProse(body),
      origin: extractLabeled(body, ["Hebraico-chave", "Hebraico", "Grego"]),
      aliases: titleAliases(title),
      body,
    });
  }
  return entries;
}

const dicPath = path.join(ROOT, "docs", "dicionario-biblico.md");
const encPath = path.join(ROOT, "docs", "enciclopedia-biblica.md");
const entries = [];

if (fs.existsSync(dicPath)) entries.push(...parseDictionary(fs.readFileSync(dicPath, "utf8")));
for (const word of CORE_WORDS) {
  pushEntry(entries, { ...word, source: "Dicionário", body: word.meaning });
}
if (fs.existsSync(encPath)) {
  const enc = fs.readFileSync(encPath, "utf8");
  entries.push(...parseEncyclopediaHeadings(enc));
  entries.push(...parseBoldPeople(enc));
  entries.push(...parseInlineGlossary(enc));
  entries.push(...parseMeaningTables(enc));
}
const tithesPath = path.join(ROOT, "docs", "dizimos-ofertas-referencia.md");
if (fs.existsSync(tithesPath)) {
  entries.push(...parseTithes(fs.readFileSync(tithesPath, "utf8")));
}

const seen = new Set();
const unique = [];
for (const e of entries) {
  const key = `${e.source}::${e.title.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(e);
}

const out = path.join(ROOT, "public", "bible", "lexicon.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(unique));
console.log(`OK ${unique.length} verbetes de significado em public/bible/lexicon.json`);
console.log(`  Dicionário: ${unique.filter((e) => e.source === "Dicionário").length}`);
console.log(`  Enciclopédia: ${unique.filter((e) => e.source === "Enciclopédia").length}`);
console.log(`  Dízimos: ${unique.filter((e) => /d[ií]zim/i.test(e.source)).length}`);
