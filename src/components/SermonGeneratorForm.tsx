import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AudienceType, ContentType, GeneratedContent, SermonStyle, UserRequest } from "@/domain";
import { masterAgent, masterAgentAll } from "@/agents/masterAgent";
import { runAgent, runAllMainAgents, runSupportAgents } from "@/services/aiRouter";
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

// ── Referências cruzadas bíblicas ──────────────────────────────────────────
const BIBLE_BOOKS_PATTERN = [
  "(?:1|2|3)\\s+Samuel", "(?:1|2|3)\\s+Reis", "(?:1|2|3)\\s+Crônicas",
  "(?:1|2|3)\\s+Coríntios", "(?:1|2|3)\\s+Tessalonicenses",
  "(?:1|2|3)\\s+Timóteo", "(?:1|2|3)\\s+Pedro",
  "(?:1|2|3)\\s+João",
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "Esdras", "Neemias", "Ester", "Jó",
  "Salmos?", "Provérbios", "Eclesiastes", "Cânticos?(?:\\s+dos\\s+Cânticos)?",
  "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel",
  "Oséias", "Joel", "Amós", "Obadias", "Jonas", "Miquéias",
  "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João",
  "Atos(?:\\s+dos\\s+Apóstolos)?", "Romanos",
  "Gálatas", "Efésios", "Filipenses", "Colossenses",
  "Tito", "Filemom", "Hebreus", "Tiago", "Judas", "Apocalipse",
].join("|");

// Hyphen FIRST in class = always literal (safe across all browsers)
const BIBLE_REF_RE = new RegExp(
  `((?:${BIBLE_BOOKS_PATTERN})\\s+\\d+(?::\\d+(?:[-–]\\d+)?)?)`,
  "i"
);

function renderInline(text: string, onBibleRef?: (ref: string) => void): React.ReactNode[] {
  // 1. Split by bold/italic markers
  const boldItalicParts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);

  return boldItalicParts.flatMap((part, bi) => {
    if (!part) return [];
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return [<strong key={`b${bi}`}>{part.slice(2, -2)}</strong>];
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return [<em key={`e${bi}`}>{part.slice(1, -1)}</em>];

    if (!onBibleRef) return [part];

    // 2. Within plain text, detect Bible references (capturing group → odd indices = refs)
    try {
      const refParts = part.split(BIBLE_REF_RE);
      return refParts.map((rp, ri) => {
        if (!rp) return null;
        if (ri % 2 === 1) {
          return (
            <button
              key={`ref${bi}-${ri}`}
              type="button"
              className="bible-ref-link"
              onClick={() => onBibleRef(rp)}
            >
              {rp}
            </button>
          );
        }
        return rp || null;
      }).filter(Boolean) as React.ReactNode[];
    } catch {
      return [part];
    }
  });
}

function renderSermonContent(text: string, onBibleRef?: (ref: string) => void): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="so-list">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, onBibleRef)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("#### ")) {
      flushList();
      nodes.push(<h4 key={key++} className="so-h4">{renderInline(line.slice(5), onBibleRef)}</h4>);
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(<h3 key={key++} className="so-h3">{renderInline(line.slice(4), onBibleRef)}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      nodes.push(<h2 key={key++} className="so-h2">{renderInline(line.slice(3), onBibleRef)}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      nodes.push(<h1 key={key++} className="so-h1">{renderInline(line.slice(2), onBibleRef)}</h1>);
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
      nodes.push(<p key={key++} className="so-p">{renderInline(line, onBibleRef)}</p>);
    }
  }
  flushList();
  return <>{nodes}</>;
}

// ── Modal de passagem bíblica ───────────────────────────────────────────────
function BiblePassageModal({ refText, onClose }: { refText: string; onClose: () => void }) {
  const [passageText, setPassageText] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPassageText(null);
    setReference(null);

    const encoded = encodeURIComponent(refText);
    fetch(`https://bible-api.com/${encoded}?translation=almeida`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPassageText(data.text?.trim() ?? "");
        setReference(data.reference ?? refText);
      })
      .catch(() =>
        setError("Não foi possível carregar a passagem. Verifique a conexão e tente novamente.")
      )
      .finally(() => setLoading(false));
  }, [refText]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="bm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bm-modal" role="dialog" aria-modal="true" aria-label={refText}>
        <div className="bm-header">
          <div className="bm-title-row">
            <span className="bm-ref-badge">📖</span>
            <h2 className="bm-title">{reference ?? refText}</h2>
          </div>
          <button type="button" className="bm-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="bm-body">
          {loading && (
            <div className="bm-state">
              <span className="sgf-spinner bm-spinner" />
              <span>Carregando passagem…</span>
            </div>
          )}
          {error && (
            <div className="bm-state bm-error">
              <span>⚠</span> {error}
            </div>
          )}
          {passageText && !loading && (
            <p className="bm-passage">{passageText}</p>
          )}
        </div>

        <div className="bm-footer">
          <span className="bm-source">Bíblia Almeida · bible-api.com</span>
          <button type="button" className="bm-close-btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
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

