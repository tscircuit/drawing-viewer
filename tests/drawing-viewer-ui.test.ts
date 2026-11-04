import { test } from "bun:test"
import { fileURLToPath } from "node:url"

test("the standalone viewer switches sheets and recovers from errors and stale renders", async () => {
  // Bun module mocks persist across tests; isolate the UI mock from real render tests.
  const subprocess = Bun.spawn({
    cmd: [
      process.execPath,
      "test",
      fileURLToPath(
        new URL("./fixtures/drawing-viewer-ui.tsx", import.meta.url),
      ),
    ],
    stdout: "pipe",
    stderr: "pipe",
  })
  const timeout = setTimeout(() => subprocess.kill(), 15000)
  try {
    const [exitCode, stdout, stderr] = await Promise.all([
      subprocess.exited,
      new Response(subprocess.stdout).text(),
      new Response(subprocess.stderr).text(),
    ])
    if (exitCode !== 0) throw new Error(`${stdout}${stderr}`)
  } finally {
    clearTimeout(timeout)
  }
}, 20000)
