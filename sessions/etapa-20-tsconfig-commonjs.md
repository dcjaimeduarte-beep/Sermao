# Etapa 20 — `tsconfig` CommonJS para o build Node

**Data:** 2026-04-01

## Objetivo

Aplicar o bloco `compilerOptions` enviado (`target` ES2020, `module` commonjs, `rootDir`/`outDir`, `strict`, `esModuleInterop`, `skipLibCheck`) na compilação que alimenta `npm run build` / `npm start`.

## O que foi feito

- **`tsconfig.cjs.json`:** contém essas opções + `moduleResolution: node`, `baseUrl`/`paths` para `@/*` → `src/*`, `include` em `src/**/*.ts`, exclusão de `*.tsx` e `vite-env.d.ts`.
- **`npm run build`:** `tsc -p tsconfig.cjs.json` → **`tsc-alias -p tsconfig.cjs.json`** (reescrita de imports `@/…`) → **`node scripts/ensure-dist-package.cjs`** (cria `dist/package.json` com `"type":"commonjs"`).
- **Motivo do `dist/package.json`:** na raiz o projeto mantém `"type":"module"` (Vite / tooling). Sem um `package.json` dentro de `dist/`, o Node poderia interpretar os `.js` emitidos como ESM e falhar com `require`.
- **Removido** esbuild do fluxo de `build`; adicionado **`tsc-alias`**.

O **`tsconfig.json` principal** continua a servir **Vite** e **`tsc --noEmit`** (typecheck da app React); não foi substituído pelo CJS.

## Comandos

```bash
npm run build
npm start
```
