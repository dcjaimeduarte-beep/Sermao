import type { UserRequest } from "@/domain";

const KEYWORDS = [
  "dizim",
  "oferta",
  "ofertorio",
  "generosidad",
  "mordomia",
  "primicia",
  "primiciar",
  "sustento do ministerio",
  "sustento do ministério",
  "malaquias 3",
  "2 corintios 8",
  "2 coríntios 8",
  "2 corintios 9",
  "2 coríntios 9",
  "2co 8",
  "2co 9",
  "viuva pobre",
  "viúva pobre",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Tema, passagem ou checkbox de mordomia pedem a lente de dízimos, ofertas e generosidade. */
export function isTithesOfferingsRequest(request: UserRequest): boolean {
  if (request.incluirMordomia) return true;

  const blob = normalize(
    [request.tema, request.textoBase, request.textoBase2, request.contextoGeracao]
      .filter(Boolean)
      .join(" ")
  );

  if (!blob.trim()) return false;
  return KEYWORDS.some((key) => blob.includes(normalize(key)));
}
