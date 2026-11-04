import type { CircuitJson, DrawingPartView } from "circuit-json"

export const selectDrawingGeometry = (
  circuitJson: CircuitJson,
  view: DrawingPartView,
): CircuitJson => {
  if (!view.source_group_id && !view.source_component_ids) return circuitJson

  const groupIds = new Set<string>(
    view.source_group_id ? [view.source_group_id] : [],
  )
  const groups = circuitJson.filter((e) => e.type === "source_group")
  // Expand descendants regardless of document order, including nested assemblies.
  let previousSize = -1
  while (previousSize !== groupIds.size) {
    previousSize = groupIds.size
    for (const group of groups) {
      if (
        group.parent_source_group_id &&
        groupIds.has(group.parent_source_group_id)
      ) {
        groupIds.add(group.source_group_id)
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
  const boardSubcircuitIds = new Set(
    groups
      .filter(
        (group) => groupIds.has(group.source_group_id) && group.is_subcircuit,
      )
      .map((group) => group.subcircuit_id)
      .filter((id): id is string => Boolean(id)),
  )

  // Keep placement and model context; filter the records that create geometry.
  return circuitJson.filter((element) => {
    switch (element.type) {
      case "cad_component":
      case "pcb_component":
        return componentIds.has(element.source_component_id)
      case "pcb_board":
        return Boolean(
          element.subcircuit_id &&
            boardSubcircuitIds.has(element.subcircuit_id),
        )
      case "pcb_panel":
        return false
      case "cad_cable":
        return (
          componentIds.has(element.from_source_component_id) &&
          componentIds.has(element.to_source_component_id)
        )
      default:
        return true
    }
  })
}
