import { expect, test } from "bun:test"
import { Buffer } from "node:buffer"
import { decode } from "fast-png"
import type { CircuitJson } from "circuit-json"
import { createElement } from "react"
import { applyToPoint, compose, scale, translate } from "transformation-matrix"
import { renderDrawingPages } from "../lib/utils/render-drawing-pages"
import CadDimensions from "../pages/fixtures/cad-dimensions"
import PcbDimensions from "../pages/fixtures/pcb-dimensions"
import { renderToCircuitJson } from "../pages/utils/render-to-circuit-json"

const countDarkPixelsNear = ({
  png,
  centerX,
  centerY,
  radius,
}: {
  png: ReturnType<typeof decode>
  centerX: number
  centerY: number
  radius: number
}) => {
  let darkPixels = 0
  for (
    let y = Math.max(0, Math.floor(centerY - radius));
    y <= Math.min(png.height - 1, Math.ceil(centerY + radius));
    y++
  ) {
    for (
      let x = Math.max(0, Math.floor(centerX - radius));
      x <= Math.min(png.width - 1, Math.ceil(centerX + radius));
      x++
    ) {
      if (Math.hypot(x - centerX, y - centerY) > radius) continue
      const offset = (y * png.width + x) * png.channels
      if (
        png.data[offset] < 100 &&
        png.data[offset + 1] < 100 &&
        png.data[offset + 2] < 100
      )
        darkPixels++
    }
  }
  return darkPixels
}

const assertDocumentationDrawing = async ({
  circuitJson,
  expectedLabels,
  title,
}: {
  circuitJson: CircuitJson
  expectedLabels: string[]
  title: string
}) => {
  const pixelsPerMm = 4
  const pages = await renderDrawingPages(circuitJson, {
    pixelsPerMm,
    supersampling: 1,
  })
  expect(pages).toHaveLength(1)
  for (const label of expectedLabels) expect(pages[0].svg).toContain(label)
  expect(pages[0].svg).toContain(title)

  const view = circuitJson.find(
    (element) => element.type === "drawing_part_view",
  )!
  const dimension = circuitJson.find(
    (element) => element.type === "drawing_dimension_line",
  )!
  if (
    view.type !== "drawing_part_view" ||
    dimension.type !== "drawing_dimension_line" ||
    !dimension.edge_ref_start
  ) {
    throw new Error(
      "The docs example must include a dimension with a witness point",
    )
  }
  const raster = pages[0].svg.match(/href="data:image\/png;base64,([^"]+)"/)
  if (!raster)
    throw new Error("The drawing must contain rendered model geometry")
  const png = decode(Buffer.from(raster[1], "base64"))
  const paperToRasterTransform = compose(
    scale(pixelsPerMm, -pixelsPerMm),
    translate(view.width / 2 - view.center.x, -view.height / 2 - view.center.y),
  )
  const witness = applyToPoint(paperToRasterTransform, dimension.edge_ref_start)
  // H1 is a 3mm hole. Its raster outline must be at the core-resolved witness,
  // which catches accidental extra rotations/reflections of the exported scene.
  expect(
    countDarkPixelsNear({
      png,
      centerX: witness.x,
      centerY: witness.y,
      radius: 14,
    }),
  ).toBeGreaterThan(20)
}

test("the PCB docs example renders all dimensions at their measured hole positions", async () => {
  await assertDocumentationDrawing({
    circuitJson: await renderToCircuitJson(createElement(PcbDimensions)),
    expectedLabels: ["30 mm", "14 mm", "8 mm", "50 mm"],
    title: "PCB HOLE SPACING AND EDGE OFFSET",
  })
})

test("the named CAD outline docs example renders native geometry and bore dimensions", async () => {
  await assertDocumentationDrawing({
    circuitJson: await renderToCircuitJson(createElement(CadDimensions)),
    expectedLabels: ["3 mm", "30 mm", "8 mm", "7 mm"],
    title: "NAMED CAD HOLES AND OUTLINE",
  })
})
