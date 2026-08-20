export interface FooterInfo {
  passagem: string;
  tipo: string;
  publico: import("./biblicalTypes").AudienceType;
  duracao: number;
  profundidade: string;
  pastor: string;
  igreja: string;
  data: string;
}

export interface SavedLibraryItem {
  id: string;
  savedAt: number;
  kind: "unico" | "tres";
  tipoLabel: string;
  title: string;
  content: string;
  allContents?: Array<{ label: string; content: string }>;
  footer: FooterInfo;
  support?: Array<{ label: string; icone?: string; content: string }>;
  incluirMordomia?: boolean;
}
