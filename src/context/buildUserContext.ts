import type { UserRequest } from "@/domain";

const TIPO_SERMAO_DESC: Record<string, string> = {
  expositivo: "Expositivo — percorre o texto versículo a versículo ou perícope por perícope, deixando a estrutura do próprio texto determinar os pontos da mensagem",
  textual:    "Textual — parte de um texto específico e curto (1 a 3 versículos), extrai os pontos diretamente das palavras ou frases do versículo, com desenvolvimento aprofundado de cada parte",
  tematico:   "Temático — organiza a mensagem em torno de um tema central, buscando múltiplas passagens que iluminam o tema; o texto ancora o tema, mas não necessariamente determina a estrutura",
};

const PUBLICO_DESC: Record<string, string> = {
  misto:          "Público geral — congregação mista, adultos de diferentes idades e maturidade espiritual; use linguagem acessível mas não simplista",
  jovens:         "Jovens — linguagem dinâmica, conectada à cultura contemporânea, ilustrações do cotidiano jovem, desafios e questões de identidade e propósito",
  criancas:       "Crianças — linguagem muito simples e concreta, histórias e imagens visuais, sem abstrações teológicas complexas, verdades simples e memoráveis",
  adolescentes:   "Adolescentes — linguagem direta e honesta, temas de identidade, pertencimento, fé e vida prática; evite tom condescendente",
  mulheres:       "Mulheres — contexto pastoral sensível, temas de fé no cotidiano, família, propósito e identidade em Cristo",
  homens:         "Homens — linguagem direta, desafio à liderança e responsabilidade, aplicações práticas e concretas",
  nao_convertidos:"Não convertidos — linguagem sem jargão religioso, apresente o evangelho com clareza; explique termos teológicos se usá-los; tom acolhedor e sem pressão",
};

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

  return `
════════════════════════════════════════
INSTRUÇÕES DO PEDIDO — LEIA COM ATENÇÃO
════════════════════════════════════════

TIPO DE CONTEÚDO: ${request.tipoConteudo}

TIPO DE SERMÃO: ${tipoSermaoDesc}
→ Aplique esta abordagem rigorosamente na estrutura e no desenvolvimento da mensagem.

PÚBLICO-ALVO: ${publicoDesc}
→ Adapte vocabulário, ilustrações, tom e nível de detalhe a este público específico.

PROFUNDIDADE TEOLÓGICA: ${profDesc}
→ Calibre o nível de análise, a complexidade da linguagem e a quantidade de detalhe técnico conforme esta instrução.

DURAÇÃO ESTIMADA: ${request.duracaoMinutos} minutos
→ Dimensione o volume de conteúdo proporcionalmente. Um sermão de 20 min tem menos pontos e desenvolvimento mais enxuto que um de 60 min.

PASSAGEM BÍBLICA: ${request.textoBase ?? "não informada — o agente deve selecionar passagens relevantes com base no tema"}

TEMA OU TÍTULO SUGERIDO: ${request.tema ?? "não informado"}

CONTEXTO PASTORAL: ${request.contextoGeracao?.trim() ? request.contextoGeracao.trim() : "não informado"}
→ Se informado, leve em conta a situação da igreja, o tom desejado e os objetivos pastorais ao desenvolver o conteúdo.

INCLUIR CONTEXTO HISTÓRICO E LITERÁRIO: ${request.incluirContextoHistorico ? "SIM — desenvolva o contexto histórico, cultural e literário onde for relevante" : "NÃO — omita seções de contexto histórico; foque em exposição e aplicação"}

INCLUIR APLICAÇÃO PRÁTICA: ${request.incluirAplicacao ? "SIM — inclua aplicações concretas, com prazo e contexto real, em cada ponto" : "NÃO — omita seções de aplicação; foque na exposição e na explicação teológica"}

INCLUIR APELO FINAL: ${request.incluirApeloFinal ? "SIM — inclua um apelo ao final: evangelístico, de renovação ou de consagração, conforme o texto" : "NÃO — encerre sem apelo formal"}
════════════════════════════════════════
`;
}
