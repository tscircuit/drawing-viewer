import { expect, test } from "bun:test"
import { assembly, RootCircuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { DrawingViewer } from "../lib/components/DrawingViewer"

test("switches drawings, refits the viewport, and keeps selection valid as pages change", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <assembly.device name="device">
      <board name="carrier" width={10} height={8} />
      {[
        { name: "overview", displayName: "Carrier overview" },
        { name: "section" },
        { name: "unnamed" },
      ].map(({ name, displayName }) => (
        <assembly.drawing.page
          key={name}
          name={name}
          displayName={displayName}
          size="iso_a4"
        >
          <assembly.drawing.partview
            partRef=".carrier"
            direction={name === "overview" ? "z+" : "y+"}
            width={20}
            height={15}
          />
        </assembly.drawing.page>
      ))}
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const pages = circuitJson.filter((element) => element.type === "drawing_page")
  delete pages[2].name

  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" })
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    ResizeObserver: globalThis.ResizeObserver,
    IS_REACT_ACT_ENVIRONMENT: Reflect.get(
      globalThis,
      "IS_REACT_ACT_ENVIRONMENT",
    ),
  }
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
    ResizeObserver: class {
      constructor(private callback: () => void) {}
      observe() {
        this.callback()
      }
      disconnect() {}
    },
  })
  Object.defineProperties(dom.window.HTMLElement.prototype, {
    clientWidth: { get: () => 800 },
    clientHeight: { get: () => 600 },
    offsetWidth: { get: () => 800 },
    offsetHeight: { get: () => 600 },
  })

  const container = document.getElementById("root")!
  const root = createRoot(container)
  const render = async (json: CircuitJson) => {
    await act(async () => root.render(<DrawingViewer circuitJson={json} />))
    const deadline = Date.now() + 5000
    while (container.querySelector('[role="status"]') && json.length) {
      if (Date.now() > deadline) throw new Error("Drawing rendering timed out")
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })
    }
    expect(container.querySelector('[role="alert"]')).toBeNull()
  }
  const selectPage = async (pageId: string) => {
    const select = container.querySelector("select")!
    await act(async () => {
      select.value = pageId
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }))
    })
  }
  const transform = () =>
    container
      .querySelector('[aria-label="Engineering drawing viewport"] > div')
      ?.getAttribute("style")

  try {
    await render(circuitJson)
    expect(container.querySelectorAll("img")).toHaveLength(1)
    expect(container.querySelector("img")?.alt).toBe(
      "Engineering drawing: Carrier overview",
    )
    expect(container.querySelector("select")?.value).toBe(
      pages[0].drawing_page_id,
    )
    expect(
      [...container.querySelectorAll("option")].map((o) => o.textContent),
    ).toEqual(["Carrier overview", "section", pages[2].drawing_page_id])

    const fittedTransform = transform()
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!
        .click()
    })
    expect(transform()).not.toBe(fittedTransform)

    await selectPage(pages[1].drawing_page_id)
    expect(container.querySelectorAll("img")).toHaveLength(1)
    expect(container.querySelector("img")?.alt).toBe(
      "Engineering drawing: section",
    )
    expect(transform()).toBe(fittedTransform)

    await render([...circuitJson])
    expect(container.querySelector("select")?.value).toBe(
      pages[1].drawing_page_id,
    )
    await selectPage(pages[2].drawing_page_id)
    expect(container.querySelector("img")?.alt).toBe(
      `Engineering drawing: ${pages[2].drawing_page_id}`,
    )

    const firstPageOnly = circuitJson.filter(
      (element) =>
        !("drawing_page_id" in element) ||
        element.drawing_page_id === pages[0].drawing_page_id,
    )
    await render(firstPageOnly)
    expect(container.querySelector("select")).toBeNull()
    expect(container.querySelectorAll("img")).toHaveLength(1)
    expect(container.querySelector("img")?.alt).toBe(
      "Engineering drawing: Carrier overview",
    )

    await render(circuitJson)
    expect(container.querySelector("select")?.value).toBe(
      pages[0].drawing_page_id,
    )
    await render([])
    expect(container.querySelector("select")).toBeNull()
    expect(container.querySelector("img")).toBeNull()
    expect(container.textContent).toContain("No engineering drawings")
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previousGlobals)
    dom.window.close()
  }
}, 20000)
