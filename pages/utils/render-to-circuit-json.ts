import { RootCircuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import type { ReactElement } from "react"

export const renderToCircuitJson = async (
  element: ReactElement,
): Promise<CircuitJson> => {
  const circuit = new RootCircuit()
  circuit.add(element)
  // CAD geometry and resolved drawing dimensions require asynchronous phases.
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
