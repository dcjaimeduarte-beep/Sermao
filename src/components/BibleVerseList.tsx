import { useEffect, useRef, useState } from "react";
import { BIBLE_NAME } from "@/data/bibleCatalog";
import { displayMeaning, lookupWord, type LexiconEntry } from "@/services/bibleLexicon";
import type { BiblePassage } from "@/services/offlineBible";

export function BibleVerseList({
  passage,
  highlightStart,
  highlightEnd,
}: {
  passage: BiblePassage;
  highlightStart?: number | null;
  highlightEnd?: number | null;
}) {
  const from = highlightStart ?? 0;
  const to = highlightEnd ?? highlightStart ?? 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<{ text: string; x: number; y: number } | null>(null);
  const [meaning, setMeaning] = useState<{ query: string; hits: LexiconEntry[] } | null>(null);
  const [loadingMeaning, setLoadingMeaning] = useState(false);

  useEffect(() => {
    function readSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setPick(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (!text || text.split(" ").length > 5) {
        setPick(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const root = rootRef.current;
      if (!root || !root.contains(range.commonAncestorContainer)) {
        setPick(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setPick({
        text,
        x: Math.min(Math.max(12, rect.left + rect.width / 2), window.innerWidth - 12),
        y: Math.max(8, rect.top - 8),
      });
    }
    function onPointerUp() {
      window.setTimeout(readSelection, 0);
    }
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchend", onPointerUp);
    return () => {
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchend", onPointerUp);
    };
  }, []);

  async function searchMeaning() {
    if (!pick) return;
    const word = pick.text;
    setLoadingMeaning(true);
    setMeaning(null);
    setPick(null);
    window.getSelection()?.removeAllRanges();
    try {
      setMeaning(await lookupWord(word));
    } catch {
      setMeaning({ query: word, hits: [] });
    } finally {
      setLoadingMeaning(false);
    }
  }

  return (
    <div className="br-verses" ref={rootRef}>
      {passage.verses.map((v) => {
        const active = from > 0 && v.n >= from && v.n <= to;
        return (
          <article key={v.n} id={`br-v-${v.n}`} className={`br-v${active ? " is-active" : ""}`}>
            <span className="br-v-n">{v.n}</span>
            <div className="br-v-body">
              {v.ra && (
                <p className="br-v-ra">
                  <span className="br-v-tag">RA</span>
                  {v.ra}
                </p>
              )}
              <p className="br-v-pt">
                <span className="br-v-tag">NVI</span>
                {v.text}
              </p>
            </div>
          </article>
        );
      })}
      <p className="br-orig-note">
        RA + NVI · {BIBLE_NAME}. Selecione uma palavra para ver o significado.
      </p>

      {pick && (
        <button
          type="button"
          className="br-lookup-btn"
          style={{ left: pick.x, top: pick.y }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={searchMeaning}
        >
          Pesquisar significado
        </button>
      )}

      {(loadingMeaning || meaning) && (
        <div className="br-meaning" role="dialog" aria-label="Significado">
          <div className="br-meaning-head">
            <h4>{loadingMeaning ? "Buscando…" : `Significado de “${meaning?.query ?? ""}”`}</h4>
            <button
              type="button"
              className="bm-close"
              onClick={() => {
                setMeaning(null);
                setLoadingMeaning(false);
              }}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          {loadingMeaning && (
            <div className="bm-state">
              <span className="sgf-spinner bm-spinner" />
              <span>Buscando o significado…</span>
            </div>
          )}
          {meaning && !loadingMeaning && meaning.hits.length === 0 && (
            <p className="br-meaning-empty">
              Não achei o significado de “{meaning.query}” no dicionário bíblico.
            </p>
          )}
          {meaning &&
            !loadingMeaning &&
            meaning.hits.map((hit) => (
              <article key={`${hit.source}-${hit.title}`} className="br-meaning-hit">
                <p className="br-meaning-meta">
                  <span className="br-v-tag">{hit.source}</span>
                  <strong>{hit.title}</strong>
                </p>
                {hit.origin ? <p className="br-meaning-origin">{hit.origin}</p> : null}
                <p className="br-meaning-body">{displayMeaning(hit)}</p>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
