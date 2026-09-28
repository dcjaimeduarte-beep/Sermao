import type { NewSavedLibraryItem, SavedLibraryItem } from "@/domain/library.types";

const KEY = "sermao-library-v1";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadLibrary(): SavedLibraryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLibraryItem[];
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const next = parsed.map((item) => {
      if (item?.id && item.savedAt) return item;
      changed = true;
      return {
        ...item,
        id: item?.id || newId(),
        savedAt: item?.savedAt || Date.now(),
      };
    });
    if (changed) localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function saveLibraryItem(item: NewSavedLibraryItem): SavedLibraryItem {
  const saved: SavedLibraryItem = {
    ...item,
    id: newId(),
    savedAt: Date.now(),
  };
  const next = [saved, ...loadLibrary()].slice(0, 80);
  localStorage.setItem(KEY, JSON.stringify(next));
  return saved;
}

export function deleteLibraryItem(id: string): SavedLibraryItem[] {
  const next = loadLibrary().filter((row) => row.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