function SpecialistPanel({ results, onBibleRef }: { results: SupportResult[]; onBibleRef?: (ref: string) => void }) {
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
          <h2 className="sp-title">Fundação Exegética e Teológica</h2>
        </div>
        <p className="sp-subtitle">
          Material exclusivo dos especialistas — exegese do original, contexto histórico, paralelos bíblicos e análise teológica que fundamentam o conteúdo gerado acima
        </p>
        <div className="sp-legend">
          {results.map((r) => (
            <span key={r.agentId} className="sp-legend-badge">
              <span>{r.icone}</span>
              <span className="sp-legend-label">{r.label}</span>
            </span>
          ))}
        </div>
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
            {renderSermonContent(results[activeTab].content, onBibleRef)}
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
          <h2 className="sp-title">Fundação Exegética e Teológica</h2>
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

const TODOS_TIPOS = [
  { label: "Sermão", icon: "🎙️" },
  { label: "Esboço", icon: "📝" },
  { label: "Estudo Bíblico", icon: "📖" },
];

interface AllTypesResultProps {
  resultados: GeneratedContent[];
  apoio: SupportResult[] | null;
  footerInfo: FooterInfo;
  onNovo: () => void;
  onBibleRef?: (ref: string) => void;
}

function AllTypesResult({ resultados, apoio, footerInfo, onNovo, onBibleRef }: AllTypesResultProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const content = resultados[activeTab]?.content;
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="at-wrap">
      <section className="at-panel">
        <div className="at-header">
          <div className="at-meta">
            <span className="at-badge">✦ 3 Tipos Gerados</span>
            <span className="at-ref">{footerInfo.passagem}</span>
          </div>
          <div className="at-actions">
            <button
              type="button"
              className={`sgf-action-btn${copied ? " is-copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              className="sgf-action-btn sgf-action-btn-secondary"
              onClick={onNovo}
            >
              Nova geração
            </button>
          </div>
        </div>

        <div className="at-tabs">
          {TODOS_TIPOS.map((tipo, i) => (
            <button
              key={i}
              type="button"
              className={`at-tab${activeTab === i ? " is-active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="at-tab-icon">{tipo.icon}</span>
              <span className="at-tab-label">{tipo.label}</span>
            </button>
          ))}
        </div>

        <div className="at-body">
          {resultados[activeTab] && (
            <div className="at-content">
              {renderSermonContent(resultados[activeTab].content, onBibleRef)}
              <SermonFooter info={{ ...footerInfo, tipo: TODOS_TIPOS[activeTab].label }} />
            </div>
          )}
        </div>
      </section>

      {apoio && apoio.length > 0 && <SpecialistPanel results={apoio} onBibleRef={onBibleRef} />}
    </div>
  );
}

