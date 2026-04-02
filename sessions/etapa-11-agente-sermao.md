# Etapa 11 — Agente de sermão (`sermonAgent`)

**Data:** 2026-04-01

## Objetivo

Definir `BiblicalAgent` para sermões completos, com `sermonPrompt` como `promptBase`.

## O que foi feito

- **`src/agents/sermonAgent.ts`:** `sermonAgent` com as skills indicadas e `promptBase: sermonPrompt`.
- **`src/agents/index.ts`:** reexport de `sermonAgent`.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { sermonAgent } from "@/agents";

// Quando UserRequest.tipoConteudo === "sermao", usar sermonAgent.promptBase e refletir tipoSermao na mensagem do utilizador
```
