import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
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
