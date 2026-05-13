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

---

### 2026-04-03 — Sessão 5: Deploy na LocalWeb + Passagem Bíblica Opcional

**Deploy seguro na LocalWeb:**
- `proxy/openai.php` — proxy PHP que mantém a chave da OpenAI no servidor (nunca exposta no JS)
- `aiRouter.ts` — detecta `import.meta.env.PROD`: em produção usa `/proxy/v1`, em dev usa chave do `.env`
- `deploy/.htaccess` — rewrite rules para SPA + proxy PHP
- `deploy/LEIA-ME.txt` — guia de instalação em português para os irmãos da igreja
- `scripts/package-deploy.cjs` — script que faz build + empacota `sermao-deploy.zip` automaticamente
- Comando `npm run deploy:pack` adicionado ao `package.json`
- Deploy publicado em: `http://sermao.jdafotografia.com.br` (subdomínio na LocalWeb, pasta `public_html/sermao-deploy`)
- Subdomínio configurado como "Conteúdo de pasta" na LocalWeb apontando para `public_html/sermao-deploy`

**Passagem bíblica opcional:**
- Toggle "Com passagem / Sem passagem" na seção de passagem bíblica
- Sem passagem: agentes buscam versículos relevantes pelo tema e contexto informados
- Com passagem: funciona como antes — exegese completa do original
- Validação atualizada: aceita tema OU passagem (não exige os dois)
- Output e rodapé mostram tema quando não há passagem definida

**Estado atual:** App publicado em `sermao.jdafotografia.com.br`, pipeline multi-agente funcionando, geração por tema livre ou por passagem específica.

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Melhorar UX mobile

---

### 2026-04-04 — Sessão 6: Botão "Gerar os 3 Tipos" — Geração Paralela Simultânea

**O que foi feito:**

**Nova função `runAllMainAgents()` em `aiRouter.ts`:**
- Executa sermonAgent, outlineAgent e studyAgent em paralelo sem streaming
- Usa `Promise.all()` com `gpt-4o`, max_tokens 6000 por agente
- Retorna `GeneratedContent[]` com os 3 resultados

**Nova função `masterAgentAll()` em `masterAgent.ts`:**
- Retorna `{ agents: [sermonAgent, outlineAgent, studyAgent], apoio: [Exegeta, Teólogo] }`
- Agentes de apoio compartilhados entre os 3 tipos

**`handleGerarTodos()` no componente:**
- Dispara `Promise.all([runAllMainAgents(...), runSupportAgents(...)])` — 5 chamadas em paralelo
- Total de tokens por geração: ~3× mais que geração simples (custo maior, mas tudo de uma vez)

**Componente `AllTypesResult`:**
- Painel com abas: 🎙️ Sermão | 📝 Esboço | 📖 Estudo Bíblico
- Footer personalizado por aba (tipo correto)
- Pesquisa Especializada compartilhada abaixo (Exegeta + Teólogo)
- Botões Copiar (por aba) e Nova Geração

**UI atualizada:**
- Botão "✦ Gerar os 3 Tipos" ao lado do botão "Gerar [tipo]"
- Loading visual com badges dos 3 tipos enquanto gera em paralelo
- CSS: `.at-panel`, `.at-tabs`, `.at-tab`, `.at-loading-card`, `.sgf-submit-all`
- `.sgf-actions` agora flexível em coluna para acomodar os 2 botões

**Deploy:** `sermao-deploy.zip` regenerado e pronto para upload.

**Estado atual:** App com geração individual e geração simultânea dos 3 tipos. Build e push feitos. Zip pronto.

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Melhorar UX mobile

---

### 2026-04-04 — Sessão 7: Referências Bíblicas Clicáveis + Segurança do Proxy

**Referências bíblicas como links clicáveis:**
- `BIBLE_REF_RE`: regex que detecta referências PT no texto gerado (ex: João 3:16, Romanos 8:28)
- `renderInline()` estendido: detecta refs e renderiza como botões clicáveis com `className="bible-ref-link"`
- `BiblePassageModal`: busca passagem em `bible-api.com` (tradução Almeida, gratuita)
- Fecha com Esc, clique fora ou botão "Fechar"
- Funciona no conteúdo principal, Pesquisa Especializada e painel "Gerar os 3 Tipos"
- Mobile: bottom sheet (sobe de baixo da tela)

