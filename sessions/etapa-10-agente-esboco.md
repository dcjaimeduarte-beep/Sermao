# Etapa 10 — Agente de esboço (`outlineAgent`)

**Data:** 2026-04-01

## Objetivo

Definir o primeiro `BiblicalAgent` ligado a `outlinePrompt` para geração de esboços.

## O que foi feito

- **`src/agents/outlineAgent.ts`:** `outlineAgent` com id, metadados, `skills` alinhadas ao catálogo e `promptBase: outlinePrompt`.
- **`src/agents/index.ts`:** reexport.
- Imports via `@/domain` e `@/prompts/outlinePrompt` (não `../types/agent.types`, coerente com o repo).

## Uso

```ts
import { outlineAgent } from "@/agents";

// Quando UserRequest.tipoConteudo === "esboco", usar outlineAgent.promptBase (+ detalhes do pedido na mensagem)
```
