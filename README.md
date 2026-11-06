# @tscircuit/drawing-viewer

React viewer for engineering drawings in Circuit JSON.

The Cosmos example adapts the [carrier inspection sheet from the drawing docs](https://docs.tscircuit.com/elements/assembly-drawing-page)
with plan and isometric views, dimension annotations, and a title block, using JSX
compiled by core.

## Development

```sh
bun install
bun run start
```

Open the Cosmos URL printed in the terminal and select **engineering-drawing**.
Scroll or pinch to zoom, drag to pan, and use **Fit** to show the complete drawing.
Select **multiple-drawings** for the inspection and section sheets from the docs.
Use the **Drawing** dropdown to switch pages; each selected page fits the viewport.

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

Circuits with multiple `drawing_page` records show one page at a time, starting
with the first page in document order. The drawing selector uses `display_name`,
then `name`, then the page ID as its label, and appears when there is more than
one page.

```tsx
import { DrawingViewer } from "@tscircuit/drawing-viewer"

export default () => (
  <DrawingViewer
    circuitJson={circuitJsonWithDrawingPages}
    containerStyle={{ width: "100%", height: 400 }}
  />
)
```

Bun lockfiles are disabled in `bunfig.toml` and ignored by Git. CI checks types,
tests, and formatting. The release workflow publishes the source package to
GitHub Packages using the standard tscircuit plop template; no library build
step is needed. `build:site` exports only the Cosmos demo site.

## References

- [Repository bootstrapping guidelines](https://github.com/tscircuit/handbook/blob/main/guides/bootstrapping-repos.md)
- [Code guidelines](https://github.com/tscircuit/handbook/blob/main/guides/code.md)
- [Schematic Viewer](https://github.com/tscircuit/schematic-viewer) for the React component layout, `containerStyle` convention, and Cosmos setup.
