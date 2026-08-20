import { useState } from "react";
import type { SavedLibraryItem } from "@/domain/library.types";
import { deleteLibraryItem, loadLibrary } from "@/services/contentLibrary";

export function SavedLibraryPanel({
  items,
  onChange,
  onOpen,
}: {
  items: SavedLibraryItem[];
  onChange: (next: SavedLibraryItem[]) => void;
  onOpen: (item: SavedLibraryItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const list = items.length ? items : loadLibrary();

  if (!list.length && !open) {
    return (
      <button type="button" className="sgf-lib-open" onClick={() => setOpen(true)}>
        Guardados
      </button>
    );
  }

  return (
    <div className="sgf-lib">
      <button type="button" className="sgf-lib-open" onClick={() => setOpen((v) => !v)}>
        Guardados ({list.length})
      </button>
      {open && (
        <div className="sgf-lib-panel">
          {list.length === 0 ? (
            <p className="sgf-lib-empty">Nada guardado neste navegador ainda.</p>
          ) : (
            <ul className="sgf-lib-list">
              {list.map((item) => (
                <li key={item.id} className="sgf-lib-item">
                  <button type="button" className="sgf-lib-title" onClick={() => onOpen(item)}>
                    <strong>{item.title}</strong>
                    <span>
                      {item.tipoLabel} · {new Date(item.savedAt).toLocaleString("pt-BR")}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="sgf-lib-del"
                    onClick={() => {
                      if (!window.confirm("Excluir este material guardado?")) return;
                      onChange(deleteLibraryItem(item.id));
                    }}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
