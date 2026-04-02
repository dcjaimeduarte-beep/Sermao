# Etapa 03 — Prompt base (`basePrompt`)

**Data:** 2026-04-01

## Objetivo

Centralizar o texto de sistema/comportamento compartilhado por agentes de geração de conteúdo bíblico.

## O que foi feito

- **`src/prompts/basePrompt.ts`:** constante `basePrompt` (template string) com regras obrigatórias e tom pastoral evangélico.
- **`src/prompts/index.ts`:** reexport do módulo de prompts.

Prompts ficam fora de `src/domain/` para não misturar contratos de tipos com texto enviável a LLM.

## Uso

```ts
import { basePrompt } from "@/prompts";

const system = basePrompt.trim();
```

Compor com `BiblicalAgent.promptBase` ou instruções específicas conforme o roteamento na próxima etapa.

## Próximos passos

- Agente(s) com `promptBase` derivado ou concatenado a `basePrompt`; UI ou API que monte a mensagem final.
