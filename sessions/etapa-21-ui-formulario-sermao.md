# Etapa 21 — Formulário local para geração de sermão (web)

**Data:** 2026-04-01

## Objetivo

Interface no frontend (Vite/React) para indicar passagem bíblica, público, tipo de sermão, duração e contexto pastorais, alinhada a `UserRequest` e ao fluxo `masterAgent` + `runAgent`.

## O que foi feito

- **`UserRequest.contextoGeracao`** (opcional) em `biblicalTypes.ts`; **`buildUserContext`** inclui linha “Contexto para a geração”.
- **`src/data/bibleBooks.pt.ts`** — lista de livros em português para o `<select>`.
- **`src/components/SermonGeneratorForm.tsx`** — formulário com: livro, capítulo, versículos (texto livre, ex. `1-8`), tipo de sermão, público, duração, tema opcional, textarea de contexto, profundidade, checkboxes (contexto histórico / aplicação / apelo). Pré-visualização do `textoBase` (`Livro cap:versos`). Botão “Gerar sermão” chama `runAgent` (stub).
- **`App.tsx`** — renderiza só o formulário.
- **`index.css`** — estilos do formulário e da área de resultado.

## Como testar

`npm run dev:web` → preencher e gerar; resultado simulado aparece abaixo.

## Próximo passo

Ligar `runAgent` a API real; opcionalmente fluxo de revisão (agente de apoio) na mesma página.
