/**
 * Gera public/bible/original/books/*.json a partir de
 * public/bible/_ot.json (WLC hebraico) e _nt.json (Tischendorf grego).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "bible", "index.json"), "utf8"));
const OUT = path.join(ROOT, "public", "bible", "original", "books");
const OT = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "bible", "_ot.json"), "utf8"));
const NT = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "bible", "_nt.json"), "utf8"));

fs.mkdirSync(OUT, { recursive: true });

function compactBook(srcBook, id, lingua) {
  const capitulos = (srcBook.chapters || []).map((ch) => {
    const verses = ch.verses || [];
    const max = verses.reduce((m, v) => Math.max(m, v.verse || 0), 0);
    const row = Array.from({ length: max }, () => "");
    for (const v of verses) {
      if (v.verse >= 1) row[v.verse - 1] = String(v.text || "").trim();
    }
    return row;
  });
  return { id, lingua, capitulos };
}

const byNr = new Map();
for (const b of OT.books) byNr.set(b.nr, { book: b, lingua: "hebraico" });
for (const b of NT.books) byNr.set(b.nr, { book: b, lingua: "grego" });

let count = 0;
INDEX.forEach((meta, i) => {
  const nr = i + 1;
  const hit = byNr.get(nr);
  if (!hit) {
    console.error("Sem original para", meta.id, "nr", nr);
    process.exit(1);
  }
  const payload = compactBook(hit.book, meta.id, hit.lingua);
  fs.writeFileSync(path.join(OUT, `${meta.id}.json`), JSON.stringify(payload));
  count += 1;
});

console.log(`OK ${count} livros originais em public/bible/original/books/`);
