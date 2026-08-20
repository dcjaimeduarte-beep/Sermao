import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  displayMeaning,
  isTithesLexiconSource,
  lookupWord,
  type LexiconEntry,
} from "@/services/bibleLexicon";

function hitText(entry: LexiconEntry): string {
  if (isTithesLexiconSource(entry.source)) {
    const raw = (entry.body || entry.meaning || "").trim();
    const cleaned = raw
      .replace(/\n---\s*\n##[\s\S]*$/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .trim();
    return cleaned.length > 900 ? `${cleaned.slice(0, 880).trim()}…` : cleaned;
  }
  return displayMeaning(entry);
}

export function WordMeaningLookup({
  children,
  enabled = true,
  includeTithes = false,
  hint,
  className,
}: {
  children: ReactNode;
  enabled?: boolean;
  includeTithes?: boolean;
  hint?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<{ text: string; x: number; y: number } | null>(null);
  const [meaning, setMeaning] = useState<{ query: string; hits: LexiconEntry[] } | null>(null);
  const [loadingMeaning, setLoadingMeaning] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPick(null);
      return;
    }
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
  }, [enabled]);

  async function searchMeaning() {
    if (!pick) return;
    const word = pick.text;
    setLoadingMeaning(true);
    setMeaning(null);
    setPick(null);
    window.getSelection()?.removeAllRanges();
    try {
      setMeaning(await lookupWord(word, { includeTithes }));
    } catch {
      setMeaning({ query: word, hits: [] });
    } finally {
      setLoadingMeaning(false);
    }
  }

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div className={className} ref={rootRef}>
      {children}
      {hint ? <p className="br-orig-note">{hint}</p> : null}

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
              Não achei o significado de “{meaning.query}” no dicionário bíblico
              {includeTithes ? " nem na referência de dízimos e ofertas" : ""}.
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
                <p className="br-meaning-body">{hitText(hit)}</p>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
