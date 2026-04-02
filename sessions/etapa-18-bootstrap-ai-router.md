# Etapa 18 — `aiRouter`, `bootstrap` e script npm

**Data:** 2026-04-01

## Objetivo

Alinhar o snippet do utilizador: `runAgent` em `services/aiRouter`, `masterAgent` + `UserRequest` e fluxo principal + apoios em `bootstrap.ts`.

## O que foi feito

- **`src/services/aiRouter.ts`:** `runAgent` (mesma lógica do stub anterior); importa `buildUserContext` de `@/utils/formatOutput`.
- **Removido** `src/utils/runAgent.ts`; **`src/utils/index.ts`** reexporta `runAgent` desde `@/services/aiRouter` para não quebrar `import { runAgent } from "@/utils"`.
- **`src/bootstrap.ts`:** pedido de exemplo (sermão textual), `masterAgent`, `runAgent` no principal e em paralelo nos `apoio`, `console.log`.
- **`package.json`:** devDependency `tsx`, script `"bootstrap": "tsx src/bootstrap.ts"`.

## Comandos

```bash
npm install
npm run bootstrap
```

## Nota

`UserRequest` importa-se de `./domain` (equivalente ao `types/agent.types` do snippet). Caminhos em `bootstrap` são relativos a `src/`, como no teu exemplo.
