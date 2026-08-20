import type { SavedLibraryItem } from "@/domain/library.types";

const KEY = "sermao-library-v1";

export function loadLibrary(): SavedLibraryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLibraryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLibraryItem(item: SavedLibraryItem): SavedLibraryItem[] {
  const next = [item, ...loadLibrary()].slice(0, 80);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteLibraryItem(id: string): SavedLibraryItem[] {
  const next = loadLibrary().filter((row) => row.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
