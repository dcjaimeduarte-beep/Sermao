# Etapa 13 — Agente revisor teológico (`theologyReviewAgent`)

**Data:** 2026-04-01

## Objetivo

Definir `BiblicalAgent` para o passe de revisão doutrinária/pastoral com `theologyPrompt`.

## O que foi feito

- **`src/agents/theologyReviewAgent.ts`:** `theologyReviewAgent` com skills indicadas e `promptBase: theologyPrompt`.
- **`src/agents/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { theologyReviewAgent } from "@/agents";

// Segunda chamada ao modelo: system = theologyReviewAgent.promptBase; user = rascunho a rever
```
