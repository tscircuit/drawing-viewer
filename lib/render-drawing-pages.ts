import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson } from "circuit-json"

export interface RenderDrawingPagesOptions {
  drawingPageId?: string
}

export const renderDrawingPages = async (
  circuitJson: CircuitJson,
  options: RenderDrawingPagesOptions = {},
): Promise<DrawingPageOutput[]> => {
  const renderer = await import("./utils/render-drawing-pages")
  return renderer.renderDrawingPages(circuitJson, options)
}
