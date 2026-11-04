import { RootCircuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { DrawingViewer } from "lib/components/DrawingViewer"
import { useEffect, useState } from "react"
import PcbDimensions from "./fixtures/pcb-dimensions"

export default function DrawingDimensions() {
  const [circuitJson, setCircuitJson] = useState<CircuitJson>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    const circuit = new RootCircuit()
    circuit.add(<PcbDimensions />)
    void circuit.renderUntilSettled().then(
      () => {
        if (!cancelled) setCircuitJson(circuit.getCircuitJson())
      },
      (error: unknown) => {
        if (!cancelled)
          setError(error instanceof Error ? error.message : String(error))
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (error !== undefined) return <p role="alert">{error}</p>
  if (!circuitJson) return <p role="status">Preparing drawing…</p>
  return <DrawingViewer circuitJson={circuitJson} />
}
