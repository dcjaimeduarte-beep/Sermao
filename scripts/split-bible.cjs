/**
 * Fatia JSON thiagobodruk em um arquivo por livro.
 * Uso: node scripts/split-bible.cjs          → NVI em public/bible/books
 *      node scripts/split-bible.cjs ra       → RA em public/bible/ra/books
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MODE = process.argv[2] === "ra" ? "ra" : "nvi";
const SRC = path.join(ROOT, "public", "bible", MODE === "ra" ? "_ra.json" : "_source.json");
const OUT_DIR = path.join(ROOT, "public", "bible", MODE === "ra" ? path.join("ra", "books") : "books");
const INDEX = MODE === "ra" ? null : path.join(ROOT, "public", "bible", "index.json");

const ABBREV_TO_ID = {
  gn: "genesis", ex: "exodo", lv: "levitico", nm: "numeros", dt: "deuteronomio",
  js: "josue", jz: "juizes", rt: "rute", "1sm": "1samuel", "2sm": "2samuel",
  "1rs": "1reis", "2rs": "2reis", "1cr": "1cronicas", "2cr": "2cronicas",
  ed: "esdras", ne: "neemias", et: "ester", jó: "job", jo: "joao",
  sl: "salmos", pv: "proverbios", ec: "eclesiastes", ct: "cantares",
  is: "isaias", jr: "jeremias", lm: "lamentacoes", ez: "ezequiel", dn: "daniel",
  os: "oseias", jl: "joel", am: "amos", ob: "obadias", jn: "jonas", mq: "miqueias",
  na: "naum", hc: "habacuque", sf: "sofonias", ag: "ageu", zc: "zacarias", ml: "malaquias",
  mt: "mateus", mc: "marcos", lc: "lucas", atos: "atos", rm: "romanos",
  "1co": "1corintios", "2co": "2corintios", gl: "galatas", ef: "efesios",
  fp: "filipenses", cl: "colossenses", "1ts": "1tessalonicenses", "2ts": "2tessalonicenses",
  "1tm": "1timoteo", "2tm": "2timoteo", tt: "tito", fm: "filemom", hb: "hebreus",
  tg: "tiago", "1pe": "1pedro", "2pe": "2pedro", "1jo": "1joao", "2jo": "2joao",
  "3jo": "3joao", jd: "judas", ap: "apocalipse",
};

const ID_TO_NOME = {
  genesis: "Gênesis", exodo: "Êxodo", levitico: "Levítico", numeros: "Números",
  deuteronomio: "Deuteronômio", josue: "Josué", juizes: "Juízes", rute: "Rute",
  "1samuel": "1 Samuel", "2samuel": "2 Samuel", "1reis": "1 Reis", "2reis": "2 Reis",
  "1cronicas": "1 Crônicas", "2cronicas": "2 Crônicas", esdras: "Esdras",
  neemias: "Neemias", ester: "Ester", job: "Jó", salmos: "Salmos",
  proverbios: "Provérbios", eclesiastes: "Eclesiastes", cantares: "Cânticos",
  isaias: "Isaías", jeremias: "Jeremias", lamentacoes: "Lamentações",
  ezequiel: "Ezequiel", daniel: "Daniel", oseias: "Oséias", joel: "Joel",
  amos: "Amós", obadias: "Obadias", jonas: "Jonas", miqueias: "Miquéias",
  naum: "Naum", habacuque: "Habacuque", sofonias: "Sofonias", ageu: "Ageu",
  zacarias: "Zacarias", malaquias: "Malaquias", mateus: "Mateus", marcos: "Marcos",
  lucas: "Lucas", joao: "João", atos: "Atos", romanos: "Romanos",
  "1corintios": "1 Coríntios", "2corintios": "2 Coríntios", galatas: "Gálatas",
  efesios: "Efésios", filipenses: "Filipenses", colossenses: "Colossenses",
  "1tessalonicenses": "1 Tessalonicenses", "2tessalonicenses": "2 Tessalonicenses",
  "1timoteo": "1 Timóteo", "2timoteo": "2 Timóteo", tito: "Tito", filemom: "Filemom",
  hebreus: "Hebreus", tiago: "Tiago", "1pedro": "1 Pedro", "2pedro": "2 Pedro",
  "1joao": "1 João", "2joao": "2 João", "3joao": "3 João", judas: "Judas",
  apocalipse: "Apocalipse",
};

let raw = fs.readFileSync(SRC);
if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) raw = raw.slice(3);
const books = JSON.parse(raw.toString("utf8"));

fs.mkdirSync(OUT_DIR, { recursive: true });

const index = [];
for (const book of books) {
  const id = ABBREV_TO_ID[book.abbrev];
  if (!id) {
    console.error("Abbrev desconhecida:", book.abbrev);
    process.exit(1);
  }
  const nome = ID_TO_NOME[id];
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify({ id, nome, capitulos: book.chapters }));
  index.push({ id, nome, capitulos: book.chapters.length });
}

if (INDEX) fs.writeFileSync(INDEX, JSON.stringify(index));
console.log(`OK ${index.length} livros em ${path.relative(ROOT, OUT_DIR)}`);
