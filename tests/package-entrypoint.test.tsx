import { expect, test } from "bun:test"
import { DrawingViewer } from "@tscircuit/drawing-viewer"
import { RootCircuit } from "@tscircuit/core"
import { renderToStaticMarkup } from "react-dom/server"
import { renderDrawingPages } from "../lib/utils/render-drawing-pages"
import PcbDimensions from "../pages/fixtures/pcb-dimensions"

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

test("renders the docs' JSX example with board and hole dimensions", async () => {
  const circuit = new RootCircuit()
  circuit.add(<PcbDimensions />)
  await circuit.renderUntilSettled()
  const pages = await renderDrawingPages(circuit.getCircuitJson())

  expect(pages).toHaveLength(1)
  expect(pages[0].svg).toContain("data:image/png;base64,")
  expect(pages[0].svg).toContain("PCB HOLE SPACING AND EDGE OFFSET")
  for (const label of ["30 mm", "14 mm", "8 mm", "50 mm"]) {
    expect(pages[0].svg).toContain(label)
  }
})
