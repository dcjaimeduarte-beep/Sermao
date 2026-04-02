# Etapa 15 — Roteamento principal (`masterAgent`)

**Data:** 2026-04-01

## Objetivo

Dado um `UserRequest`, escolher o agente principal conforme `tipoConteudo` e devolver `RoutedAgents` com agente de apoio (revisor teológico).

## O que foi feito

- **`src/agents/masterAgent.ts`:** função `masterAgent(request)` — `esboco` → `outlineAgent`, `sermao` → `sermonAgent`, `estudo` → `studyAgent`, `default` → `sermonAgent`; `apoio: [theologyReviewAgent]`.
- Tipos importados de `@/domain` (`BiblicalAgent`, `RoutedAgents`, `UserRequest`).
- **`src/agents/index.ts`:** reexport de `masterAgent`.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { masterAgent } from "@/agents";

const rota = masterAgent(pedido);
// rota.principal.promptBase + corpo do pedido → primeira chamada LLM
// rota.apoio[0] → segunda chamada se o utilizador quiser revisão teológica
```

## Nota

Hoje `apoio` inclui sempre o revisor; pode evoluir para condicional (ex.: flag no pedido ou pós-geração).
