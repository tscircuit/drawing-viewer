import { expect, test } from "bun:test"
import type { CircuitJson, DrawingPartView } from "circuit-json"
import { selectDrawingGeometry } from "../lib/utils/render-drawing-pages"

test("scoped part views exclude pcb groups outside the selected source group", () => {
  const circuitJson = [
    {
      type: "source_group",
      source_group_id: "selected_source_group",
      name: "selected",
    },
    {
      type: "source_group",
      source_group_id: "foreign_source_group",
      name: "foreign",
    },
    {
      type: "pcb_board",
      pcb_board_id: "board",
      subcircuit_id: "selected_subcircuit",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
    },
    {
      type: "pcb_group",
      pcb_group_id: "selected_pcb_group",
      source_group_id: "selected_source_group",
      width: 5,
      height: 5,
      center: { x: 0, y: 0 },
      pcb_component_ids: [],
    },
    {
      type: "pcb_group",
      pcb_group_id: "foreign_pcb_group",
      source_group_id: "foreign_source_group",
      width: 5,
      height: 5,
      center: { x: 0, y: 0 },
      pcb_component_ids: [],
    },
  ] as CircuitJson
  const view = {
    type: "drawing_part_view",
    drawing_part_view_id: "view",
    drawing_page_id: "page",
    source_group_id: "selected_source_group",
    direction: "z_positive",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
  } as DrawingPartView

  const selected = selectDrawingGeometry(circuitJson, view)
  expect(
    selected
      .filter((element) => element.type === "pcb_group")
      .map((element) => element.pcb_group_id),
  ).toEqual(["selected_pcb_group"])
})
