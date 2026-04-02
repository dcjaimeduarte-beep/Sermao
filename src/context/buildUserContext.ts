import type { UserRequest } from "@/domain";

export function buildUserContext(request: UserRequest): string {
  return `
DADOS DO PEDIDO:
- Tipo de conteúdo: ${request.tipoConteudo}
- Tipo de sermão: ${request.tipoSermao ?? "não informado"}
- Público: ${request.publico}
- Duração: ${request.duracaoMinutos} minutos
- Tema: ${request.tema ?? "não informado"}
- Texto base: ${request.textoBase ?? "não informado"}
- Contexto para a geração: ${request.contextoGeracao?.trim() ? request.contextoGeracao.trim() : "não informado"}
- Profundidade: ${request.profundidade ?? "media"}
- Incluir contexto histórico: ${request.incluirContextoHistorico ? "sim" : "não"}
- Incluir aplicação prática: ${request.incluirAplicacao ? "sim" : "não"}
- Incluir apelo final: ${request.incluirApeloFinal ? "sim" : "não"}
`;
}
