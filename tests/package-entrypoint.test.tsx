import { expect, test } from "bun:test"
import { DrawingViewer } from "@tscircuit/drawing-viewer"
import { renderToStaticMarkup } from "react-dom/server"

test("the public source entrypoint renders without browser globals and accepts host sizing", () => {
  const html = renderToStaticMarkup(
    <DrawingViewer
      className="embedded-drawing-viewer"
      containerStyle={{ width: 320, height: 200 }}
    />,
  )

  expect(html).toContain('class="embedded-drawing-viewer"')
  expect(html).toContain("width:320px;height:200px")
})
