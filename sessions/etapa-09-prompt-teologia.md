# Etapa 09 — Prompt de revisão teológica (`theologyPrompt`)

**Data:** 2026-04-01

## Objetivo

Prompt para segundo passe (ou agente dedicado) que revise materiais quanto a doutrina, interpretação e clareza pastoral, sobre `basePrompt`.

## O que foi feito

- **`src/prompts/theologyPrompt.ts`:** exporta `theologyPrompt` com objetivos da revisão e formato (pontos fortes, ajustes, riscos, versão recomendada).
- **`src/prompts/index.ts`:** reexport.
- **`sessions/CONTINUIDADE.md`:** estado e histórico atualizados.

## Uso previsto

Fluxo em duas etapas: gerar conteúdo com `outlinePrompt` / `sermonPrompt` / `studyPrompt`; enviar o rascunho ao modelo com `theologyPrompt` + texto do utilizador como utilizador/mensagem a rever.
