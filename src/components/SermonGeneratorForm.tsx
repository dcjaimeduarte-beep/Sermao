import { useCallback, useMemo, useRef, useState } from "react";
import type { AudienceType, ContentType, GeneratedContent, SermonStyle, UserRequest } from "@/domain";
import { masterAgent } from "@/agents/masterAgent";
import { runAgent, runSupportAgents } from "@/services/aiRouter";
import { BIBLE_BOOKS_PT } from "@/data/bibleBooks.pt";

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string; desc: string }[] = [
  { value: "sermao", label: "Sermão", desc: "Pregação completa com introdução, desenvolvimento e conclusão" },
  { value: "esboco", label: "Esboço", desc: "Estrutura organizada com tópicos e subtópicos para pregar" },
  { value: "estudo", label: "Estudo Bíblico", desc: "Material didático para células, EBD ou discipulado" },
];

const PUBLICO_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: "misto", label: "Público geral" },
  { value: "jovens", label: "Jovens" },
  { value: "criancas", label: "Crianças" },
  { value: "adolescentes", label: "Adolescentes" },
  { value: "mulheres", label: "Mulheres" },
  { value: "homens", label: "Homens" },
  { value: "nao_convertidos", label: "Não convertidos" },
];

const TIPO_SERMAO_OPTIONS: { value: SermonStyle; label: string }[] = [
  { value: "expositivo", label: "Expositivo" },
  { value: "textual", label: "Textual" },
  { value: "tematico", label: "Temático" },
];

const PUBLICO_LABEL: Record<AudienceType, string> = {
  misto: "Público geral",
  jovens: "Jovens",
  criancas: "Crianças",
  adolescentes: "Adolescentes",
  mulheres: "Mulheres",
  homens: "Homens",
  nao_convertidos: "Não convertidos",
};

const LOADING_STAGES = [
  "Analisando a passagem bíblica…",
  "Buscando contexto histórico e literário…",
  "Desenvolvendo o conteúdo teológico…",
  "Estruturando aplicações pessoais…",
  "Finalizando o material…",
];

function buildTextoBase(livro: string, capitulo: string, versiculos: string): string {
  const cap = capitulo.trim();
  const ver = versiculos.trim();
  if (!livro || !cap) return "";
  return ver ? `${livro} ${cap}:${ver}` : `${livro} ${cap}`;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderSermonContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="so-list">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("#### ")) {
      flushList();
      nodes.push(<h4 key={key++} className="so-h4">{renderInline(line.slice(5))}</h4>);
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(<h3 key={key++} className="so-h3">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      nodes.push(<h2 key={key++} className="so-h2">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      nodes.push(<h1 key={key++} className="so-h1">{renderInline(line.slice(2))}</h1>);
    } else if (line.match(/^---+$/)) {
      flushList();
      nodes.push(<hr key={key++} className="so-divider" />);
    } else if (line.match(/^═+$/)) {
      flushList();
      nodes.push(<hr key={key++} className="so-divider-strong" />);
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      listItems.push(line.replace(/^[-•] /, ""));
    } else if (line.startsWith("✓ ") || line.startsWith("✗ ")) {
      listItems.push(line);
    } else if (line.trim() === "") {
      flushList();
      nodes.push(<div key={key++} className="so-gap" />);
    } else {
      flushList();
      nodes.push(<p key={key++} className="so-p">{renderInline(line)}</p>);
    }
  }
  flushList();
  return <>{nodes}</>;
}

interface FooterInfo {
  passagem: string;
  tipo: string;
  publico: AudienceType;
  duracao: number;
  profundidade: string;
  pastor: string;
  igreja: string;
  data: string;
}