export function SermonGeneratorForm() {
  const [tipoConteudo, setTipoConteudo] = useState<ContentType>("sermao");
  const [usarPassagem, setUsarPassagem] = useState(false);
  const [livro, setLivro] = useState("");
  const [capitulo, setCapitulo] = useState("");
  const [versiculos, setVersiculos] = useState("");
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
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saida, setSaida] = useState<string | null>(null);
  const [footerInfo, setFooterInfo] = useState<FooterInfo | null>(null);
  const [pesquisaEspecializada, setPesquisaEspecializada] = useState<SupportResult[] | null>(null);
  const [apoioLabels, setApoioLabels] = useState<Array<{ label: string; icone: string }>>([]);
  const [copied, setCopied] = useState(false);
  const [resultadosTodos, setResultadosTodos] = useState<GeneratedContent[] | null>(null);
  const [pesquisaTodos, setPesquisaTodos] = useState<SupportResult[] | null>(null);
  const [footerInfoTodos, setFooterInfoTodos] = useState<FooterInfo | null>(null);
  const [bibleRef, setBibleRef] = useState<string | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const specialistRef = useRef<HTMLDivElement>(null);
  const todosRef = useRef<HTMLDivElement>(null);

  const textoBasePreview = useMemo(
    () => buildTextoBase(livro, capitulo, versiculos),
    [livro, capitulo, versiculos]
  );

  const montarPedido = useCallback((): UserRequest => ({
    tipoConteudo,
    tipoSermao, // sempre incluído — runAllMainAgents usa para o sermonAgent mesmo quando outro tipo está selecionado
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

  async function handleGerarTodos() {
    setErro(null);
    setSaida(null);
    setFooterInfo(null);
    setCopied(false);
    setPesquisaEspecializada(null);
    setApoioLabels([]);
    setResultadosTodos(null);
    setPesquisaTodos(null);
    setFooterInfoTodos(null);

    if (!textoBasePreview && !tema.trim()) {
      setErro("Informe pelo menos um tema ou uma passagem bíblica.");
      return;
    }

    setLoadingTodos(true);

    try {
      const request = montarPedido();
      const { agents, apoio } = masterAgentAll();

      const [todos, suportes] = await Promise.all([
        runAllMainAgents(agents, request),
        runSupportAgents(apoio, request),
      ]);

      setResultadosTodos(todos);
      setPesquisaTodos(suportes);
      setFooterInfoTodos({
        passagem: textoBasePreview || tema.trim() || "Tema livre",
        tipo: "Sermão · Esboço · Estudo",
        publico,
        duracao: duracaoMinutos,
        profundidade,
        pastor: pastor.trim(),
        igreja: igreja.trim(),
        data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      });

      setTimeout(() => {
        todosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Falha ao gerar o conteúdo. Verifique a API key e tente novamente."
      );
    } finally {
      setLoadingTodos(false);
    }
  }

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSaida(null);
    setFooterInfo(null);
    setCopied(false);
    setPesquisaEspecializada(null);
    setApoioLabels([]);
    setResultadosTodos(null);
    setPesquisaTodos(null);
    setFooterInfoTodos(null);

    if (!textoBasePreview && !tema.trim()) {
      setErro("Informe pelo menos um tema ou uma passagem bíblica.");
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
        passagem: textoBasePreview || tema.trim() || "Tema livre",
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
    setResultadosTodos(null);
    setPesquisaTodos(null);
    setFooterInfoTodos(null);
    setUsarPassagem(false);
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
          <div className="sgf-section-label-row">
            <span className="sgf-section-label">
              <span className="sgf-step-num">1</span> Passagem bíblica
              <em className="sgf-opcional"> (opcional)</em>
            </span>
            <label className="sgf-toggle">
              <input
                type="checkbox"
                checked={usarPassagem}
                onChange={(e) => {
                  setUsarPassagem(e.target.checked);
                  if (!e.target.checked) {
                    setLivro("");
                    setCapitulo("");
                    setVersiculos("");
                  } else {
                    setLivro("João");
                    setCapitulo("1");
                    setVersiculos("");
                  }
                }}
              />
              <span className="sgf-toggle-track" />
              <span className="sgf-toggle-label">
                {usarPassagem ? "Com passagem específica" : "Sem passagem — gerar pelo tema"}
              </span>
            </label>
          </div>

          {usarPassagem && (
            <div className="sgf-grid-3">
              <label className="sgf-field sgf-col-2">
                <span>Livro</span>
                <select value={livro} onChange={(e) => setLivro(e.target.value)}>
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
          )}

          {textoBasePreview && usarPassagem && (
            <div className="sgf-passagem-badge">
              <span className="sgf-passagem-badge-icon">📖</span>
              <strong>{textoBasePreview}</strong>
            </div>
          )}

          {!usarPassagem && (
            <div className="sgf-passagem-hint">
              Os agentes irão buscar passagens bíblicas relevantes com base no tema e contexto que você informar abaixo.
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

        {/* ── Botões ── */}
        <div className="sgf-actions">
          <button type="submit" className="sgf-submit" disabled={loading || loadingTodos || loadingEspecialistas || (!textoBasePreview && !tema.trim())}>
            {loading ? (
              <span className="sgf-submit-loading">
                <span className="sgf-spinner" />
                {LOADING_STAGES[loadingStage]}
              </span>
            ) : (
              <>Gerar {tipoLabel}</>
            )}
          </button>
          <button
            type="button"
            className="sgf-submit sgf-submit-all"
            disabled={loading || loadingTodos || loadingEspecialistas || (!textoBasePreview && !tema.trim())}
            onClick={handleGerarTodos}
          >
            {loadingTodos ? (
              <span className="sgf-submit-loading">
                <span className="sgf-spinner" />
                Gerando os 3 tipos em paralelo…
              </span>
            ) : (
              <>✦ Gerar os 3 Tipos</>
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
              {(textoBasePreview || tema.trim()) && (
                <span className="sgf-output-ref">{textoBasePreview || tema.trim()}</span>
              )}
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
            {renderSermonContent(saida, setBibleRef)}
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
          <SpecialistPanel results={pesquisaEspecializada} onBibleRef={setBibleRef} />
        )}
      </div>

      {/* ── Resultado: Gerar os 3 Tipos ── */}
      {loadingTodos && (
        <div className="at-loading-wrap" ref={todosRef}>
          <div className="at-loading-card">
            <span className="sgf-spinner" />
            <p className="at-loading-title">Gerando Sermão, Esboço e Estudo Bíblico…</p>
            <p className="at-loading-sub">Os 3 tipos e os especialistas estão sendo gerados em paralelo. Isso pode levar alguns instantes.</p>
            <div className="at-loading-agents">
              {TODOS_TIPOS.map((t) => (
                <span key={t.label} className="at-loading-agent-badge">{t.icon} {t.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      {resultadosTodos && footerInfoTodos && !loadingTodos && (
        <div ref={todosRef}>
          <AllTypesResult
            resultados={resultadosTodos}
            apoio={pesquisaTodos}
            footerInfo={footerInfoTodos}
            onNovo={handleNovo}
            onBibleRef={setBibleRef}
          />
        </div>
      )}

      {/* ── Modal de passagem bíblica ── */}
      {bibleRef && (
        <BiblePassageModal refText={bibleRef} onClose={() => setBibleRef(null)} />
      )}
    </div>
  );
}
