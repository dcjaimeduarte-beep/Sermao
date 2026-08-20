import { useEffect, useState } from "react";
import { BIBLE_TRANSLATION_LABEL } from "@/data/bibleCatalog";
import { lookupPassage, type BiblePassage } from "@/services/offlineBible";
import { BibleVerseList } from "./BibleVerseList";

interface BiblePassageModalProps {
  refText: string;
  onClose: () => void;
  onOpenReader?: (bookId: string, chapter: number) => void;
}

export function BiblePassageModal({ refText, onClose, onOpenReader }: BiblePassageModalProps) {
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPassage(null);
    lookupPassage(refText)
      .then((data) => {
        if (!cancelled) setPassage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível abrir essa passagem.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refText]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="bm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bm-modal" role="dialog" aria-modal="true" aria-label={refText}>
        <div className="bm-header">
          <div className="bm-title-row">
            <span className="bm-ref-badge">📖</span>
            <h2 className="bm-title">{passage?.reference ?? refText}</h2>
          </div>
          <button type="button" className="bm-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="bm-body">
          {loading && (
            <div className="bm-state">
              <span className="sgf-spinner bm-spinner" />
              <span>Abrindo passagem…</span>
            </div>
          )}
          {error && (
            <div className="bm-state bm-error">
              <span>⚠</span> {error}
            </div>
          )}
          {passage && !loading && <BibleVerseList passage={passage} />}
        </div>

        <div className="bm-footer">
          <span className="bm-source">{BIBLE_TRANSLATION_LABEL} · neste aparelho</span>
          <div className="bm-footer-actions">
            {passage && onOpenReader && (
              <button
                type="button"
                className="bm-close-btn"
                onClick={() => onOpenReader(passage.bookId, passage.chapter)}
              >
                Capítulo completo
              </button>
            )}
            <button type="button" className="bm-close-btn" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