function SermonFooter({ info }: { info: FooterInfo }) {
  const profMap: Record<string, string> = { simples: "Simples", media: "Média", profunda: "Profunda" };
  return (
    <div className="so-footer">
      <div className="so-footer-divider" />
      <div className="so-footer-grid">
        <div className="so-footer-col">
          <span className="so-footer-label">Passagem</span>
          <span className="so-footer-value">{info.passagem}</span>
        </div>
        <div className="so-footer-col">
          <span className="so-footer-label">Tipo</span>
          <span className="so-footer-value">{info.tipo}</span>
        </div>
        <div className="so-footer-col">
          <span className="so-footer-label">Público</span>
          <span className="so-footer-value">{PUBLICO_LABEL[info.publico]}</span>
        </div>
        <div className="so-footer-col">
          <span className="so-footer-label">Duração estimada</span>
          <span className="so-footer-value">{info.duracao} min</span>
        </div>
        <div className="so-footer-col">
          <span className="so-footer-label">Profundidade</span>
          <span className="so-footer-value">{profMap[info.profundidade]}</span>
        </div>
        <div className="so-footer-col">
          <span className="so-footer-label">Gerado em</span>
          <span className="so-footer-value">{info.data}</span>
        </div>
        {info.pastor && (
          <div className="so-footer-col">
            <span className="so-footer-label">Pastor(a)</span>
            <span className="so-footer-value">{info.pastor}</span>
          </div>
        )}
        {info.igreja && (
          <div className="so-footer-col">
            <span className="so-footer-label">Igreja</span>
            <span className="so-footer-value">{info.igreja}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type SupportResult = GeneratedContent & { label: string; icone: string };

function SpecialistPanel({ results }: { results: SupportResult[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="sp-panel">
      <div className="sp-header">
        <div className="sp-title-row">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="28" height="28" className="sp-title-icon-svg" aria-hidden="true">
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" fill="currentColor" opacity=".12"/>
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.4" fill="none"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" fill="currentColor" opacity=".22"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.4" fill="none"/>
            <line x1="16" y1="14" x2="30" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="19" x2="30" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M23 31 L26 28 L29 31 L29 39 L26 37 L23 39 Z" fill="currentColor" opacity=".7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          <h2 className="sp-title">Pesquisa Especializada</h2>
        </div>
        <p className="sp-subtitle">
          Contribuições dos especialistas para aprofundar o estudo e a pregação
        </p>
      </div>

      <div className="sp-tabs">
        {results.map((r, i) => (
          <button
            key={r.agentId}
            type="button"
            className={`sp-tab${activeTab === i ? " is-active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="sp-tab-icon">{r.icone}</span>
            <span className="sp-tab-label">{r.label}</span>
          </button>
        ))}
      </div>

      <div className="sp-body">
        {results[activeTab] && (
          <div className="sp-content">
            {renderSermonContent(results[activeTab].content)}
          </div>
        )}
      </div>
    </section>
  );
}

function SpecialistLoadingPanel({ labels }: { labels: Array<{ label: string; icone: string }> }) {
  return (
    <section className="sp-panel sp-panel-loading">
      <div className="sp-header">
        <div className="sp-title-row">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="28" height="28" className="sp-title-icon-svg" aria-hidden="true">
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" fill="currentColor" opacity=".12"/>
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.4" fill="none"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" fill="currentColor" opacity=".22"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.4" fill="none"/>
            <line x1="16" y1="14" x2="30" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="19" x2="30" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M23 31 L26 28 L29 31 L29 39 L26 37 L23 39 Z" fill="currentColor" opacity=".7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          <h2 className="sp-title">Pesquisa Especializada</h2>
        </div>
        <p className="sp-subtitle">Consultando especialistas em paralelo…</p>
      </div>
      <div className="sp-loading-grid">
        {labels.map((l) => (
          <div key={l.label} className="sp-loading-card">
            <span className="sp-loading-icon">{l.icone}</span>
            <span className="sp-loading-label">{l.label}</span>
            <span className="sp-spinner sp-spinner-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SermonGeneratorForm() {
  const [tipoConteudo, setTipoConteudo] = useState<ContentType>("sermao");
  const [livro, setLivro] = useState("João");
  const [capitulo, setCapitulo] = useState("15");
  const [versiculos, setVersiculos] = useState("1-8");
  const [tema, setTema] = useState("");
  const [contexto, setContexto] = useState("");
  const [publico, setPublico] = useState<AudienceType>("misto");
  const [tipoSermao, setTipoSermao] = useState<SermonStyle>("expositivo");
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);
  const [profundidade, setProfundidade] = useState<"simples" | "media" | "profunda">("media");
  const [incluirContextoHistorico, setIncluirContextoHistorico] = useState(true);
  const [incluirAplicacao, setIncluirAplicacao] = useState(true);
  const [incluirApeloFinal, setIncluirApeloFinal] = useState(true);
  const [pastor, setPastor] = useState("");
  const [igreja, setIgreja] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingEspecialistas, setLoadingEspecialistas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saida, setSaida] = useState<string | null>(null);
  const [footerInfo, setFooterInfo] = useState<FooterInfo | null>(null);
  const [pesquisaEspecializada, setPesquisaEspecializada] = useState<SupportResult[] | null>(null);
  const [apoioLabels, setApoioLabels] = useState<Array<{ label: string; icone: string }>>([]);
  const [copied, setCopied] = useState(false);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const specialistRef = useRef<HTMLDivElement>(null);

  const textoBasePreview = useMemo(
    () => buildTextoBase(livro, capitulo, versiculos),
    [livro, capitulo, versiculos]
  );

  const montarPedido = useCallback((): UserRequest => ({
    tipoConteudo,
    tipoSermao: tipoConteudo === "sermao" ? tipoSermao : undefined,
    publico,
    duracaoMinutos: Math.max(5, Math.min(180, duracaoMinutos)),
    tema: tema.trim() || undefined,
    textoBase: textoBasePreview || undefined,
    contextoGeracao: [
      contexto.trim(),
      pastor.trim() ? `Pastor(a): ${pastor.trim()}` : "",
      igreja.trim() ? `Igreja: ${igreja.trim()}` : "",
    ].filter(Boolean).join(" | ") || undefined,
    profundidade,
    incluirContextoHistorico,
    incluirAplicacao,
    incluirApeloFinal,
  }), [tipoConteudo, tipoSermao, publico, duracaoMinutos, tema, textoBasePreview, contexto, pastor, igreja, profundidade, incluirContextoHistorico, incluirAplicacao, incluirApeloFinal]);

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSaida(null);
    setFooterInfo(null);
    setCopied(false);
    setPesquisaEspecializada(null);
    setApoioLabels([]);

    if (!textoBasePreview) {
      setErro("Indique pelo menos o livro e o capítulo.");
      return;
    }

    setLoading(true);
    setLoadingStage(0);

    stageTimerRef.current = setInterval(() => {
      setLoadingStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 3500);

    try {
      const request = montarPedido();
      const { principal, apoio } = masterAgent(request);

      // Guarda os labels dos agentes de apoio para mostrar no loading
      setApoioLabels(apoio.map((a) => ({ label: a.label, icone: a.icone })));

      // 1. Executa o agente principal com streaming
      let accumulated = "";
      const result = await runAgent(principal, request, (chunk) => {
        accumulated += chunk;
        setSaida(accumulated);
        if (outputRef.current) {
          outputRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      });
      setSaida(result.content);

      const tipoLabel = CONTENT_TYPE_OPTIONS.find((o) => o.value === tipoConteudo)?.label ?? tipoConteudo;
      const tipoSermaoLabel = tipoConteudo === "sermao"
        ? `${tipoLabel} ${TIPO_SERMAO_OPTIONS.find((o) => o.value === tipoSermao)?.label ?? ""}`.trim()
        : tipoLabel;

      setFooterInfo({
        passagem: textoBasePreview,
        tipo: tipoSermaoLabel,
        publico,
        duracao: duracaoMinutos,
        profundidade,
        pastor: pastor.trim(),
        igreja: igreja.trim(),
        data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      });

      // 2. Executa os agentes de apoio em paralelo (sem streaming)
      if (apoio.length > 0) {
        setLoadingEspecialistas(true);
        setTimeout(() => {
          specialistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);

        const suportes = await runSupportAgents(apoio, request);
        setPesquisaEspecializada(suportes);
        setLoadingEspecialistas(false);

        setTimeout(() => {
          specialistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Falha ao gerar o conteúdo. Verifique a API key e tente novamente."
      );
      setLoadingEspecialistas(false);
    } finally {
      setLoading(false);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    }
  }

  function handleCopy() {
    if (!saida) return;
    navigator.clipboard.writeText(saida).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleNovo() {
    setSaida(null);
    setFooterInfo(null);
    setErro(null);
    setCopied(false);
    setPesquisaEspecializada(null);
    setApoioLabels([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tipoLabel = CONTENT_TYPE_OPTIONS.find((o) => o.value === tipoConteudo)?.label ?? "Conteúdo";

  return (
    <div className="sgf-wrap">
      {/* ── Header ── */}
      <header className="sgf-header">
        <div className="sgf-header-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="44" height="44" aria-hidden="true">
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" fill="currentColor" opacity=".12"/>
            <rect x="6" y="4" width="30" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" fill="currentColor" opacity=".22"/>
            <rect x="6" y="4" width="7" height="40" rx="3" ry="3" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            <line x1="16" y1="14" x2="30" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="16" y1="19" x2="30" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="16" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M23 31 L26 28 L29 31 L29 39 L26 37 L23 39 Z" fill="currentColor" opacity=".7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h1 className="sgf-title">Gerador de Conteúdo Bíblico</h1>
          <p className="sgf-subtitle">
            Sermões, esboços e estudos com exegese do original, textos paralelos e aplicação pastoral em linguagem atual.
          </p>
        </div>
      </header>

      <form className="sgf-form" onSubmit={handleGerar}>

        {/* ── Tipo de Conteúdo ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">O que deseja gerar?</div>
          <div className="sgf-type-grid">
            {CONTENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`sgf-type-card${tipoConteudo === opt.value ? " is-active" : ""}`}
                onClick={() => setTipoConteudo(opt.value)}
              >
                <span className="sgf-type-card-title">{opt.label}</span>
                <span className="sgf-type-card-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Passagem Bíblica ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">
            <span className="sgf-step-num">1</span> Passagem bíblica
          </div>
          <div className="sgf-grid-3">
            <label className="sgf-field sgf-col-2">
              <span>Livro</span>
              <select value={livro} onChange={(e) => setLivro(e.target.value)} required>
                {BIBLE_BOOKS_PT.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="sgf-field">
              <span>Capítulo</span>
              <input
                type="number" min={1} max={150}
                value={capitulo}
                onChange={(e) => setCapitulo(e.target.value)}
                required
              />
            </label>
            <label className="sgf-field sgf-col-full">
              <span>Versículos <em>(opcional, ex.: 1-8 ou 5)</em></span>
              <input
                type="text" inputMode="numeric"
                placeholder="ex.: 1-8"
                value={versiculos}
                onChange={(e) => setVersiculos(e.target.value)}
              />
            </label>
          </div>
          {textoBasePreview && (
            <div className="sgf-passagem-badge">
              <span className="sgf-passagem-badge-icon">📖</span>
              <strong>{textoBasePreview}</strong>
            </div>
          )}
        </section>

        {/* ── Configurações ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">
            <span className="sgf-step-num">2</span> Configurações
          </div>
          <div className="sgf-grid-2">
            {tipoConteudo === "sermao" && (
              <label className="sgf-field">
                <span>Tipo de sermão</span>
                <select value={tipoSermao} onChange={(e) => setTipoSermao(e.target.value as SermonStyle)}>
                  {TIPO_SERMAO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="sgf-field">
              <span>Público-alvo</span>
              <select value={publico} onChange={(e) => setPublico(e.target.value as AudienceType)}>
                {PUBLICO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="sgf-field">
              <span>Duração estimada</span>
              <div className="sgf-duration-wrap">
                <input
                  type="range" min={5} max={90} step={5}
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                  className="sgf-range"
                />
                <span className="sgf-duration-label">{duracaoMinutos} min</span>
              </div>
            </label>
            <label className="sgf-field">
              <span>Profundidade teológica</span>
              <div className="sgf-depth-group">
                {(["simples", "media", "profunda"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`sgf-depth-btn${profundidade === d ? " is-active" : ""}`}
                    onClick={() => setProfundidade(d)}
                  >
                    {d === "simples" ? "Simples" : d === "media" ? "Média" : "Profunda"}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </section>

        {/* ── Tema e Contexto ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">
            <span className="sgf-step-num">3</span> Tema e contexto <em>(opcional)</em>
          </div>
          <div className="sgf-stack">
            <label className="sgf-field">
              <span>Tema ou título sugerido</span>
              <input
                type="text"
                placeholder="ex.: Permanecendo em Cristo, A videira verdadeira…"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
              />
            </label>
            <label className="sgf-field">
              <span>Contexto pastoral</span>
              <textarea
                rows={3}
                placeholder="Situação da igreja, série temática, calendário litúrgico, tom desejado, objetivos pastorais…"
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* ── Identificação ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">
            <span className="sgf-step-num">4</span> Identificação <em>(opcional — aparece no rodapé)</em>
          </div>
          <div className="sgf-grid-2">
            <label className="sgf-field">
              <span>Pastor(a) / Pregador(a)</span>
              <input
                type="text"
                placeholder="ex.: Pr. João Silva"
                value={pastor}
                onChange={(e) => setPastor(e.target.value)}
              />
            </label>
            <label className="sgf-field">
              <span>Igreja / Ministério</span>
              <input
                type="text"
                placeholder="ex.: Igreja Batista Central"
                value={igreja}
                onChange={(e) => setIgreja(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* ── Incluir no material ── */}
        <section className="sgf-section">
          <div className="sgf-section-label">
            <span className="sgf-step-num">5</span> Incluir no material
          </div>
          <div className="sgf-checks-row">
            <label className="sgf-check">
              <input type="checkbox" checked={incluirContextoHistorico} onChange={(e) => setIncluirContextoHistorico(e.target.checked)} />
              <span className="sgf-check-box" />
              <span>Contexto histórico e literário</span>
            </label>
            <label className="sgf-check">
              <input type="checkbox" checked={incluirAplicacao} onChange={(e) => setIncluirAplicacao(e.target.checked)} />
              <span className="sgf-check-box" />
              <span>Aplicação prática</span>
            </label>
            <label className="sgf-check">
              <input type="checkbox" checked={incluirApeloFinal} onChange={(e) => setIncluirApeloFinal(e.target.checked)} />
              <span className="sgf-check-box" />
              <span>Apelo final</span>
            </label>
          </div>
        </section>

        {/* ── Botão ── */}
        <div className="sgf-actions">
          <button type="submit" className="sgf-submit" disabled={loading || loadingEspecialistas || !textoBasePreview}>
            {loading ? (
              <span className="sgf-submit-loading">
                <span className="sgf-spinner" />
                {LOADING_STAGES[loadingStage]}
              </span>
            ) : (
              <>Gerar {tipoLabel}</>
            )}
          </button>
        </div>
      </form>

      {/* ── Erro ── */}
      {erro && (
        <div className="sgf-error" role="alert">
          <span>⚠</span> {erro}
        </div>
      )}

      {/* ── Saída principal ── */}
      {saida && (
        <section className="sgf-output" aria-live="polite" ref={outputRef}>
          <div className="sgf-output-header">
            <div className="sgf-output-meta">
              <span className="sgf-output-tag">{tipoLabel}</span>
              <span className="sgf-output-ref">{textoBasePreview}</span>
            </div>
            <div className="sgf-output-actions">
              <button
                type="button"
                className={`sgf-action-btn${copied ? " is-copied" : ""}`}
                onClick={handleCopy}
                title="Copiar conteúdo"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                className="sgf-action-btn sgf-action-btn-secondary"
                onClick={handleNovo}
                disabled={loadingEspecialistas}
              >
                Nova geração
              </button>
            </div>
          </div>
          <div className="sgf-output-body">
            {renderSermonContent(saida)}
            {loading && <span className="sgf-cursor" aria-hidden="true" />}
            {footerInfo && !loading && <SermonFooter info={footerInfo} />}
          </div>
        </section>
      )}

      {/* ── Pesquisa Especializada ── */}
      <div ref={specialistRef}>
        {loadingEspecialistas && apoioLabels.length > 0 && (
          <SpecialistLoadingPanel labels={apoioLabels} />
        )}
        {pesquisaEspecializada && pesquisaEspecializada.length > 0 && !loadingEspecialistas && (
          <SpecialistPanel results={pesquisaEspecializada} />
        )}
      </div>
    </div>
  );
}
