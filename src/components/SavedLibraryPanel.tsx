import type { SavedLibraryItem } from "@/domain/library.types";

export function SavedLibraryPanel({
  items,
  activeId,
  onOpen,
  onDelete,
}: {
  items: SavedLibraryItem[];
  activeId: string | null;
  onOpen: (item: SavedLibraryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="sgf-library" aria-label="Guardados">
      <div className="sgf-library-head">
        <span className="sgf-library-title">Guardados</span>
        <span className="sgf-library-count">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="sgf-library-empty">Nada guardado neste navegador ainda.</p>
      ) : (
        <ul className="sgf-library-list">
          {items.map((item) => (
            <li key={item.id} className={`sgf-library-item${item.id === activeId ? " is-active" : ""}`}>
              <button type="button" className="sgf-library-open" onClick={() => onOpen(item)}>
                <span className="sgf-library-kind">{item.tipoLabel}</span>
                <span className="sgf-library-item-title">{item.title}</span>
                <span className="sgf-library-item-date">
                  {new Date(item.savedAt).toLocaleString("pt-BR")}
                </span>
              </button>
              <button type="button" className="sgf-library-delete" onClick={() => onDelete(item.id)}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
