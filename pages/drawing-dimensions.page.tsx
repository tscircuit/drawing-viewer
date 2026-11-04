import { DrawingViewer } from "lib/components/DrawingViewer"
import {
  cadDimensionsCircuit,
  pcbDimensionsCircuit,
} from "./fixtures/dimension-examples"

export default {
  "PCB holes and board edges": () => (
    <DrawingViewer circuitJson={pcbDimensionsCircuit} />
  ),
  "Named CAD holes and outlines": () => (
    <DrawingViewer circuitJson={cadDimensionsCircuit} />
  ),
}
