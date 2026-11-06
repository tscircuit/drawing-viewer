import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import EngineeringDrawingPage from "../pages/engineering-drawing.page"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root element")

createRoot(root).render(
  <StrictMode>
    <div style={{ height: "100vh" }}>
      <EngineeringDrawingPage />
    </div>
  </StrictMode>,
)
