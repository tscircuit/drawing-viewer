import type {
  DrawingOptions,
  DrawingPageOutput,
} from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson } from "circuit-json"
import { type CSSProperties, useEffect, useState } from "react"
import { renderDrawingPages } from "../utils/render-drawing-pages"
import { drawingViewerStyles } from "./drawing-viewer-styles"

export interface DrawingViewerProps {
  circuitJson: CircuitJson
  containerStyle?: CSSProperties
  className?: string
  drawingOptions?: DrawingOptions
}

interface DrawingRenderResult {
  circuitJson: CircuitJson
  pages?: DrawingPageOutput[]
  error?: string
}

export const DrawingViewer = ({
  circuitJson,
  containerStyle,
  className,
  drawingOptions,
}: DrawingViewerProps) => {
  const [renderResult, setRenderResult] = useState<DrawingRenderResult | null>(
    null,
  )
  const [selectedPageId, setSelectedPageId] = useState("")
  const [renderAttempt, setRenderAttempt] = useState(0)
  const drawingPages = circuitJson.filter(
    (element) => element.type === "drawing_page",
  )
  const hasPages = drawingPages.length > 0

  useEffect(() => {
    if (!hasPages) return
    let cancelled = false
    setRenderResult(null)
    void renderDrawingPages(circuitJson, drawingOptions).then(
      (pages) => {
        if (!cancelled) setRenderResult({ circuitJson, pages })
      },
      (error: unknown) => {
        if (!cancelled) {
          setRenderResult({
            circuitJson,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [circuitJson, hasPages, drawingOptions, renderAttempt])

  const currentResult =
    renderResult?.circuitJson === circuitJson ? renderResult : null
  const pages = currentResult?.pages ?? []
  const selectedPage =
    pages.find((page) => page.drawingPageId === selectedPageId) ?? pages[0]
  const pageTitle =
    drawingPages.find(
      (page) => page.drawing_page_id === selectedPage?.drawingPageId,
    )?.name ?? selectedPage?.drawingPageId

  return (
    <div
      className={className}
      style={{ ...drawingViewerStyles.container, ...containerStyle }}
    >
      {pages.length > 1 && selectedPage ? (
        <div style={drawingViewerStyles.controls}>
          <select
            aria-label="Drawing page"
            value={selectedPage.drawingPageId}
            onChange={(event) => setSelectedPageId(event.target.value)}
            style={drawingViewerStyles.selector}
          >
            {pages.map((page) => (
              <option key={page.drawingPageId} value={page.drawingPageId}>
                {drawingPages.find(
                  (record) => record.drawing_page_id === page.drawingPageId,
                )?.name ?? page.drawingPageId}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {!hasPages ? (
        <div role="status" style={drawingViewerStyles.status}>
          No engineering drawings in this circuit.
        </div>
      ) : currentResult?.error !== undefined ? (
        <div role="alert" style={drawingViewerStyles.error}>
          <strong>Unable to render engineering drawing</strong>
          <p>{currentResult.error}</p>
          <button
            type="button"
            style={drawingViewerStyles.retry}
            onClick={() => setRenderAttempt((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </div>
      ) : selectedPage ? (
        <div
          aria-label="Engineering drawing sheet"
          style={drawingViewerStyles.viewport}
        >
          <img
            alt={`Engineering drawing: ${pageTitle}`}
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(selectedPage.svg)}`}
            style={drawingViewerStyles.sheet}
          />
        </div>
      ) : (
        <div role="status" style={drawingViewerStyles.status}>
          Rendering engineering drawings…
        </div>
      )}
    </div>
  )
}
