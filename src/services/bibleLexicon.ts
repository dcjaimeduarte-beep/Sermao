export interface LexiconEntry {
  title: string;
  source: string;
  body: string;
}

const STOP = new Set([
  "a", "o", "as", "os", "um", "uma", "de", "da", "do", "das", "dos", "em", "no", "na",
  "e", "ou", "que", "se", "por", "para", "com", "ao", "isto", "isso", "foi", "ser",
  "nao", "não", "mais", "como", "quando", "ele", "ela", "seu", "sua", "antes", "ainda",
]);

let cache: LexiconEntry[] | null = null;

function bibleAsset(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, "")}`;
}

export function foldText(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function cleanLexiconBody(body: string): string {
  return body
    .replace(/\n---\s*\n##[\s\S]*$/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export async function loadLexicon(): Promise<LexiconEntry[]> {
  if (cache) return cache;
  const res = await fetch(bibleAsset("bible/lexicon.json"));
  if (!res.ok) throw new Error("Dicionário indisponível");
  cache = (await res.json()) as LexiconEntry[];
  return cache;
}

function titleKey(title: string): string {
  return foldText(title.replace(/\([^)]*\)/g, " "));
}

export async function lookupWord(raw: string): Promise<{ query: string; hits: LexiconEntry[] }> {
  const folded = foldText(raw).replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = folded.split(/\s+/).filter((w) => w.length >= 2 && !STOP.has(w));
  const query = (words.sort((a, b) => b.length - a.length)[0] ?? folded.trim()).trim();
  if (!query) return { query: raw.trim(), hits: [] };

  const entries = await loadLexicon();
  const scored = entries
    .map((entry) => {
      const t = titleKey(entry.title);
      const b = foldText(entry.body);
      let score = 0;
      if (t === query || t.split(/\s+/).includes(query)) score = 100;
      else if (t.startsWith(query) || (query.length >= 4 && t.includes(` ${query}`))) score = 80;
      else if (t.includes(query)) score = 55;
      else if (new RegExp(`(?:^|\\s)${query.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\s|$)`).test(b)) score = 30;
      else if (query.length >= 4 && b.includes(query)) score = 12;
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "pt"));

  return { query, hits: scored.slice(0, 8).map((row) => row.entry) };
}
