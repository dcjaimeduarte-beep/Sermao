import type { UserRequest } from "@/domain";
import { passagensDoPedido } from "./passagensDoPedido";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Quando o briefing descreve uma cena, trava a perícope.
 * Evita trocar a história pedida pela mais famosa do mesmo personagem.
 */
export function cenaDoBriefing(request: UserRequest): string {
  const briefing = normalize(request.contextoGeracao ?? "");
  if (!briefing) return "";

  const temPassagem = passagensDoPedido(request).length > 0;
  const elias = briefing.includes("elias");
  const sustento = /sustent|improvav|corvo|querite|sarepta|viuva|farinha/.test(briefing);
  const carmelo = /carmelo|baal|fogo do ceu|duelo/.test(briefing);

  if (elias && sustento && !carmelo) {
    const eixo = temPassagem
      ? "Se a passagem informada não for 1 Reis 17, não a use como texto principal: o briefing manda na cena."
      : "Não há passagem informada: 1 Reis 17 é o texto principal.";
    return `
CENA TRAVADA PELO BRIEFING:
Elias sustentado pelo improvável é 1 Reis 17 — o ribeiro de Querite, os corvos e a viúva de Sarepta.
${eixo}
Percorra essa cena em blocos. Proibido fazer de 1 Reis 18 (Carmelo, Baal, fogo do céu, chuva depois do duelo) o texto principal.
“Improvável” aqui é provisão sem recurso, não “o poder que vence o impossível”.
Título, tema e introdução dizem sustento, com as palavras do pastor.`;
  }

  return `
CENA DO BRIEFING:
Pregue a situação escrita, não a história mais famosa do mesmo personagem.
Não troque a palavra do pastor por um sinônimo que muda o assunto.
Título, tema e a introdução repetem essa situação. Se o sermão pudesse ser pregado sem o briefing, está errado.
Sem passagem informada: a perícope é a que realiza o briefing.`;
}
