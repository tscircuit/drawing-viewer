import type { CSSProperties } from "react"

export interface DrawingViewerProps {
  containerStyle?: CSSProperties
  className?: string
}

/** Starter component; engineering drawing rendering will be added separately. */
export const DrawingViewer = ({
  containerStyle,
  className,
}: DrawingViewerProps) => (
  <div
    className={className}
    style={{ width: "100%", height: "100%", ...containerStyle }}
  >
    Hello world
  </div>
)
