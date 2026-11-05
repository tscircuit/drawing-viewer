import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson } from "circuit-json"
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { compose, scale, toCSS, translate } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"

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
        draggable={false}
      />
    ))
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: 16,
        background: "#f6f7f8",
        ...containerStyle,
      }}
    >
      {currentResult?.pages?.length ? (
        <DrawingViewport>{content}</DrawingViewport>
      ) : (
        content
      )}
    </div>
  )
}

const DrawingViewport = ({ children }: { children: ReactNode }) => {
  const pagesRef = useRef<HTMLDivElement>(null)
  const {
    ref: viewportRef,
    transform,
    setTransform,
  } = useMouseMatrixTransform({ shouldDrag: shouldDragDrawing })

  const fitDrawing = useCallback(() => {
    const viewport: HTMLDivElement | null = viewportRef.current
    const pages = pagesRef.current
    if (
      !viewport?.clientWidth ||
      !viewport.clientHeight ||
      !pages?.offsetWidth ||
      !pages.offsetHeight
    ) {
      return
    }
    const factor = Math.min(
      viewport.clientWidth / pages.offsetWidth,
      viewport.clientHeight / pages.offsetHeight,
    )
    setTransform(
      compose(
        translate(
          (viewport.clientWidth - pages.offsetWidth * factor) / 2,
          (viewport.clientHeight - pages.offsetHeight * factor) / 2,
        ),
        scale(factor),
      ),
    )
  }, [setTransform, viewportRef])

  useEffect(() => {
    const observer = new ResizeObserver(fitDrawing)
    observer.observe(viewportRef.current)
    if (pagesRef.current) observer.observe(pagesRef.current)
    return () => observer.disconnect()
  }, [fitDrawing, viewportRef])

  const zoom = (factor: number) => {
    const viewport: HTMLDivElement | null = viewportRef.current
    if (!viewport) return
    setTransform(
      compose(
        scale(
          factor,
          factor,
          viewport.clientWidth / 2,
          viewport.clientHeight / 2,
        ),
        transform,
      ),
    )
  }

  return (
    <>
      <div
        ref={viewportRef}
        role="region"
        aria-label="Engineering drawing viewport"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <div
          ref={pagesRef}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 16,
            transform: toCSS(transform),
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      </div>
      <div
        role="group"
        aria-label="Drawing zoom"
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          display: "flex",
          padding: 3,
          border: "1px solid #d6d9dd",
          borderRadius: 6,
          background: "white",
          boxShadow: "0 1px 4px #00000014",
          font: "13px system-ui, sans-serif",
        }}
      >
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoom(1 / 1.2)}
          style={zoomButtonStyle}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Fit drawing"
          title="Fit drawing"
          onClick={fitDrawing}
          style={zoomButtonStyle}
        >
          Fit
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoom(1.2)}
          style={zoomButtonStyle}
        >
          +
        </button>
      </div>
    </>
  )
}

const shouldDragDrawing = (event: MouseEvent | TouchEvent | WheelEvent) =>
  event.type !== "mousedown" ||
  !("button" in event) ||
  (event.button === 0 && !event.ctrlKey)

const zoomButtonStyle: CSSProperties = {
  minWidth: 32,
  height: 32,
  padding: "0 8px",
  border: 0,
  borderRadius: 3,
  background: "transparent",
  color: "#334155",
  cursor: "pointer",
  font: "inherit",
}
