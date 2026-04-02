# Etapa 17 — Execução do agente (`runAgent`, stub)

**Data:** 2026-04-01

## Objetivo

Função assíncrona que monta o prompt completo (`promptBase` + contexto do pedido + instrução final) e devolve `GeneratedContent` — por ora com saída simulada.

## O que foi feito

- **`src/utils/runAgent.ts`:** `runAgent(agent, request)` importa tipos de `@/domain` e `buildUserContext` de `./formatOutput`.
- **`src/utils/formatOutput.ts`:** reexport de `buildUserContext` desde `@/context/buildUserContext` (equivalente ao caminho `../utils/formatOutput` do snippet).
- **`src/utils/index.ts`:** reexport de `formatOutput` e `runAgent`.
- **`sessions/CONTINUIDADE.md`** e regra Cursor atualizadas.

## Uso

```ts
import { masterAgent } from "@/agents";
import { runAgent } from "@/utils";

const { principal } = masterAgent(pedido);
const resultado = await runAgent(principal, pedido);
```

## Próximo passo técnico

Trocar `simulatedResponse` por `fetch` / SDK ao modelo, usando o mesmo `prompt` (ou separar system/user conforme a API).
