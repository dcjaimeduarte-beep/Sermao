# Etapa 07 — Prompt de sermão (`sermonPrompt`)

**Data:** 2026-04-01

## Objetivo

Prompt especializado em sermões evangélicos (expositivo/textual/temático), compondo sobre `basePrompt`.

## O que foi feito

- **`src/prompts/sermonPrompt.ts`:** exporta `sermonPrompt` com formato obrigatório (título, texto base, contexto, desenvolvimento, aplicação, conclusão, apelo condicional) e lista do que evitar.
- **`src/prompts/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso previsto

Quando `UserRequest.tipoConteudo === "sermao"`, combinar com `tipoSermao` na instrução ao modelo; system ou instrução principal pode usar `sermonPrompt`.
