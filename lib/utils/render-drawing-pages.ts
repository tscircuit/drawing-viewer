import { convertCircuitJsonToDrawingPages } from "@tscircuit/circuit-json-to-drawing"
import type { CircuitJson, DrawingPartView } from "circuit-json"
import {
  convertCircuitJsonTo3D,
  convertSceneToGLTF,
} from "circuit-json-to-gltf"
import { bufferFromDataURI, createSceneFromGLTF } from "poppygl"

export const renderDrawingPages = (circuitJson: CircuitJson) =>
  convertCircuitJsonToDrawingPages(circuitJson, {
    resolveScene: async (view) => {
      const selected = selectDrawingGeometry(circuitJson, view)
      const board = selected.find((element) => element.type === "pcb_board")
      const model = await convertCircuitJsonTo3D(selected, {
        renderBoardTextures: false,
        boardThickness: board?.thickness,
      })
      const gltf = await convertSceneToGLTF(model, { binary: false })
      if (
        gltf instanceof ArrayBuffer ||
        !("buffers" in gltf) ||
        !Array.isArray(gltf.buffers)
      ) {
        throw new Error("Drawing geometry converter returned invalid glTF")
      }
      // Keep the exporter frame used by core's resolved dimension endpoints.
      return createSceneFromGLTF(gltf, {
        buffers: gltf.buffers.map((buffer: { uri: string }) =>
          bufferFromDataURI(buffer.uri),
        ),
        images: [],
      })
    },
  })

const selectDrawingGeometry = (
  circuitJson: CircuitJson,
  view: DrawingPartView,
): CircuitJson => {
  if (!view.source_group_id && !view.source_component_ids) return circuitJson

  const groupIds = new Set<string>(
    view.source_group_id ? [view.source_group_id] : [],
  )
  const groups = circuitJson.filter((e) => e.type === "source_group")
  const boardSubcircuitIds = new Set<string>()
  // Expand descendants regardless of document order, including nested assemblies.
  let previousSize = -1
  while (previousSize !== groupIds.size + boardSubcircuitIds.size) {
    previousSize = groupIds.size + boardSubcircuitIds.size
    for (const group of groups) {
      if (
        groupIds.has(group.source_group_id) ||
        (group.parent_source_group_id &&
          groupIds.has(group.parent_source_group_id)) ||
        (group.parent_subcircuit_id &&
          boardSubcircuitIds.has(group.parent_subcircuit_id))
      ) {
        groupIds.add(group.source_group_id)
        if (group.is_subcircuit && group.subcircuit_id) {
          boardSubcircuitIds.add(group.subcircuit_id)
        }
      }
    }
  }
  const componentIds = new Set(view.source_component_ids ?? [])
  for (const element of circuitJson) {
    if (
      "source_component_id" in element &&
      element.source_component_id &&
      "source_group_id" in element &&
      element.source_group_id &&
      groupIds.has(element.source_group_id)
    ) {
      componentIds.add(element.source_component_id)
    }
  }
  const boardIds = new Set<string>()
  const pcbComponentIds = new Set<string>()
  const pcbGroupIds = new Set<string>()
  for (const element of circuitJson) {
    if (
      element.type === "pcb_board" &&
      element.subcircuit_id &&
      boardSubcircuitIds.has(element.subcircuit_id)
    ) {
      boardIds.add(element.pcb_board_id)
    }
    if (
      element.type === "pcb_component" &&
      componentIds.has(element.source_component_id)
    ) {
      pcbComponentIds.add(element.pcb_component_id)
    }
    if (element.type === "pcb_group" && groupIds.has(element.source_group_id)) {
      pcbGroupIds.add(element.pcb_group_id)
    }
  }

  // Keep placement and model context; require ownership for scoped PCB geometry.
  return circuitJson.filter((element) => {
    switch (element.type) {
      case "cad_component":
      case "pcb_component":
        return componentIds.has(element.source_component_id)
      case "pcb_board":
        return boardIds.has(element.pcb_board_id)
      case "pcb_panel":
        return false
      case "pcb_group":
        return true
      case "cad_cable":
        return (
          componentIds.has(element.from_source_component_id) &&
          componentIds.has(element.to_source_component_id)
        )
      default:
        if (!element.type.startsWith("pcb_")) return true
        // Prefer the most specific owner; a foreign component cannot fall back
        // to a selected board or subcircuit shared by its siblings.
        if ("pcb_component_id" in element && element.pcb_component_id)
          return pcbComponentIds.has(element.pcb_component_id)
        if ("pcb_board_id" in element && element.pcb_board_id)
          return boardIds.has(element.pcb_board_id)
        if ("pcb_group_id" in element && element.pcb_group_id)
          return pcbGroupIds.has(element.pcb_group_id)
        if ("subcircuit_id" in element && element.subcircuit_id)
          return boardSubcircuitIds.has(element.subcircuit_id)
        return false
    }
  })
}
