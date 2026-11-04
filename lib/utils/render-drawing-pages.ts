import type {
  DrawingOptions,
  DrawingPageOutput,
} from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson } from "circuit-json"
import { createDrawingSceneResolver } from "./create-drawing-scene-resolver"

export const renderDrawingPages = async (
  circuitJson: CircuitJson,
  options?: DrawingOptions,
): Promise<DrawingPageOutput[]> => {
  const drawing = await import("@tscircuit/circuit-json-to-drawing")
  if (options?.resolveScene) {
    return drawing.convertCircuitJsonToDrawingPages(circuitJson, options)
  }
  const [converter, poppygl] = await Promise.all([
    import("circuit-json-to-gltf"),
    import("poppygl"),
  ])
  return drawing.convertCircuitJsonToDrawingPages(circuitJson, {
    ...options,
    resolveScene: createDrawingSceneResolver(circuitJson, {
      converter,
      poppygl,
    }),
  })
}
