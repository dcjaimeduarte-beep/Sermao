export interface LexiconEntry {
  title: string;
  source: string;
  meaning?: string;
  origin?: string;
  aliases?: string[];
  body: string;
}

const STOP = new Set([
  "a", "o", "as", "os", "um", "uma", "de", "da", "do", "das", "dos", "em", "no", "na",
  "e", "ou", "que", "se", "por", "para", "com", "ao", "isto", "isso", "foi", "ser",
  "nao", "não", "mais", "como", "quando", "ele", "ela", "seu", "sua", "antes", "ainda",
  "lhe", "lhes", "vos", "nos", "pelo", "pela", "sem", "sob", "entre",
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

function keysOf(entry: LexiconEntry): string[] {
  const raw = [entry.title, ...(entry.aliases ?? [])];
  return [...new Set(raw.map((k) => foldText(k.replace(/\([^)]*\)/g, " ")).trim()).filter(Boolean))];
}

function asWord(hay: string, needle: string): boolean {
  if (!needle) return false;
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${needle.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:$|[^\\p{L}\\p{N}])`, "u");
  return re.test(hay);
}

/** Só definição da palavra — ignora artigos de dízimo/oferta. */
export function isTithesLexiconSource(source: string): boolean {
  return /dizim|oferta/i.test(foldText(source));
}

export function rankLexiconHits(query: string, entries: LexiconEntry[]): LexiconEntry[] {
  const q = foldText(query).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (q.length < 2) return [];

  const scored = entries
    .filter((entry) => !isTithesLexiconSource(entry.source))
    .map((entry) => {
      const keys = keysOf(entry);
      const meaning = foldText(entry.meaning || "");
      let score = 0;
      if (keys.some((k) => k === q || (k.split(/\s+/).find(Boolean) ?? "") === q)) score = 100;
      else if (q.length >= 3 && keys.some((k) => k.startsWith(q))) score = 80;
      else if (q.length >= 6 && keys.some((k) => k.split(/\s+/).includes(q))) score = 70;
      else if (
        entry.source === "Dicionário" &&
        q.length >= 4 &&
        meaning &&
        (foldText(meaning).startsWith(q) || asWord(meaning.slice(0, 70), q))
      ) {
        score = 40;
      }
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "pt"));

  const hasTitleHit = scored.some((row) => row.score >= 60);
  const kept = hasTitleHit ? scored.filter((row) => row.score >= 60) : scored.filter((row) => row.score >= 40);
  return kept.slice(0, 5).map((row) => row.entry);
}

export function displayMeaning(entry: LexiconEntry): string {
  const meaning = (entry.meaning || "").trim();
  if (meaning) return meaning;
  return (entry.body || "")
    .replace(/\n---\s*\n##[\s\S]*$/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

export function cleanLexiconBody(body: string): string {
  return displayMeaning({ title: "", source: "", body });
}

export async function loadLexicon(): Promise<LexiconEntry[]> {
  if (cache) return cache;
  const res = await fetch(bibleAsset("bible/lexicon.json"));
  if (!res.ok) throw new Error("Dicionário indisponível");
  cache = (await res.json()) as LexiconEntry[];
  return cache;
}

export async function lookupWord(raw: string): Promise<{ query: string; hits: LexiconEntry[] }> {
  const folded = foldText(raw).replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = folded.split(/\s+/).filter((w) => w.length >= 2 && !STOP.has(w));
  const query = (words.sort((a, b) => b.length - a.length)[0] ?? folded.trim()).trim();
  if (!query) return { query: raw.trim(), hits: [] };
  const entries = await loadLexicon();
  return { query, hits: rankLexiconHits(query, entries) };
}
