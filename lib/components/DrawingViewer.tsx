import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson } from "circuit-json"
import { type CSSProperties, type ReactNode, useEffect, useState } from "react"

export interface DrawingViewerProps {
  circuitJson: CircuitJson
  containerStyle?: CSSProperties
  className?: string
}

export const DrawingViewer = ({
  circuitJson,
  containerStyle,
  className,
}: DrawingViewerProps) => {
  const [result, setResult] = useState<{
    circuitJson: CircuitJson
    pages?: DrawingPageOutput[]
    error?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    setResult(null)
    void import("../utils/render-drawing-pages")
      .then(({ renderDrawingPages }) => renderDrawingPages(circuitJson))
      .then(
        (pages) => {
          if (!cancelled) setResult({ circuitJson, pages })
        },
        (error: unknown) => {
          if (!cancelled) {
            setResult({
              circuitJson,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        },
      )
    return () => {
      cancelled = true
    }
  }, [circuitJson])

  const currentResult = result?.circuitJson === circuitJson ? result : null
  const drawingPages = circuitJson.filter(
    (element) => element.type === "drawing_page",
  )

  let content: ReactNode
  if (currentResult?.error !== undefined) {
    content = <p role="alert">{currentResult.error}</p>
  } else if (!drawingPages.length) {
    content = <p role="status">No engineering drawings in this circuit.</p>
  } else if (!currentResult?.pages) {
    content = <p role="status">Rendering engineering drawings…</p>
  } else {
    content = currentResult.pages.map((page) => (
      <img
        key={page.drawingPageId}
        alt={`Engineering drawing: ${drawingPages.find((record) => record.drawing_page_id === page.drawingPageId)?.name ?? page.drawingPageId}`}
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(page.svg)}`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          background: "white",
        }}
      />
    ))
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
        padding: 16,
        background: "#f6f7f8",
        ...containerStyle,
      }}
    >
      {content}
    </div>
  )
}
