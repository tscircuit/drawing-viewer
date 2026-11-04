import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import DrawingDimensions from "../pages/drawing-dimensions.page"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root element")

createRoot(root).render(
  <StrictMode>
    <div style={{ height: "100vh" }}>
      <DrawingDimensions />
    </div>
  </StrictMode>,
)
