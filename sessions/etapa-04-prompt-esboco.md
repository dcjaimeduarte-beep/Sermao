# Etapa 04 — Prompt de esboço (`outlinePrompt`)

**Data:** 2026-04-01

## Objetivo

Definir o prompt especializado em esboços de pregação, reutilizando `basePrompt` por composição.

## O que foi feito

- **`src/prompts/outlinePrompt.ts`:** exporta `outlinePrompt` — template string que interpola `basePrompt` e acrescenta papel, formato obrigatório (título, texto base, tópicos, conclusão, aplicação) e diretrizes de subtópicos, aplicação e público.
- **`src/prompts/index.ts`:** reexport de `outlinePrompt`.

## Uso

```ts
import { outlinePrompt } from "@/prompts";

// Gerar esboço quando UserRequest.tipoConteudo === "esboco"
```

## Próximos passos

- Prompts paralelos para `sermao` e `estudo`, ou roteamento que escolha `outlinePrompt` conforme `tipoConteudo`.
