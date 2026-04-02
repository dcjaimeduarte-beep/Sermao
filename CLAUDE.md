# Sermão — Gerador de Conteúdo Bíblico

## O Projeto

Aplicação web em React + TypeScript + Vite para gerar sermões, esboços e estudos bíblicos evangelicamente sólidos. Usa a API Claude (Anthropic) com arquitetura multi-agente especializada.

**Stack:** React 19, TypeScript 5.7, Vite 6, openai (gpt-4o)  
**Idioma:** Português BR  
**Público:** Pastores e líderes de igrejas evangélicas

---

## Arquitetura de Agentes

O projeto usa agentes especializados em `src/agents/`:

| Agente | Arquivo | Especialidade |
|---|---|---|
| Pregador Bíblico | `sermonAgent.ts` | Sermões completos |
| Esboçista Bíblico | `outlineAgent.ts` | Esboços pregáveis |
| Professor Bíblico | `studyAgent.ts` | Estudos bíblicos |
| Revisor Teológico | `theologyReviewAgent.ts` | Revisão doutrinária |

O `masterAgent.ts` roteia o pedido para o agente correto.  
O `aiRouter.ts` chama a API Claude com streaming.

---

## Configuração

1. Crie `.env` na raiz com:
   ```
   VITE_OPENAI_API_KEY=sk-proj-...
   ```
2. `npm install`
3. `npm run dev:web` → http://localhost:5173

---

## Comandos Slash Disponíveis

- `/iniciar` — Inicia o servidor de desenvolvimento
- `/fechar` — Para o servidor
- `/git-s` — Salva e commita o progresso

---

## Regras para o Claude Code

1. **Nunca commitar o `.env`** — contém a API key
2. **Sempre manter os agentes e skills existentes** — são o core do produto
3. **Linguagem da UI sempre em Português BR**
4. **Antes de alterar prompts**, entender o impacto na qualidade teológica
5. **Ao terminar qualquer sessão de trabalho**, salvar com `/git-s` e atualizar o log de sessões abaixo

---

## Log de Sessões de Desenvolvimento

> Sempre adicione uma entrada ao fazer mudanças significativas. Use `/git` para salvar.

### 2026-04-01 — Sessão 1: Setup e UI inicial
**O que foi feito:**
- Estrutura inicial do projeto (React + Vite + TypeScript)
- Arquitetura multi-agente com 4 agentes especializados
- Formulário básico de geração de sermões
- Resposta simulada no `aiRouter.ts`

**Estado:** Formulário funcional, sem API real conectada

---

### 2026-04-01 — Sessão 2: Integração real com Claude API + redesign UI
**O que foi feito:**
- Instalado `@anthropic-ai/sdk`
- `aiRouter.ts` agora chama Claude `claude-opus-4-6` com streaming em tempo real
- Redesign completo da UI: seletor de tipo de conteúdo, profundidade, slider de duração, checkboxes customizados
- Output renderiza markdown estruturado (títulos, listas, negrito) em vez de `<pre>`
- Cursor animado durante streaming
- Botões Copiar e Nova Geração
- Prompts muito mais ricos: contexto histórico, literário, linguagem contemporânea
- Comandos slash: `/iniciar`, `/fechar`, `/git`
- CLAUDE.md com log de sessões
- `.gitignore` configurado

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Considerar revisão teológica automática (usar o `theologyReviewAgent` como segundo passo)
- Melhorar os prompts de esboço e estudo bíblico com mesma riqueza do sermão

---

### 2026-04-01 — Sessão 3: Migração para OpenAI
**O que foi feito:**
- Instalado SDK `openai`
- `aiRouter.ts` migrado de `@anthropic-ai/sdk` para `openai` com modelo `gpt-4o`
- Streaming mantido (mesma experiência de texto aparecendo em tempo real)
- Variável de ambiente trocada de `VITE_ANTHROPIC_API_KEY` para `VITE_OPENAI_API_KEY`
- `.env.example` atualizado
- Comandos slash renomeados: `/iniciar` → `/iniciar-dev`, `/fechar` → `/fechar-dev`

**Motivo:** Conta Anthropic sem créditos; usuário possui chave OpenAI ativa.

**Estado atual:** Aplicação funcional com OpenAI `gpt-4o` + streaming, rodando localmente.

**Próximos passos sugeridos:**
- Testar geração de sermão, esboço e estudo bíblico com a nova API
- Validar qualidade do output com o `gpt-4o`
- Publicar (deploy) após validação local

---

### 2026-04-02 — Sessão 4: Pipeline Multi-Agente + Exegese Completa + Dicionário/Enciclopédia
**O que foi feito:**

**Pipeline multi-agente real:**
- `masterAgent.ts` atualizado: agora define agentes de apoio com `SupportAgentConfig` (focusPrompt, label, ícone) por tipo de conteúdo
- `aiRouter.ts`: nova função `runSupportAgents()` executa agentes de apoio em paralelo (sem streaming)
- Sermão → apoio: Exegeta + Teólogo + Esboçista
- Esboço → apoio: Exegeta + Teólogo + Pregador
- Estudo → apoio: Teólogo + Pregador + Esboçista

**Novos prompts de suporte especializado** (`src/prompts/supportPrompts.ts`):
- `exegesisResearchPrompt` — palavras no original, contexto histórico, estrutura literária, versículos paralelos
- `theologicalInsightsPrompt` — temas teológicos, conexão redentora, fundamentos doutrinários
- `homileticsInsightPrompt` — proposição central, estrutura homilética, ilustrações, apelo
- `outlineInsightPrompt` — 3 esboços alternativos (expositivo, temático, aplicacional)

**Prompts principais enriquecidos:**
- `sermonPrompt.ts`, `studyPrompt.ts`, `outlinePrompt.ts` completamente reescritos com:
  - Texto em 3 traduções (ARA, NVI, NTLH) com comparação
  - Análise de palavras-chave no original (hebraico/grego)
  - Contexto histórico-cultural detalhado
  - Textos paralelos com explicação de conexão
  - Estrutura literária da perícope
  - Referência à metodologia Matthew Henry

**Novos tipos de domínio:**
- `SupportAgentConfig` adicionado a `biblicalTypes.ts`

**UI atualizada** (`SermonGeneratorForm.tsx`):
- Painel "Pesquisa Especializada" com abas por especialista, após o conteúdo principal
- Loading state para agentes de apoio em paralelo
- Ícone de Bíblia SVG inline no header e no painel de especialistas
- Subtítulo do header atualizado

**Referência bíblica criada em `docs/`:**
- `dicionario-biblico.md` — termos teológicos, bíblicos e hermenêuticos (A–V)
- `enciclopedia-biblica.md` — história, geografia, cultura, personagens, gêneros, manuscritos, arqueologia
- PDFs Matthew Henry (5 volumes), Dicionário Wycliffe e Enciclopédia de Personagens

**Correções técnicas:**
- `tsconfig.cjs.json` atualizado para excluir arquivos Vite-specific do build CJS
- `utils/index.ts` — removido re-export do `aiRouter` que quebrava o build CJS
- `bootstrap.ts` atualizado para usar `runSupportAgents`

**Estado atual:** Aplicação com pipeline multi-agente completo, exegese do original, textos paralelos em todas as gerações, ícone de Bíblia SVG, builds CJS e Web limpos.

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Considerar indexação dos PDFs da pasta `docs/` para enriquecer o contexto dos agentes
- Deploy (Vercel ou Netlify)

---
