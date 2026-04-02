# Continuidade do projeto Sermão

Este ficheiro é o **ponto único de retoma**: quem trabalhar no repositório (humano ou assistente) deve **ler primeiro a secção [Estado atual](#estado-atual)** abaixo para saber onde o trabalho parou e o que vem a seguir.

## Como usar

| Quem | O quê |
|------|--------|
| **Assistente (nova conversa)** | Ler **Estado atual** neste ficheiro antes de propor código. Só pedir esclarecimentos se algo estiver em conflito ou desatualizado. |
| **Humano** | Abrir este ficheiro quando voltar ao projeto; opcionalmente pedir: “lê `sessions/CONTINUIDADE.md` e continua”. |
| **Fim de cada bloco de trabalho** | Atualizar a secção **Estado atual** (e, se fizer sentido, acrescentar uma linha ao **Histórico**). Manter detalhes longos em `etapa-NN-*.md` e referenciar aqui. |

---

## Estado atual

**Última atualização:** 2026-04-01

**Onde estamos**

- Pacote npm **`app-biblico`** (pasta do repo pode continuar a chamar-se Sermao). **Vite + React + TypeScript**, alias `@/` → `src/`.
- **Entrada Node:** `src/index.ts` importa `./bootstrap` (mesmo fluxo que o demo). **`npm run dev`** corre essa entrada com **tsx** (equivalente prático a transpilar `src/index.ts` sem build). **`npm run dev:ts-node`** existe para quem quiser `ts-node --esm`, mas com ESM nativo costuma falhar sem extensões `.js` em todo o grafo de imports.
- **Build produção Node:** `npm run build` usa **`tsconfig.cjs.json`** (`target` ES2020, **`module`: commonjs**, `rootDir`/`outDir` como no teu snippet) + **`tsc-alias`** para resolver `@/` → caminhos relativos + **`scripts/ensure-dist-package.cjs`** que grava `dist/package.json` com `{"type":"commonjs"}` (o `package.json` raiz tem `"type":"module"`; sem isto o Node trataria `dist/*.js` como ESM). **`npm start`** = `node dist/index.js`.
- **Frontend:** `npm run dev:web` (Vite); artefactos em **`dist-web/`** (para não colidir com `dist/` do Node). **`src/components/SermonGeneratorForm.tsx`** — formulário local: livro (lista PT), capítulo, versículos, tipo de sermão, público, duração, tema opcional, **contexto para a geração**, profundidade e checkboxes; monta `UserRequest` (`textoBase` = `Livro cap:versos`) e chama `runAgent` (stub). **`UserRequest.contextoGeracao`** + linha em `buildUserContext`.
- **Domínio:** tipos em `src/domain/` — `agent.types.ts` (`AgentSkill`), `biblicalTypes.ts` (`UserRequest`, `BiblicalAgent`, etc.), `skillsCatalog.ts`.
- **Agentes:** `src/agents/` — agentes individuais, `agentRegistry`, `masterAgent(request)` → `RoutedAgents` (principal por `tipoConteudo`, apoio com revisor); `index.ts` reexporta.
- **Prompts:** `basePrompt`, `outlinePrompt` (esboço), `sermonPrompt` (sermão), `studyPrompt` (estudo), `theologyPrompt` (revisão teológica) em `src/prompts/`; `index.ts` reexporta.
- **Contexto para o modelo:** `src/context/buildUserContext.ts` — `buildUserContext(UserRequest)` → texto “DADOS DO PEDIDO”; `index.ts` reexporta.
- **Execução (stub):** `src/services/aiRouter.ts` — `runAgent(agent, request)` → `Promise<GeneratedContent>`. `src/utils/formatOutput.ts` reexporta `buildUserContext`; `@/utils` também reexporta `runAgent` (desde `aiRouter`).
- **Demonstração CLI:** `src/bootstrap.ts` (também acionado por `src/index.ts`); `npm run bootstrap` ou `npm run dev` / `npm start` após build.
- **Convenção:** código na stack que couber; respostas ao utilizador, UI e `sessions/` em **português (pt-BR)** — ver `etapa-05-convencao-idioma.md`.
- **Histórico detalhado:** `etapa-01` … `etapa-21` nesta pasta; retoma sempre por **`CONTINUIDADE.md` → Estado atual**.

**Próximo passo sugerido (não feito ainda)**

- Substituir o stub em `runAgent` pela API real (proxy ou env); opcional: segundo passo na UI com agente de apoio (revisor).

**Comandos úteis**

- `npm run dev` — executa `src/index.ts` com tsx (CLI / demo)  
- `npm run dev:web` — Vite (interface web)  
- `npm run build` — `tsc` (CommonJS, `tsconfig.cjs.json`) → `dist/`  
- `npm start` — `node dist/index.js`  
- `npm run build:web` — typecheck + build Vite → `dist-web/`  
- `npm run typecheck` — verificação TypeScript  
- `npm run bootstrap` — igual ao fluxo do bootstrap direto (tsx em `src/bootstrap.ts`)  

---

## Histórico resumido

| Data | Marco | Detalhe |
|------|--------|---------|
| 2026-04-01 | Etapa 01 | Tipos + base do app |
| 2026-04-01 | Etapa 02 | `skillsCatalog` + `agent.types.ts` |
| 2026-04-01 | Etapa 03 | `basePrompt` |
| 2026-04-01 | Etapa 04 | `outlinePrompt` (esboço) |
| 2026-04-01 | Etapa 05 | Regra: código flexível, comunicação em PT |
| 2026-04-01 | Etapa 06 | Criado `CONTINUIDADE.md` + regra de leitura/atualização |
| 2026-04-01 | Etapa 07 | `sermonPrompt` (sermão completo) |
| 2026-04-01 | Etapa 08 | `studyPrompt` (estudo bíblico / EBD) |
| 2026-04-01 | Etapa 09 | `theologyPrompt` (revisor teológico) |
| 2026-04-01 | Etapa 10 | `outlineAgent` (esboçista bíblico) |
| 2026-04-01 | Etapa 11 | `sermonAgent` (pregador bíblico) |
| 2026-04-01 | Etapa 12 | `studyAgent` (professor bíblico) |
| 2026-04-01 | Etapa 13 | `theologyReviewAgent` (revisor teológico) |
| 2026-04-01 | Etapa 14 | `agentRegistry` (lista única de agentes) |
| 2026-04-01 | Etapa 15 | `masterAgent` (roteamento `UserRequest` → `RoutedAgents`) |
| 2026-04-01 | Etapa 16 | `buildUserContext` (texto do pedido para o LLM) |
| 2026-04-01 | Etapa 17 | `runAgent` (stub) + `utils/formatOutput` |
| 2026-04-01 | Etapa 18 | `services/aiRouter`, `bootstrap.ts`, script `npm run bootstrap` |
| 2026-04-01 | Etapa 19 | Pacote `app-biblico`, `main`, `src/index.ts`, Vite → `dist-web/` (build Node evolui na 20) |
| 2026-04-01 | Etapa 20 | `tsconfig.cjs.json` (CommonJS) + `tsc-alias` + `dist/package.json` |
| 2026-04-01 | Etapa 21 | Formulário web sermão + `contextoGeracao` + `bibleBooks.pt` |

---

## Ficheiros relacionados

- `sessions/README.md` — papel da pasta `sessions/`
- `sessions/etapa-NN-*.md` — registo por etapa (opcional, mais detalhe)
