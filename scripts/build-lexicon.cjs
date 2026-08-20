/**
 * Gera public/bible/lexicon.json a partir dos markdowns em docs/.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCES = [
  { file: "dicionario-biblico.md", source: "Dicionário" },
  { file: "enciclopedia-biblica.md", source: "Enciclopédia" },
  { file: "dizimos-ofertas-referencia.md", source: "Dízimos e ofertas" },
];

function parseEntries(md, source) {
  const parts = md.split(/^### /m);
  const entries = [];
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const title = (nl < 0 ? part : part.slice(0, nl)).trim().replace(/\*+/g, "");
    const body = (nl < 0 ? "" : part.slice(nl + 1)).trim();
    if (!title || title.length > 80) continue;
    entries.push({ title, source, body });
  }
  return entries;
}

const entries = [];
for (const src of SOURCES) {
  const full = path.join(ROOT, "docs", src.file);
  if (!fs.existsSync(full)) continue;
  entries.push(...parseEntries(fs.readFileSync(full, "utf8"), src.source));
}

fs.mkdirSync(path.join(ROOT, "public", "bible"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public", "bible", "lexicon.json"), JSON.stringify(entries));
console.log(`OK ${entries.length} verbetes em public/bible/lexicon.json`);
