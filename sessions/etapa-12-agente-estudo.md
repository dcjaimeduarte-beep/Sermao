# Etapa 12 — Agente de estudo (`studyAgent`)

**Data:** 2026-04-01

## Objetivo

Definir `BiblicalAgent` para estudos bíblicos (EBD, célula, etc.) com `studyPrompt`.

## O que foi feito

- **`src/agents/studyAgent.ts`:** `studyAgent` com skills indicadas e `promptBase: studyPrompt`.
- **`src/agents/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { studyAgent } from "@/agents";

// Quando UserRequest.tipoConteudo === "estudo"
```
