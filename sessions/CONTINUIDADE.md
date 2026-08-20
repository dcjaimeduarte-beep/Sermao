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

**Última atualização:** 2026-08-20

**Onde estamos**

- App web **React + Vite + TypeScript** (`npm run dev:web` → http://localhost:5173). API: OpenAI `gpt-4o` com streaming. Em produção: `http://sermao.jdafotografia.com.br` (proxy PHP `/proxy/v1`).
- Pipeline multi-agente: principal (sermão / esboço / estudo) + apoio (Exegeta, Teólogo, Pregador/Esboçista, Mordomia quando o tema pede).

**Esboço**
- Solo do tópico (mundo original + sentido da ideia na época).
- Texto original (heb./gr.) + transliteração + ARA + literal no solo e em cada ponto.
- Aplicação pessoal sempre (persona + o que o texto pede + passo da semana). O checkbox de aplicação prática controla só as ações do tipo “faça X na terça”.

**Dízimos, ofertas, primícias**
- Não é concórdia de Malaquias 3. O exegeta abstrai de toda a Bíblia a *forma do ato*: dizimar / ofertar / primiciar (incluindo textos onde o ato está e a palavra “dízimo” não está).
- Liga sozinho se o tema/passagem falar disso (`isTithesOfferingsRequest`) ou se o checkbox de mordomia estiver marcado.

**UI**
- Fundação Exegética e Teológica é **aba** (não bloco no fim da página): ao lado do sermão/esboço/estudo; nos 3 tipos: Sermão | Esboço | Estudo | Fundação.

**Deploy**
- Pacote gerado em 2026-08-20: `sermao-deploy.zip` (138.1 KB).
- No servidor (`public_html/sermao-deploy`): substituir **só** `index.html` + pasta `assets/` (apague os JS/CSS antigos da pasta `assets/` para não acumular). Não reenviar `proxy/openai.php`.
- Não commitar `proxy/openai.php` nem o zip.

**Próximo passo sugerido**

- Histórico de gerações (localStorage) e exportar PDF ainda não feitos.

**Comandos úteis**

- `npm run dev:web` — Vite (interface web)  
- `npm run deploy:pack` — empacota `sermao-deploy.zip`  
- `npm run typecheck` — verificação TypeScript  

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
| 2026-08-19 | Esboço enriquecido | Solo do tópico + original (heb./gr.) com transliteração + aplicação pessoal por ponto |
| 2026-08-19 | Dízimos e ofertas | Forma canônica dos três atos (dizimar / ofertar / primiciar), não concórdia de Malaquias |
| 2026-08-19 | Aba Fundação | Fundação exegética/teológica como aba ao lado do conteúdo e dos 3 tipos |
| 2026-08-20 | Deploy pack | `npm run deploy:pack` gera zip no Linux e no Windows; proxy só entra se `proxy/openai.php` existir |

---

## Ficheiros relacionados

- `sessions/README.md` — papel da pasta `sessions/`
- `sessions/etapa-NN-*.md` — registo por etapa (opcional, mais detalhe)
