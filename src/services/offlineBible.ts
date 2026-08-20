import { BIBLE_ALIASES } from "@/data/bibleCatalog";

export interface BibleIndexEntry {
  id: string;
  nome: string;
  capitulos: number;
}

export interface BibleVerse {
  n: number;
  text: string;
  ra?: string;
}

export interface BiblePassage {
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  reference: string;
  verses: BibleVerse[];
}

interface BibleBookFile {
  id: string;
  nome?: string;
  capitulos: string[][];
}

const bookCache = new Map<string, BibleBookFile>();
const raCache = new Map<string, BibleBookFile>();
let indexCache: BibleIndexEntry[] | null = null;
let aliasTable: Array<{ id: string; alias: string }> | null = null;

function bibleAsset(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, "")}`;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

export async function loadBibleIndex(): Promise<BibleIndexEntry[]> {
  if (indexCache) return indexCache;
  const res = await fetch(bibleAsset("bible/index.json"));
  if (!res.ok) throw new Error("Índice da Bíblia indisponível");
  indexCache = (await res.json()) as BibleIndexEntry[];
  return indexCache;
}

export async function loadBook(id: string): Promise<BibleBookFile> {
  const hit = bookCache.get(id);
  if (hit) return hit;
  const res = await fetch(bibleAsset(`bible/books/${id}.json`));
  if (!res.ok) throw new Error("Livro não encontrado");
  const data = (await res.json()) as BibleBookFile;
  bookCache.set(id, data);
  return data;
}

export async function searchInBook(
  bookId: string,
  query: string
): Promise<{ chapter: number; verse: number } | null> {
  const book = await loadBook(bookId);
  const q = query.toLowerCase().trim();
  if (!q) return null;
  for (let c = 0; c < book.capitulos.length; c++) {
    for (let v = 0; v < book.capitulos[c].length; v++) {
      if (book.capitulos[c][v].toLowerCase().includes(q)) {
        return { chapter: c + 1, verse: v + 1 };
      }
    }
  }
  return null;
}

async function loadRaBook(id: string): Promise<BibleBookFile | null> {
  const hit = raCache.get(id);
  if (hit) return hit;
  try {
    const res = await fetch(bibleAsset(`bible/ra/books/${id}.json`));
    if (!res.ok) return null;
    const data = (await res.json()) as BibleBookFile;
    raCache.set(id, data);
    return data;
  } catch {
    return null;
  }
}

function attachRa(verses: BibleVerse[], ra: BibleBookFile | null, chapter: number): BibleVerse[] {
  if (!ra) return verses;
  const chapterRa = ra.capitulos[chapter - 1] ?? [];
  return verses.map((v) => ({
    ...v,
    ra: chapterRa[v.n - 1] || undefined,
  }));
}

async function getAliasTable(): Promise<Array<{ id: string; alias: string }>> {
  if (aliasTable) return aliasTable;
  const index = await loadBibleIndex();
  const rows: Array<{ id: string; alias: string }> = [];
  for (const book of index) {
    const names = new Set<string>([normalize(book.nome), ...(BIBLE_ALIASES[book.id] ?? []).map(normalize)]);
    for (const alias of names) {
      if (alias) rows.push({ id: book.id, alias });
    }
  }
  rows.sort((a, b) => b.alias.length - a.alias.length);
  aliasTable = rows;
  return rows;
}

function formatReference(bookName: string, chapter: number, verseStart?: number, verseEnd?: number): string {
  if (!verseStart) return `${bookName} ${chapter}`;
  if (!verseEnd || verseEnd === verseStart) return `${bookName} ${chapter}:${verseStart}`;
  return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}

export function formatPassageText(passage: BiblePassage): string {
  return passage.verses.map((v) => `${v.n}  ${v.text}`).join("\n\n");
}

export async function lookupPassage(refText: string): Promise<BiblePassage> {
  const raw = normalize(refText);
  const aliases = await getAliasTable();
  const index = await loadBibleIndex();

  const match = aliases.find((row) => raw === row.alias || raw.startsWith(`${row.alias} `));
  if (!match) throw new Error("Não reconheci essa referência.");

  const rest = raw.slice(match.alias.length).trim();
  const meta = index.find((b) => b.id === match.id);
  if (!meta) throw new Error("Livro não encontrado.");

  let chapter = 1;
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  if (rest) {
    const m = rest.match(/^(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
    if (!m) throw new Error("Não reconheci capítulo e versículo.");
    chapter = Number(m[1]);
    if (m[2]) verseStart = Number(m[2]);
    if (m[3]) verseEnd = Number(m[3]);
  }

  if (chapter < 1 || chapter > meta.capitulos) {
    throw new Error(`${meta.nome} tem ${meta.capitulos} capítulos.`);
  }

  const [book, ra] = await Promise.all([loadBook(meta.id), loadRaBook(meta.id)]);
  const chapterVerses = book.capitulos[chapter - 1] ?? [];
  const maxVerse = chapterVerses.length;

  if (verseStart && verseStart > maxVerse) {
    throw new Error(`${meta.nome} ${chapter} tem ${maxVerse} versículos.`);
  }

  const from = verseStart ?? 1;
  const to = Math.min(verseEnd ?? (verseStart ? verseStart : maxVerse), maxVerse);
  const verses: BibleVerse[] = [];
  for (let n = from; n <= to; n++) {
    const text = chapterVerses[n - 1];
    if (text) verses.push({ n, text });
  }

  return {
    bookId: meta.id,
    bookName: meta.nome,
    chapter,
    verseStart,
    verseEnd: verseEnd && verseEnd !== verseStart ? verseEnd : undefined,
    reference: formatReference(meta.nome, chapter, verseStart, verseEnd),
    verses: attachRa(verses, ra, chapter),
  };
}

export async function loadChapter(bookId: string, chapter: number): Promise<BiblePassage> {
  const index = await loadBibleIndex();
  const meta = index.find((b) => b.id === bookId);
  if (!meta) throw new Error("Livro não encontrado.");
  const safeChapter = Math.min(Math.max(1, chapter), meta.capitulos);
  const [book, ra] = await Promise.all([loadBook(meta.id), loadRaBook(meta.id)]);
  const chapterVerses = book.capitulos[safeChapter - 1] ?? [];
  const verses = chapterVerses.map((text, i) => ({ n: i + 1, text }));
  return {
    bookId: meta.id,
    bookName: meta.nome,
    chapter: safeChapter,
    reference: `${meta.nome} ${safeChapter}`,
    verses: attachRa(verses, ra, safeChapter),
  };
}

export function neighborChapter(
  index: BibleIndexEntry[],
  bookId: string,
  chapter: number,
  delta: number
): { bookId: string; chapter: number } | null {
  const i = index.findIndex((b) => b.id === bookId);
  if (i < 0) return null;
  if (delta > 0) {
    if (chapter < index[i].capitulos) return { bookId, chapter: chapter + 1 };
    if (i + 1 >= index.length) return null;
    return { bookId: index[i + 1].id, chapter: 1 };
  }
  if (chapter > 1) return { bookId, chapter: chapter - 1 };
  if (i - 1 < 0) return null;
  return { bookId: index[i - 1].id, chapter: index[i - 1].capitulos };
}
