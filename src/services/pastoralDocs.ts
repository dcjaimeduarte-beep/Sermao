import type { UserRequest } from "@/domain";
import dicionario from "../../docs/dicionario-biblico.md?raw";
import dizimos from "../../docs/dizimos-ofertas-referencia.md?raw";
import enciclopedia from "../../docs/enciclopedia-biblica.md?raw";
import { passagensDoPedido } from "@/context/passagensDoPedido";
import { selectDocsEntries } from "@/context/selectDocsEntries";
import { isTithesOfferingsRequest } from "@/context/isTithesOfferingsRequest";

const BASE_SOURCES = [
  { source: "docs/dicionario-biblico.md", markdown: dicionario },
  { source: "docs/enciclopedia-biblica.md", markdown: enciclopedia },
];

const DIZIMOS_SOURCE = {
  source: "docs/dizimos-ofertas-referencia.md",
  markdown: dizimos,
};

/** Quando o contexto pastoral está preenchido, anexa verbetes de docs/ que casam com o pedido. */
export function selectPastoralDocs(request: UserRequest): string {
  const briefing = request.contextoGeracao?.trim();
  if (!briefing) return "";

  const sources = isTithesOfferingsRequest(request)
    ? [...BASE_SOURCES, DIZIMOS_SOURCE]
    : BASE_SOURCES;

  const query = [briefing, request.tema, ...passagensDoPedido(request)].filter(Boolean).join("\n");
  let block = selectDocsEntries(sources, query);

  if (isTithesOfferingsRequest(request) && block.includes("dizimos-ofertas-referencia")) {
    block += "\n\n→ Dízimos, ofertas e primícias: o campo específico está marcado. O bloco TEMA ATIVO manda no método. Os verbetes acima trazem as passagens e o contexto.";
  }

  return block;
}