**Bug corrigido — página em branco em produção:**
- Causa: `[–\-]` no regex era interpretado como range inválido (en-dash > hyphen) em alguns browsers → `SyntaxError` na inicialização do módulo = página em branco
- Correção: `[-–]` (hífen PRIMEIRO na classe = sempre literal), flag `g` removido (desnecessário para `split()`), `try-catch` defensivo adicionado

**Segurança do proxy (`proxy/openai.php`):**
- `Access-Control-Allow-Origin`: restrito a `sermao.jdafotografia.com.br` (não mais `*`)
- Rate limiting: 20 req/IP a cada 5 minutos (file-based em `sys_get_temp_dir()`)
- Validação de body: rejeita JSON inválido, sem `messages`, ou com >10 mensagens
- Modelo forçado para `gpt-4o` (impede override) e `max_tokens` limitado a 8000
- `SSL_VERIFYPEER` ativo, resposta 204 no CORS preflight

**Fluxo correto de deploy:**
1. Editar `proxy/openai.php` linha 12 com chave real
2. `npm run deploy:pack` — gera `sermao-deploy.zip` com chave incluída
3. Subir zip no servidor, sobrescrevendo arquivos antigos

**Estado atual:** Build limpo, zip gerado, 3 commits pendentes de push (rede instável). Proxy seguro. Usuário precisa inserir chave no `proxy/openai.php` local antes de rodar `deploy:pack`.

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Melhorar UX mobile

---

### 2026-05-13 — Sessão 8: Enriquecimento dos Prompts Principais (Sermão, Esboço, Estudo)

**O que foi feito:**

**Diagnóstico antes de qualquer mudança:**
- Leitura completa de todos os arquivos de agentes e prompts
- Identificação de lacunas: pontos rasas em bullet points, sem arco narrativo, sem diferenciação real entre tipos de sermão, subtópicos como placeholders, estudo sem progressão didática

**Reescrita de `src/prompts/sermonPrompt.ts`:**
- Arco narrativo explícito: Intro (tensão) → P1 (fundamenta) → P2 (aprofunda) → P3 (resolve) → Conclusão (síntese crescente)
- Diferenciação estrutural real por tipo: Expositivo (bloco a bloco), Textual (palavra a palavra), Temático (argumento progressivo)
- Exige desenvolvimento em parágrafos completos — não bullet points
- Template de ilustração com estrutura narrativa: cenário + tensão + resolução
- Nota de transição entre pontos
- Aplicação com persona específica (não "você", mas "se você é pai ou mãe...")

**Reescrita de `src/prompts/outlinePrompt.ts`:**
- Princípio de coerência: cada ponto declara explicitamente como serve à proposição central
- 3 subtópicos por ponto (a, b, c) com conteúdo real — 2-3 frases de explicação, não placeholders
- Notas de transição entre pontos
- Material de apoio expandido: advertências hermenêuticas, notas de pesquisa, variações por público, dica de ritmo, recursos complementares
- Resumo visual do esboço para o pregador consultar durante a pregação

**Reescrita de `src/prompts/studyPrompt.ts`:**
- Princípio de progressão didática: Tópico 1 (fundamento) → 2 (aprofundamento) → 3 (desafio)
- Nota para o Líder em cada tópico — o que saber antes de conduzir aquele ponto
- Dinâmica sugerida por tópico (duplas, roda, silêncio individual)
- Perguntas em duas camadas: diagnóstico (onde o participante está) + desafio (para onde precisa ir)
- Perguntas progressivas: compreensão → reflexão pessoal → discussão em grupo
- Oração estruturada em 4 movimentos: Louvor + Confissão + Petição + Compromisso
- Recursos complementares para o líder aprofundar

**Integração de palavras do original + traduções (todos os 3 prompts):**
- Palavras-chave em hebraico (AT) ou grego (NT) integradas organicamente nos parágrafos de exposição
- Versículo-âncora de cada ponto/tópico citado em ARA + tradução literal do original
- Formato didático e natural — nunca em tabela ou seção separada

**Deploy:**
- 2 commits: `392d1c8` (enriquecimento) + `0d57bdc` (original + traduções)
- Push para `origin/main` feito
- `sermao-deploy.zip` (122 KB) gerado e pronto — subir apenas `assets/` e `index.html` no servidor (proxy não mudou)

**Estado atual:** Prompts dos 3 agentes principais reescritos com profundidade real. Build limpo. Git e zip atualizados.

**Próximos passos sugeridos:**
- Adicionar modo de impressão / exportar para PDF
- Adicionar histórico de sermões gerados (localStorage)
- Melhorar UX mobile

---
