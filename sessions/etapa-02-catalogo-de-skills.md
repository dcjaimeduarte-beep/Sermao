# Etapa 02 — Catálogo de skills (`skillsCatalog`)

**Data:** 2026-04-01

## Objetivo

Incorporar o mapa `Record<AgentSkill, string>` com descrições em português para cada skill de agente.

## O que foi feito

- **`src/domain/agent.types.ts`:** tipo `AgentSkill` centralizado (antes estava só em `biblicalTypes.ts`).
- **`src/domain/biblicalTypes.ts`:** importa `AgentSkill` de `agent.types.ts` para `BiblicalAgent.skills`.
- **`src/domain/skillsCatalog.ts`:** `skillsCatalog` com as mesmas chaves e textos fornecidos.
- **`src/domain/index.ts`:** exporta `agent.types`, `biblicalTypes` e `skillsCatalog`.

## Nota de caminho

O snippet original usava `../types/agent.types`. Neste projeto tudo sob **`src/domain/`** e imports via `@/domain` (ou relativos `./agent.types`) para manter um único módulo de domínio.

## Uso

```ts
import { skillsCatalog, type AgentSkill } from "@/domain";

const texto = skillsCatalog["homiletica"];
```

## Próximos passos

- Definição de agentes bíblicos, roteamento ou prompts que referenciem `skillsCatalog` para UI ou system messages.
