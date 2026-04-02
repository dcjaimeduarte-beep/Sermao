# Etapa 01 — Tipos de domínio e base do app

**Data:** 2026-04-01

## Objetivo

Incorporar os tipos TypeScript fornecidos para geração de conteúdo bíblico e preparar um projeto executável em **VS Code** e **Cursor** com registro de sessão ao fim da etapa.

## O que foi feito

- Criado app **Vite + React + TypeScript** na raiz do repositório `Sermao`.
- Tipos consolidados em `src/domain/biblicalTypes.ts` e reexportados em `src/domain/index.ts`:
  - `ContentType`, `SermonStyle`, `AudienceType`, `AgentSkill`
  - `UserRequest`, `BiblicalAgent`, `GeneratedContent`, `RoutedAgents`
- Alias de imports: `@/` → `src/` (ver `vite.config.ts` e `tsconfig.json`).
- **VS Code / Cursor (compartilhado):** `.vscode/settings.json`, `extensions.json`, `tasks.json` (`dev`, `typecheck`, `build`), `launch.json` (Chrome em `http://localhost:5173`).
- **Cursor:** regra de projeto em `.cursor/rules/sermao-conteudo-biblico.mdc` (`alwaysApply`).
- `App.tsx` importa `UserRequest` como verificação mínima de tipos até as próximas etapas.
- `.gitignore`, Prettier (`.prettierrc`), `sessions/README.md` e este arquivo.

## Como rodar

Na pasta do projeto: `npm install`, depois `npm run dev`. Tarefa padrão do VS Code/Cursor: **Terminal → Run Task → dev**.

## Próximos passos sugeridos

- Próximo bloco de código que você enviar (agentes, roteamento, prompts ou UI) será integrado em módulos dedicados sob `src/`, mantendo `src/domain/` para tipos e contratos.
