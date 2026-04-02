# Etapa 19 — Alinhamento ao `package.json` tipo “app-biblico”

**Data:** 2026-04-01

## Objetivo

Aproximar o projeto ao JSON enviado: `name` / `version` / `main`, scripts `dev`, `build`, `start`, e dependências de desenvolvimento com TypeScript + Node, **sem desmontar** a app Vite/React.

## O que foi feito

- **`package.json`:** `name`: `app-biblico`, `version`: `1.0.0`, `main`: `dist/index.js`, `private`: mantido `true`.
- **`src/index.ts`:** ponto de entrada Node que importa `./bootstrap` (executa o mesmo demo).
- **Scripts:**
  - `dev` → **`tsx src/index.ts`** — o teu snippet pedia `ts-node src/index.ts`; com `"type": "module"` e imports sem `.js` em cadeia, `ts-node` ESM falha sem refatoração larga. `tsx` cumpre o mesmo papel (correr TypeScript direto). Existe `dev:ts-node` com `ts-node --esm` para experimentação.
  - `dev:web` → Vite (interface).
  - `build` → **esbuild** em bundle para `dist/index.js` (com `--alias:@=./src`), em vez de `tsc` puro — `tsc` com `NodeNext` exigiria extensões `.js` em todos os imports relativos.
  - `start` → `node dist/index.js`.
  - `build:web` → typecheck + `vite build` (saída em **`dist-web/`** para não sobrescrever `dist/` do Node).
- **`vite.config.ts`:** `build.outDir`: `dist-web`.
- **`.gitignore`:** `dist-web`.
- **`.vscode/tasks.json`:** tarefa predefinida **dev (Vite)**; **dev (Node CLI)** para `npm run dev`.
- **`ts-node` / `esbuild`:** em `devDependencies` (TypeScript já estava).

## Comandos rápidos

| Comando | Efeito |
|---------|--------|
| `npm run dev` | Demo Node (`src/index.ts`) com tsx |
| `npm run dev:web` | Vite |
| `npm run build && npm start` | Bundle Node e executar |
| `npm run build:web` | Build da interface |
