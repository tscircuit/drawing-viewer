import { expect, test } from "bun:test"
import { DrawingViewer } from "@tscircuit/drawing-viewer"
import { assembly, RootCircuit } from "@tscircuit/core"
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

test("isolates each board's holes, plated holes, and cutouts in a two-board drawing", async () => {
  for (const selectedBoard of ["A", "B"]) {
    const renderBoard = async (includeOtherBoard: boolean) => {
      const circuit = new RootCircuit()
      circuit.add(
        <assembly.device name="device">
          {(includeOtherBoard ? ["A", "B"] : [selectedBoard]).map((name) => (
            <board
              key={name}
              name={name}
              width={30}
              height={20}
              pcbX={0}
              pcbY={0}
            >
              <hole diameter={2} pcbX={name === "A" ? -5 : 5} pcbY={0} />
              <platedhole
                shape="circle"
                holeDiameter={2}
                outerDiameter={3}
                pcbX={name === "A" ? -5 : 5}
                pcbY={-5}
              />
              <cutout
                shape="rect"
                width={3}
                height={2}
                pcbX={name === "A" ? -5 : 5}
                pcbY={5}
              />
            </board>
          ))}
          <assembly.drawing.page name="inspection" size="iso_a4">
            <assembly.drawing.partview
              partRef={`.${selectedBoard}`}
              direction="z+"
              width={60}
              height={40}
            />
          </assembly.drawing.page>
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const circuitJson = circuit.getCircuitJson()
      // The single-board reference bypasses selection, retaining all its features.
      if (!includeOtherBoard) {
        for (const element of circuitJson) {
          if (element.type !== "drawing_part_view") continue
          delete element.source_group_id
          delete element.source_component_ids
        }
      }
      return renderDrawingPages(circuitJson)
    }

    // Both boards occupy the same XY area, so leaked geometry changes the mesh.
    const isolated = await renderBoard(false)
    const combined = await renderBoard(true)
    expect(isolated).toHaveLength(1)
    expect(isolated[0].svg).toContain("data:image/png;base64,")
    expect(combined[0].svg).toBe(isolated[0].svg)
  }
})
