import type { UserRequest } from "@/domain";

/** Todas as passagens informadas, na ordem (eixo primeiro). */
export function passagensDoPedido(request: UserRequest): string[] {
  if (request.textosBase && request.textosBase.length > 0) {
    return request.textosBase.map((p) => p.trim()).filter(Boolean);
  }
  return [request.textoBase, request.textoBase2]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
}

export function rotuloPassagens(passagens: string[], fallback: string): string {
  return passagens.length > 0 ? passagens.join(" · ") : fallback;
}
