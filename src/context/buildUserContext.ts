import type { UserRequest } from "@/domain";
import { tithesOfferingsContext } from "@/prompts/tithesOfferingsContext";
import { isTithesOfferingsRequest } from "./isTithesOfferingsRequest";
import { cenaDoBriefing } from "./pastoralSceneHint";
import { passagensDoPedido } from "./passagensDoPedido";

const TIPO_SERMAO_DESC: Record<string, string> = {
  expositivo: "Expositivo — percorre o texto versículo a versículo ou perícope por perícope, deixando a estrutura do próprio texto determinar os pontos da mensagem",
  textual:    "Textual — parte de um texto específico e curto (1 a 3 versículos), extrai os pontos diretamente das palavras ou frases do versículo, com desenvolvimento aprofundado de cada parte",
  tematico:   "Temático — organiza a mensagem em torno de um tema central, buscando múltiplas passagens que iluminam o tema; o texto ancora o tema, mas não necessariamente determina a estrutura",
};

const PUBLICO_DESC: Record<string, string> = {
  misto:          "Público geral — congregação mista, adultos de diferentes idades e maturidade espiritual; use linguagem acessível mas não simplista",
  jovens:         "Jovens — linguagem dinâmica, conectada à cultura contemporânea, desafios e questões de identidade e propósito",
  criancas:       "Crianças — linguagem muito simples e concreta, histórias e imagens visuais, sem abstrações teológicas complexas, verdades simples e memoráveis",
  adolescentes:   "Adolescentes — linguagem direta e honesta, temas de identidade, pertencimento, fé e vida prática; evite tom condescendente",
  mulheres:       "Mulheres — contexto pastoral sensível, temas de fé no cotidiano, família, propósito e identidade em Cristo",
  homens:         "Homens — linguagem direta, desafio à liderança e responsabilidade, aplicações práticas e concretas",
  nao_convertidos:"Não convertidos — linguagem sem jargão religioso, apresente o evangelho com clareza; explique termos teológicos se usá-los; tom acolhedor e sem pressão",
};

function blocoContextoPastoral(request: UserRequest): string {
  const texto = request.contextoGeracao?.trim();
  if (!texto) {
    return `CONTEXTO PASTORAL: não informado
→ Sem briefing pastoral. Não invente situação de igreja, série nem objetivo que o pastor não escreveu.`;
  }

  const paraSermao = request.tipoConteudo === "sermao"
    ? "→ NO SERMÃO: teça este briefing dentro dos blocos já pedidos (introdução, contexto, textos que iluminam, tradução/original, exegese da cena, aplicação). Não crie seção à parte nem apêndice."
    : "→ Neste tipo, honre o mesmo briefing dentro do formato pedido, sem trocar o molde.";

  return `CONTEXTO PASTORAL (briefing de enriquecimento — obrigatório):
${texto}
→ Este texto é o pedido do pastor sobre a situação da igreja e o que o material precisa carregar. Não é nota de tom.
→ Responda a ele trazendo, no que o texto pedir:
1. Contexto histórico-cultural que ilumina essa situação (chão da cena, não ficha de autor/data).
2. Passagens bíblicas que falem a esse pedido. Com passagem informada, ela continua o eixo; os paralelos são escolhidos por causa desta situação. Sem passagem, tema + briefing escolhem 4 a 6 âncoras (AT e NT). Não invente referência.
3. Traduções: citação em ARA e, quando a palavra carregar o ponto pastoral, o original (escrita + transliteração + sentido) e o contraste com uma tradução mais literal.
4. Exegese: o que o texto dizia aos primeiros ouvintes, sem alegoria, ligado ao que esta situação precisa ouvir.
5. Aplicação: persona e passo concretos para a situação descrita (série, calendário, dor, objetivo).
→ Se o pastor pediu um acento (consolo, arrependimento, discipulado, evangelismo, mordomia, etc.), esse acento governa a ênfase e a escolha dos paralelos, sem torcer a passagem.
→ Os checkboxes prevalecem: CONTEXTO HISTÓRICO = NÃO omite ficha histórica; APLICAÇÃO = NÃO omite o bloco de aplicação. O briefing continua orientando passagens, traduções e exegese.
→ Sem histórias ilustrativas inventadas.
→ Se aparecer FONTES INTERNAS, esses verbetes de docs/ (dicionário, enciclopédia, dízimos) alimentam o histórico, as passagens, as traduções, a exegese e a aplicação. Não cite o arquivo. Não contradiga o verbete.
${cenaDoBriefing(request)}
${paraSermao}`;
}

const PROFUNDIDADE_DESC: Record<string, string> = {
  simples:  "Simples — linguagem acessível para qualquer crente, sem terminologia técnica, teologia aplicada diretamente sem análise acadêmica; ideal para novos convertidos ou público geral sem formação teológica",
  media:    "Média — equilíbrio entre profundidade teológica e acessibilidade; pode usar termos teológicos com breve explicação; adequado para congregação com alguma maturidade espiritual",
  profunda: "Profunda — análise exegética e teológica rigorosa; use terminologia técnica quando necessário; explore nuances do original, debata interpretações, aprofunde doutrina; adequado para pastores, líderes e crentes maduros",
};

