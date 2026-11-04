import type { CircuitJson } from "circuit-json"
import {
  DrawingViewer,
  type DrawingViewerProps,
} from "lib/components/DrawingViewer"
import { drawingViewerStyles } from "lib/components/drawing-viewer-styles"
import { type ReactElement, useEffect, useState } from "react"
import { renderToCircuitJson } from "../utils/render-to-circuit-json"

interface ExampleRenderResult {
  element: ReactElement
  circuitJson?: CircuitJson
  error?: string
}

export const DrawingExample = ({
  children,
  containerStyle,
}: {
  children: ReactElement
  containerStyle?: DrawingViewerProps["containerStyle"]
}) => {
  const [result, setResult] = useState<ExampleRenderResult | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderToCircuitJson(children).then(
      (circuitJson) => {
        if (!cancelled) setResult({ element: children, circuitJson })
      },
      (error: unknown) => {
        if (!cancelled) {
          setResult({
            element: children,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [children])

  const currentResult = result?.element === children ? result : null
  if (currentResult?.circuitJson) {
    return (
      <DrawingViewer
        circuitJson={currentResult.circuitJson}
        containerStyle={containerStyle}
      />
    )
  }

  return (
    <div style={{ ...drawingViewerStyles.container, ...containerStyle }}>
      {currentResult?.error !== undefined ? (
        <div role="alert" style={drawingViewerStyles.error}>
          {currentResult.error}
        </div>
      ) : (
        <div role="status" style={drawingViewerStyles.status}>
          Preparing drawing…
        </div>
      )}
    </div>
  )
}
