import { expect, test } from "bun:test"
import { DrawingViewer } from "@tscircuit/drawing-viewer"
import { RootCircuit } from "@tscircuit/core"
import { renderToStaticMarkup } from "react-dom/server"
import { renderDrawingPages } from "../lib/utils/render-drawing-pages"
import CarrierBoardInspection from "../pages/fixtures/carrier-board-inspection"

test("the public source entrypoint renders without browser globals and accepts host sizing", () => {
  const html = renderToStaticMarkup(
    <DrawingViewer
      circuitJson={[]}
      className="embedded-drawing-viewer"
      containerStyle={{ width: 320, height: 200 }}
    />,
  )

  expect(html).toContain('class="embedded-drawing-viewer"')
  expect(html).toContain("width:320px;height:200px")
})

test("renders the carrier inspection sheet with plan, isometric, and dimension annotations", async () => {
  const circuit = new RootCircuit()
  circuit.add(<CarrierBoardInspection />)
  await circuit.renderUntilSettled()
  const pages = await renderDrawingPages(circuit.getCircuitJson())

  expect(pages).toHaveLength(1)
  expect(pages[0].svg.match(/data:image\/png;base64,/g)).toHaveLength(2)
  for (const label of [
    "PLAN",
    "ISOMETRIC",
    "CONTROLLER CARRIER - INSPECTION",
    "CTRL-CARRIER-001",
    "80 mm",
    "50 mm",
    "70 mm",
  ]) {
    expect(pages[0].svg).toContain(label)
  }
})
