import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { DrawingExample } from "../pages/components/DrawingExample"
import PcbDimensions from "../pages/fixtures/pcb-dimensions"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root element")

createRoot(root).render(
  <StrictMode>
    <DrawingExample containerStyle={{ height: "100vh" }}>
      <PcbDimensions />
    </DrawingExample>
  </StrictMode>,
)
