import type { ContentType, GeneratedContent } from "./biblicalTypes";

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

export interface SavedSupportNote {
  agentId: string;
  agentName: string;
  content: string;
  label: string;
  icone: string;
}

export interface SavedLibraryItem {
  id: string;
  savedAt: number;
  kind: ContentType | "todos";
  title: string;
  passagem: string;
  tipoLabel: string;
  footerInfo: FooterInfo;
  content?: string;
  pesquisa?: SavedSupportNote[];
  resultadosTodos?: GeneratedContent[];
  pesquisaTodos?: SavedSupportNote[];
}

export type NewSavedLibraryItem = Omit<SavedLibraryItem, "id" | "savedAt">;
