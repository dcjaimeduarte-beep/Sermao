# Etapa 08 — Prompt de estudo (`studyPrompt`)

**Data:** 2026-04-01

## Objetivo

Prompt para estudos bíblicos (igreja, célula, discipulado, EBD), compondo sobre `basePrompt`.

## O que foi feito

- **`src/prompts/studyPrompt.ts`:** exporta `studyPrompt` com formato obrigatório (tema, texto base, contexto, tópicos, perguntas, aplicações, conclusão).
- **`src/prompts/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso previsto

Quando `UserRequest.tipoConteudo === "estudo"`, usar `studyPrompt` como base do system (ou instrução principal) ao modelo.
