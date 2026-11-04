import { DrawingViewer } from "lib/components/DrawingViewer"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root element")

createRoot(root).render(
  <StrictMode>
    <DrawingViewer containerStyle={{ height: "100vh" }} />
  </StrictMode>,
)
