# Etapa 14 — Registo de agentes (`agentRegistry`)

**Data:** 2026-04-01

## Objetivo

Centralizar os quatro `BiblicalAgent` num único array tipado para listagem, roteamento ou UI.

## O que foi feito

- **`src/agents/agentRegistry.ts`:** `agentRegistry: BiblicalAgent[]` com `outlineAgent`, `sermonAgent`, `studyAgent`, `theologyReviewAgent`. Tipo `BiblicalAgent` via `@/domain`; imports relativos `./outlineAgent`, etc.
- **`src/agents/index.ts`:** reexport de `agentRegistry` (export listado primeiro para descoberta rápida).
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso

```ts
import { agentRegistry } from "@/agents";

const byId = (id: string) => agentRegistry.find((a) => a.id === id);
```
