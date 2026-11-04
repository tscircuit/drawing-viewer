import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import { expect, mock, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { bracketCircuit } from "./bracket-circuit"

const requests: {
  resolve: (pages: DrawingPageOutput[]) => void
  reject: (error: Error) => void
}[] = []
mock.module("../../lib/utils/render-drawing-pages", () => ({
  renderDrawingPages: () =>
    new Promise<DrawingPageOutput[]>((resolve, reject) => {
      requests.push({ resolve, reject })
    }),
}))

const pages: DrawingPageOutput[] = [
  {
    drawingPageId: "overview",
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Overview</text></svg>',
  },
  {
    drawingPageId: "section",
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Section</text></svg>',
  },
]

test("drawing sheets render, switch, retry and reconcile new circuit inputs", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://viewer.example/",
  })
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "MutationObserver",
  ]) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: Reflect.get(dom.window, key),
    })
  }
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  })
  const { DrawingViewer } = await import("../../lib")
  const root = createRoot(document.getElementById("root")!)
  const render = (circuitJson: CircuitJson) => (
    <DrawingViewer circuitJson={circuitJson} />
  )
  try {
    await act(async () => root.render(render([])))
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No engineering drawings",
    )
    expect(requests).toHaveLength(0)
    await act(async () => root.render(render(bracketCircuit)))
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "Rendering engineering drawings",
    )
    await act(async () => requests[0].reject(new Error("Model unavailable")))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Model unavailable",
    )
    await act(async () =>
      document.querySelector<HTMLButtonElement>("button")!.click(),
    )
    await act(async () => requests[1].resolve(pages))
    expect(document.querySelector("strong")).toBeNull()
    expect(document.querySelector("img")?.alt).toBe(
      "Engineering drawing: Bracket overview",
    )
    const pageSelect = document.querySelector<HTMLSelectElement>(
      '[aria-label="Drawing page"]',
    )!
    await act(async () => {
      pageSelect.value = "section"
      pageSelect.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(document.querySelector("img")?.alt).toBe(
      "Engineering drawing: Bracket section",
    )
    await act(async () => root.render(render([...bracketCircuit])))
    expect(document.querySelector("img")).toBeNull()
    await act(async () => root.render(render([])))
    await act(async () => requests[2].resolve(pages))
    expect(document.querySelector("img")).toBeNull()
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "No engineering drawings",
    )
    await act(async () => root.render(render(bracketCircuit)))
    const overviewCircuit = bracketCircuit.filter(
      (element) =>
        !(
          element.type === "drawing_page" &&
          element.drawing_page_id === "section"
        ) &&
        !(
          element.type === "drawing_part_view" &&
          element.drawing_page_id === "section"
        ),
    )
    await act(async () => root.render(render(overviewCircuit)))
    await act(async () => requests[4].resolve(pages.slice(0, 1)))
    await act(async () => requests[3].resolve(pages))
    expect(document.querySelector("img")?.alt).toBe(
      "Engineering drawing: Bracket overview",
    )
    expect(document.querySelector('[aria-label="Drawing page"]')).toBeNull()
    expect(document.querySelector("strong")).toBeNull()
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
  }
})
