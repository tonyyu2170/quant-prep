import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    // The gates in this repo are corpus-scale on purpose — sweeping all 219 templates' legal
    // draw spaces, fitting ~19k sequence prompts against every rule a solver might try. They are
    // gates, not unit tests, and vitest's 5s default is a unit-test number.
    //
    // MEASURED 2026-08-24: GitHub Actions runs these ~5.5x slower than this laptop (a 2.1s test
    // took 11.9s, a 3.3s test took 14.5s), which is how three sequence gates went red on CI while
    // passing locally. 60s leaves headroom for a slower runner and for the next corpus gate. A
    // genuinely hung test still fails, just later — the tradeoff is deliberate.
    testTimeout: 60_000,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/test/**/*.test.ts", "lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.tsx", "content/**/*.test.ts"],
  },
  resolve: { alias: {
    "@qp/engine": path.resolve(__dirname, "packages/engine/src/index.ts"),
    "@qp/generators": path.resolve(__dirname, "packages/generators/src/index.ts"),
    "@": path.resolve(__dirname),
  }},
});
