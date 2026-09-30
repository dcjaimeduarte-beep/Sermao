import type { UserRequest } from "@/domain";

/** A lente de dízimos, ofertas e primícias só entra se o campo específico estiver marcado. */
export function isTithesOfferingsRequest(request: UserRequest): boolean {
  return request.incluirMordomia === true;
}
