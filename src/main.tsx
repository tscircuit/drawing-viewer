import { DrawingViewer } from "lib/components/DrawingViewer"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { pcbDimensionsCircuit } from "../pages/fixtures/dimension-examples"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root element")

createRoot(root).render(
  <StrictMode>
    <DrawingViewer
      circuitJson={pcbDimensionsCircuit}
      containerStyle={{ height: "100vh" }}
    />
  </StrictMode>,
)
