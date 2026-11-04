import type { CircuitJson } from "circuit-json"
import cadDimensions from "./dimensions-cad.circuit.json"
import pcbDimensions from "./dimensions-pcb.circuit.json"

// These are the compiled Circuit JSON inputs used by the dimension docs, not
// pre-rendered SVGs. The viewer renders the geometry and annotations locally.
// https://github.com/tscircuit/docs/tree/main/src/data/drawing-previews
export const pcbDimensionsCircuit = pcbDimensions as CircuitJson
export const cadDimensionsCircuit = cadDimensions as CircuitJson
