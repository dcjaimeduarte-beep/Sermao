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

**Última atualização:** 2026-08-26

**Onde estamos**

- App web **React + Vite + TypeScript** (`npm run dev:web` → http://localhost:5173). API: OpenAI `gpt-4o` com streaming. Em produção: `http://sermao.jdafotografia.com.br` (proxy PHP `/proxy/v1`).
- Pipeline multi-agente: principal (sermão / esboço / estudo) + apoio (Exegeta, Teólogo, Pregador/Esboçista, Mordomia quando o tema pede).

**Esboço**
- **# 1. INTRODUÇÃO** obrigatória nos três tipos (expositivo, textual, temático): o **livro** (cena, lugar no cânon, o que vem antes/depois) + a **palavra ou o tema em menção** (sentido então + ponte ao ouvinte). Percurso a partir do nº 2.
- **Bloco-tipo** em cada movimento: título, citação, cena, 3 setas, contexto + 2–3 textos, aplicação pessoal, palavra profética.
- Temático: introdução mapeia o tema no cânon. Textual: peso na palavra-chave. Expositivo: livro + perícope.

**Estudo**
- **# 1. INTRODUÇÃO**: o livro + a palavra/tema em menção + pergunta de abertura. Percurso didático a partir do nº 2.
- Mesmo **bloco-tipo**, com nota ao líder, perguntas e dinâmica. Oração em 4 movimentos.

**Sermão**
- **# 1. INTRODUÇÃO** (livro + palavra/tema). Mesmo **bloco-tipo** no percurso (sem setas). Fecho: contrastes + declaração + frase final. Vários livros: 1º = eixo.

**Sermão**
- Sem ilustração. Com passagem: versículo a versículo. Sem passagem: 4 a 6 versículos principais.

**UI**
- Fundação Exegética e Teológica é **aba**.
- **Guardados** neste navegador (localStorage).
- **Bíblia do Pb Jaime:** RA + NVI offline; clique na referência; selecione palavra para o significado.

**Deploy**
- Pasta pronta: **`sermao-deploy/`** — subir `index.html` + `assets/` + pasta **`bible/`**. Não reenviar `proxy/openai.php`.

**Dízimos, ofertas, primícias**
- Não é concórdia de Malaquias 3. O exegeta abstrai de toda a Bíblia a *forma do ato*: dizimar / ofertar / primiciar (incluindo textos onde o ato está e a palavra “dízimo” não está).
- Liga sozinho se o tema/passagem falar disso (`isTithesOfferingsRequest`) ou se o checkbox de mordomia estiver marcado.

**Imprimir / PDF**
- Botão no resultado (sermão, esboço, estudo ou os 3 tipos). Abre o diálogo do navegador — escolha “Salvar como PDF”.

**Próximo passo sugerido**

- Subir `index.html` + `assets/` + pasta `bible/` + favicons. Apague JS/CSS antigos em `assets/`. Não reenviar `proxy/openai.php`.

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
| 2026-08-20 | Compilado | Bíblia RA+NVI, Guardados, busca de significado e pasta de deploy completa |
| 2026-08-21 | Imprimir / PDF | Botão no resultado abre o diálogo do navegador (salvar como PDF) |
| 2026-08-26 | Sermão manuscrito numerado | Tópicos + contexto + palavra profética; cabeçalho com texto-chave |
| 2026-08-26 | Vários livros | Lista de passagens (adicionar/remover); 1º livro é o eixo |
| 2026-08-26 | Introdução do livro e da palavra | # 1. INTRODUÇÃO em esboço (os 3 tipos), sermão e estudo |

---

## Ficheiros relacionados

- `sessions/README.md` — papel da pasta `sessions/`
- `sessions/etapa-NN-*.md` — registo por etapa (opcional, mais detalhe)
