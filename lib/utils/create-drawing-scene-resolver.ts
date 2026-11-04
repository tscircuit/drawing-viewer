import type { CircuitJson, DrawingPartView } from "circuit-json"
import type { GLTFScene } from "poppygl"
import { selectDrawingGeometry } from "./select-drawing-geometry"

type DrawingGeometrySelectionKey = string
type GltfConverter = typeof import("circuit-json-to-gltf")
type Poppygl = typeof import("poppygl")

interface DrawingSceneContext {
  converter: Pick<
    GltfConverter,
    "convertCircuitJsonTo3D" | "convertSceneToGLTF"
  >
  poppygl: Pick<Poppygl, "createSceneFromGLTF" | "bufferFromDataURI">
}

const renderDrawingScene = async (
  { circuitJson, view }: { circuitJson: CircuitJson; view: DrawingPartView },
  { converter, poppygl }: DrawingSceneContext,
): Promise<GLTFScene> => {
  const selected = selectDrawingGeometry(circuitJson, view)
  if (
    !selected.some((element) =>
      ["cad_component", "pcb_board", "cad_cable"].includes(element.type),
    )
  ) {
    throw new Error(
      `No geometry selected for drawing view ${view.drawing_part_view_id}`,
    )
  }
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const model = await converter.convertCircuitJsonTo3D(selected, {
    renderBoardTextures: false,
    boardThickness: board?.thickness,
  })
  const gltf = await converter.convertSceneToGLTF(model, { binary: false })
  if (
    gltf instanceof ArrayBuffer ||
    !("buffers" in gltf) ||
    !Array.isArray(gltf.buffers)
  ) {
    throw new Error("Drawing geometry converter returned invalid glTF")
  }
  const scene = poppygl.createSceneFromGLTF(gltf, {
    buffers: gltf.buffers.map((buffer: { uri: string }) =>
      poppygl.bufferFromDataURI(buffer.uri),
    ),
    images: [],
  })
  // Core's resolved dimension endpoints use this exporter frame. Keep the
  // geometry in that frame, as in the docs' generate-dimension-previews script.
  return scene
}

export const createDrawingSceneResolver = (
  circuitJson: CircuitJson,
  context: DrawingSceneContext,
) => {
  const scenes = new Map<DrawingGeometrySelectionKey, Promise<GLTFScene>>()
  return (view: DrawingPartView): Promise<GLTFScene> => {
    const selectionKey: DrawingGeometrySelectionKey = JSON.stringify([
      view.source_group_id,
      view.source_component_ids?.slice().sort(),
    ])
    let scene = scenes.get(selectionKey)
    if (!scene) {
      scene = renderDrawingScene({ circuitJson, view }, context)
      scenes.set(selectionKey, scene)
    }
    return scene
  }
}
