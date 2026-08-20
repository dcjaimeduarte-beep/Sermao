import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BIBLE_NAME, BIBLE_NT_START } from "@/data/bibleCatalog";
import {
  loadBibleIndex,
  loadChapter,
  lookupPassage,
  neighborChapter,
  searchInBook,
  type BibleIndexEntry,
  type BiblePassage,
} from "@/services/offlineBible";
import { BibleVerseList } from "./BibleVerseList";

interface BibleReaderProps {
  onClose: () => void;
  initialBookId?: string;
  initialChapter?: number;
}

export function BibleReader({ onClose, initialBookId = "joao", initialChapter = 1 }: BibleReaderProps) {
  const [index, setIndex] = useState<BibleIndexEntry[]>([]);
  const [bookId, setBookId] = useState(initialBookId);
  const [chapter, setChapter] = useState(initialChapter);
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [highlightStart, setHighlightStart] = useState<number | null>(null);
  const [highlightEnd, setHighlightEnd] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    loadBibleIndex()
      .then(setIndex)
      .catch(() => setError("Não foi possível abrir o índice da Bíblia."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadChapter(bookId, chapter)
      .then((data) => {
        if (!cancelled) {
          setPassage(data);
          if (data.chapter !== chapter) setChapter(data.chapter);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Não foi possível abrir o capítulo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter]);

  useEffect(() => {
    if (!highlightStart || loading) return;
    document.getElementById(`br-v-${highlightStart}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightStart, loading, passage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const currentMeta = index.find((b) => b.id === bookId);
  const ntIndex = index.findIndex((b) => b.id === BIBLE_NT_START);
  const atBooks = useMemo(() => (ntIndex < 0 ? index : index.slice(0, ntIndex)), [index, ntIndex]);
  const ntBooks = useMemo(() => (ntIndex < 0 ? [] : index.slice(ntIndex)), [index, ntIndex]);
  const chapterCount = currentMeta?.capitulos ?? 1;

  function go(delta: number) {
    const next = neighborChapter(index, bookId, chapter, delta);
    if (!next) return;
    setHighlightStart(null);
    setHighlightEnd(null);
    setSearchError(null);
    setBookId(next.bookId);
    setChapter(next.chapter);
  }

  function marcarVerso(from: number, to?: number) {
    setHighlightStart(from);
    setHighlightEnd(to && to !== from ? to : from);
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchError(null);

    if (/^\d+$/.test(q)) {
      const n = Number(q);
      if (!passage?.verses.some((v) => v.n === n)) {
        setSearchError(`Este capítulo não tem o versículo ${n}.`);
        return;
      }
      marcarVerso(n);
      return;
    }

    const capVerso = q.match(/^(\d+)\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?$/);
    if (capVerso) {
      const cap = Number(capVerso[1]);
      const from = Number(capVerso[2]);
      const to = capVerso[3] ? Number(capVerso[3]) : from;
      if (cap < 1 || cap > chapterCount) {
        setSearchError(`Este livro não tem o capítulo ${cap}.`);
        return;
      }
      setChapter(cap);
      marcarVerso(from, to);
      return;
    }

    try {
      const found = await lookupPassage(q);
      setBookId(found.bookId);
      setChapter(found.chapter);
      marcarVerso(found.verseStart ?? 1, found.verseEnd);
      return;
    } catch {
      /* busca por palavra */
    }

    try {
      const hit = await searchInBook(bookId, q);
      if (!hit) {
        setSearchError("Não achei. Tente uma referência, como João 3:16.");
        return;
      }
      setChapter(hit.chapter);
      marcarVerso(hit.verse);
    } catch {
      setSearchError("Não achei. Tente uma referência, como João 3:16.");
    }
  }

  return (
    <div className="bm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bm-modal br-modal" role="dialog" aria-modal="true" aria-label={BIBLE_NAME}>
        <div className="bm-header">
          <div className="bm-title-row">
            <span className="bm-ref-badge">📖</span>
            <h2 className="bm-title">{BIBLE_NAME}</h2>
          </div>
          <button type="button" className="bm-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form className="br-toolbar" onSubmit={handleSearch}>
          <label className="br-field br-field-book">
            <span className="sr-only">Livro</span>
            <select
              value={bookId}
              aria-label="Livro"
              onChange={(e) => {
                setBookId(e.target.value);
                setChapter(1);
                setHighlightStart(null);
                setHighlightEnd(null);
                setSearchError(null);
              }}
            >
              <optgroup label="Antigo Testamento">
                {atBooks.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </optgroup>
              <optgroup label="Novo Testamento">
                {ntBooks.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="br-field br-field-cap">
            <span className="sr-only">Capítulo</span>
            <select
              value={String(chapter)}
              aria-label="Capítulo"
              onChange={(e) => {
                setChapter(Number(e.target.value));
                setHighlightStart(null);
                setHighlightEnd(null);
                setSearchError(null);
              }}
            >
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="br-field br-field-search">
            <span className="sr-only">Pesquisar versículo</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="João 3:16"
              autoComplete="off"
              aria-label="Pesquisar versículo"
            />
          </label>
          <div className="br-nav">
            <button type="button" className="bm-close-btn" onClick={() => go(-1)} disabled={!index.length} aria-label="Capítulo anterior">←</button>
            <button type="button" className="bm-close-btn" onClick={() => go(1)} disabled={!index.length} aria-label="Próximo capítulo">→</button>
          </div>
        </form>
        {searchError && <p className="br-search-error">{searchError}</p>}

        <div className="bm-body br-body">
          {loading && (
            <div className="bm-state">
              <span className="sgf-spinner bm-spinner" />
              <span>Abrindo o texto…</span>
            </div>
          )}
          {error && (
            <div className="bm-state bm-error">
              <span>⚠</span> {error}
            </div>
          )}
          {passage && !loading && (
            <>
              <h3 className="br-chapter-title">{passage.reference}</h3>
              <BibleVerseList
                passage={passage}
                highlightStart={highlightStart}
                highlightEnd={highlightEnd}
              />
            </>
          )}
        </div>

        <div className="bm-footer">
          <span className="bm-source">RA + NVI · selecione uma palavra</span>
          <button type="button" className="bm-close-btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
