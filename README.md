# @tscircuit/drawing-viewer

React viewer for engineering drawings in Circuit JSON.

`DrawingViewer` renders configured drawing sheets from Circuit JSON, including
selected CAD parts or assemblies, hidden edges, section cuts, dimension lines,
and title blocks. Multiple sheets have a page selector.

## Development

```sh
bun install
bun run start
```

Open the Cosmos URL printed in the terminal and select **drawing-dimensions**:

- **PCB holes and board edges** shows the documentation's 50 × 30 mm board,
  mounting-hole separation, and edge offsets.
- **Named CAD holes and outlines** shows the plate's named bore and rim features.

Both examples come from the
[assembly drawing dimension docs](https://docs.tscircuit.com/elements/assembly-drawing-dimension).
The viewer renders their geometry locally; it does not display the docs' SVG
images. A single sheet fills the viewer without a heading or toolbar. Multiple
sheets expose only a compact page selector.

```sh
bun test
bun run typecheck
bun run format:check
bun run build:site
```

## Package usage

The package follows the handbook's preferred source-only installation: its public
entrypoint is `lib/index.ts`, and only `lib/` is packaged. Consumers need a
TypeScript/TSX-aware runtime or bundler, such as Bun or Vite. React is a peer
dependency.

```tsx
import { DrawingViewer } from "@tscircuit/drawing-viewer"

export default () => (
  <DrawingViewer
    circuitJson={circuitJsonWithDrawingPages}
    containerStyle={{ width: "100%", height: 600 }}
  />
)
```

Provide `drawing_page` and `drawing_part_view` records alongside the circuit's
CAD geometry. The viewer loads the renderer and model converter on demand;
conversion errors show a retry action, and circuit changes discard stale renders.
Drawing records must already contain resolved page layout and dimensions. See
the [drawing configuration reference](https://github.com/tscircuit/circuit-json-to-drawing)
for the supported schema.

Optional `drawingOptions` accepts the renderer's `DrawingOptions`, including
`pixelsPerMm`, `supersampling`, or a custom `resolveScene` callback for applications
that own their geometry-loading pipeline. Default geometry selection follows
`source_group_id` and `source_component_ids` and caches repeated part selections
within one render.

### Documentation fixtures

`pages/fixtures/pcb-dimensions.tsx` and `cad-dimensions.tsx` contain the docs'
authoring examples as JSX. The development-only `DrawingExample` wrapper compiles
them with `@tscircuit/core`, awaits `renderUntilSettled()` for CAD geometry and
resolved dimensions, and passes the resulting Circuit JSON to `DrawingViewer`.
No generated JSON fixtures or duplicate source strings need to be maintained.
The dimension endpoints and labels are core output, not values measured by this
viewer. This follows the upstream
[preview generator](https://github.com/tscircuit/docs/blob/main/scripts/generate-dimension-previews.ts).
The compiler and JSCAD authoring dependencies are development dependencies; the
published `lib/` entrypoint only consumes Circuit JSON.
Compiler support modules are listed explicitly in `devDependencies` because the
published core bundle imports some packages absent from its dependency manifest.

Bun lockfiles are disabled in `bunfig.toml` and ignored by Git. CI checks types,
tests, and formatting. The release workflow publishes the source package to
GitHub Packages using the standard tscircuit plop template; no library build
step is needed. `build:site` exports only the Cosmos demo site.

## References

- [Repository bootstrapping guidelines](https://github.com/tscircuit/handbook/blob/main/guides/bootstrapping-repos.md)
- [Code guidelines](https://github.com/tscircuit/handbook/blob/main/guides/code.md)
- [Schematic Viewer](https://github.com/tscircuit/schematic-viewer) for the React component layout, `containerStyle` convention, and Cosmos setup.
