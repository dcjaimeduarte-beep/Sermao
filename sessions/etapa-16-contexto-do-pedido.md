# Etapa 16 — Contexto do pedido (`buildUserContext`)

**Data:** 2026-04-01

## Objetivo

Serializar `UserRequest` num bloco de texto em português para anexar à mensagem do utilizador enviada ao modelo.

## O que foi feito

- **`src/context/buildUserContext.ts`:** `buildUserContext(request)` com os campos e defaults (`não informado`, `media` para profundidade) conforme o snippet fornecido.
- **`src/context/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { buildUserContext } from "@/context";
import { masterAgent } from "@/agents";

const rota = masterAgent(pedido);
const userMessage = `${buildUserContext(pedido).trim()}\n\n[Instruções adicionais do utilizador…]`;
// system: rota.principal.promptBase
```
