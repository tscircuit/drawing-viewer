import type { DrawingPage } from "circuit-json"

interface DrawingPageSelectorProps {
  pages: DrawingPage[]
  selectedPageId: string | undefined
  onSelectPage: (drawingPageId: string) => void
}

export const DrawingPageSelector = ({
  pages,
  selectedPageId,
  onSelectPage,
}: DrawingPageSelectorProps) => {
  if (pages.length <= 1) return null

  return (
    <label
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        maxWidth: "calc(100% - 32px)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        border: "1px solid #d6d9dd",
        borderRadius: 6,
        background: "white",
        boxShadow: "0 1px 4px #00000014",
        color: "#64748b",
        font: "13px system-ui, sans-serif",
      }}
    >
      Drawing:
      <select
        aria-label="Drawing page"
        value={selectedPageId}
        onChange={(event) => onSelectPage(event.target.value)}
        style={{
          minWidth: 0,
          maxWidth: 220,
          border: 0,
          background: "transparent",
          color: "#334155",
          cursor: "pointer",
          font: "inherit",
          textOverflow: "ellipsis",
        }}
      >
        {pages.map((page) => (
          <option key={page.drawing_page_id} value={page.drawing_page_id}>
            {page.display_name ?? page.name ?? page.drawing_page_id}
          </option>
        ))}
      </select>
    </label>
  )
}
