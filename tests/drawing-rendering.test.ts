import { expect, test } from "bun:test"
import * as converter from "circuit-json-to-gltf"
import * as poppygl from "poppygl"
import type { CircuitJson, DrawingPartView } from "circuit-json"
import { bracketCircuit } from "./fixtures/bracket-circuit"
import { createDrawingSceneResolver } from "../lib/utils/create-drawing-scene-resolver"
import { selectDrawingGeometry } from "../lib/utils/select-drawing-geometry"
import { renderDrawingPages } from "../lib/utils/render-drawing-pages"

const firstView = bracketCircuit.find(
  (element) => element.type === "drawing_part_view",
)! as DrawingPartView

test("drawing selections expand nested assemblies and omit unrelated geometry", () => {
  const circuit = [
    ...bracketCircuit,
    {
      type: "source_group",
      source_group_id: "nested",
      parent_source_group_id: "assembly",
    },
    {
      type: "source_component",
      source_component_id: "nested_part",
      source_group_id: "nested",
    },
    {
      type: "cad_component",
      cad_component_id: "nested_model",
      source_component_id: "nested_part",
    },
    {
      type: "cad_component",
      cad_component_id: "other_model",
      source_component_id: "other_part",
    },
    { type: "pcb_board", pcb_board_id: "unrelated_board" },
  ] as CircuitJson
  const before = JSON.stringify(circuit)
  const group = selectDrawingGeometry(circuit, {
    ...firstView,
    source_component_ids: undefined,
    source_group_id: "assembly",
  })
  expect(
    group
      .filter((element) => element.type === "cad_component")
      .map((element) => element.cad_component_id),
  ).toEqual(["bracket_model", "nested_model"])
  expect(group.some((element) => element.type === "pcb_board")).toBe(false)
  const part = selectDrawingGeometry(circuit, firstView)
  expect(
    part
      .filter((element) => element.type === "cad_component")
      .map((element) => element.cad_component_id),
  ).toEqual(["bracket_model"])
  expect(JSON.stringify(circuit)).toBe(before)
})

test("real model conversion preserves the docs' exporter frame and caches repeated part selections", async () => {
  const resolveScene = createDrawingSceneResolver(bracketCircuit, {
    converter,
    poppygl,
  })
  const first = resolveScene(firstView)
  expect(resolveScene({ ...firstView, direction: "x_positive" })).toBe(first)
  const scene = await first
  const bounds = poppygl.computeWorldAABB(scene.drawCalls)
  // Preserve the glTF frame used to resolve the annotations in the docs.
  expect(bounds.min.map((n) => Math.round(n))).toEqual([-24, 0, 0])
  expect(bounds.max.map((n) => Math.round(n))).toEqual([0, 12, 16])
  await expect(
    resolveScene({ ...firstView, source_component_ids: ["missing"] }),
  ).rejects.toThrow("No geometry selected")
})

test("drawing exporter renders multiple real model views, dimensions and a section", async () => {
  const before = JSON.stringify(bracketCircuit)
  const pages = await renderDrawingPages(bracketCircuit, {
    pixelsPerMm: 1,
    supersampling: 1,
  })
  expect(pages.map((page) => page.drawingPageId)).toEqual([
    "overview",
    "section",
  ])
  expect(pages[0].svg).toContain("data:image/png;base64,")
  expect(pages[0].svg).toContain("24 mm")
  expect(pages[1].svg).toContain("Section A–A")
  expect(pages[0].svg).not.toBe(pages[1].svg)
  expect(JSON.stringify(bracketCircuit)).toBe(before)
})