export function buildUserContext(request: UserRequest): string {
  const tipoSermaoDesc = request.tipoSermao
    ? (TIPO_SERMAO_DESC[request.tipoSermao] ?? request.tipoSermao)
    : "não informado";

  const publicoDesc   = PUBLICO_DESC[request.publico]   ?? request.publico;
  const profDesc      = PROFUNDIDADE_DESC[request.profundidade ?? "media"] ?? request.profundidade;
  const passagens     = passagensDoPedido(request);
  const [passagemEixo, ...passagensMais] = passagens;

  const blocoPassagens = passagemEixo
    ? `PASSAGEM BÍBLICA PRINCIPAL (eixo): ${passagemEixo}
→ Há capítulo e versículos. No SERMÃO: percorra este texto como eixo da mensagem (versículo a versículo, agrupando só 2–3 vv. inseparáveis). Não monte I/II/III temáticos no lugar do texto.
${passagensMais.length
    ? `PASSAGENS COMPLEMENTARES (${passagensMais.length}):
${passagensMais.map((p, i) => `  ${i + 2}ª — ${p}`).join("\n")}
→ O sermão é UMA composição com TODOS estes livros — não sermões colados, nem as complementares como nota de rodapé.
→ A 1ª passagem é o eixo. Cada livro adicional dialoga com ela (contraste, cumprimento, paralelo, ampliação).
→ No cabeçalho, liste todas em Texto principal. O texto-chave vem em geral da 1ª.
→ Se a duração não couber percorrer cada perícope por completo: esgote o eixo; nas demais, só os versículos que realmente conversam com o tema.`
    : ""}`
    : `PASSAGEM BÍBLICA PRINCIPAL: não informada
→ Não há passagem. No SERMÃO: use o TEMA e o CONTEXTO PASTORAL; escolha 4 a 6 versículos principais da Escritura (AT e NT) e componha o manuscrito numerado em torno deles.`;

  return `
════════════════════════════════════════
INSTRUÇÕES DO PEDIDO — LEIA COM ATENÇÃO
════════════════════════════════════════

TIPO DE CONTEÚDO: ${request.tipoConteudo}

TIPO DE SERMÃO: ${tipoSermaoDesc}
→ Aplique esta abordagem rigorosamente na estrutura e no desenvolvimento da mensagem.

PÚBLICO-ALVO: ${publicoDesc}
→ Adapte vocabulário, tom e nível de detalhe a este público específico.

PROFUNDIDADE TEOLÓGICA: ${profDesc}
→ Calibre o nível de análise, a complexidade da linguagem e a quantidade de detalhe técnico conforme esta instrução.

DURAÇÃO ESTIMADA: ${request.duracaoMinutos} minutos
→ Dimensione o volume proporcionalmente: sermão curto = menos seções e blocos mais enxutos; 30–45 min = eixo versículo a versículo (ou 4–6 versículos principais se não houver passagem).

${blocoPassagens}
TEMA OU TÍTULO SUGERIDO: ${request.tema ?? "não informado"}

${blocoContextoPastoral(request)}

INCLUIR CONTEXTO HISTÓRICO E LITERÁRIO: ${request.incluirContextoHistorico ? "SIM — desenvolva o contexto histórico, cultural e literário onde for relevante" : "NÃO — omita seções de contexto histórico; foque em exposição e aplicação"}

INCLUIR APLICAÇÃO PRÁTICA: ${request.incluirAplicacao ? "SIM — aplicação concreta em cada versículo/movimento" : "NÃO — omita o bloco Aplicação; só exegese para pregação"}

INCLUIR APELO FINAL: ${request.incluirApeloFinal ? "SIM — inclua um apelo ao final: evangelístico, de renovação ou de consagração, conforme o texto" : "NÃO — encerre sem apelo formal"}

INCLUIR PERSPECTIVA DE MORDOMIA / DÍZIMOS E OFERTAS: ${isTithesOfferingsRequest(request) ? "SIM — o campo específico está marcado. Siga o bloco TEMA ATIVO abaixo no conteúdo principal (não apenas no especialista)." : "NÃO — o campo não está marcado. Não trate de dízimos, ofertas ou primícias, mesmo que o tema, a passagem ou o contexto pastoral mencionem o assunto."}

${request.textoBase
  ? "MODO SERMÃO COM PASSAGEM: exegese para pregação VERSÍCULO A VERSÍCULO. Sem ilustrações. Parágrafos de no máximo 4 frases."
  : "MODO SERMÃO SEM PASSAGEM: escolha 4 a 6 versículos principais do tema. Mesmo formato (Texto + Exegese + Aplicação). Sem ilustrações."}
════════════════════════════════════════
${isTithesOfferingsRequest(request) ? tithesOfferingsContext : ""}`;
}
