import { BIBLE_NAME } from "@/data/bibleCatalog";
import type { BiblePassage } from "@/services/offlineBible";
import { WordMeaningLookup } from "./WordMeaningLookup";

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

  return (
    <WordMeaningLookup
      className="br-verses"
      hint={`RA + NVI · ${BIBLE_NAME}. Selecione uma palavra para ver o significado.`}
    >
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
    </WordMeaningLookup>
  );
}
