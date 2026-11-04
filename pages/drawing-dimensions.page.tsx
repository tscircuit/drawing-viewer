import { DrawingExample } from "./components/DrawingExample"
import CadDimensions from "./fixtures/cad-dimensions"
import PcbDimensions from "./fixtures/pcb-dimensions"

export default {
  "PCB holes and board edges": () => (
    <DrawingExample>
      <PcbDimensions />
    </DrawingExample>
  ),
  "Named CAD holes and outlines": () => (
    <DrawingExample>
      <CadDimensions />
    </DrawingExample>
  ),
}
