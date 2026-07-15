import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest config.
 * - `vite-tsconfig-paths` resolves the `@/*` alias (→ repo root, per tsconfig).
 * - `@vitejs/plugin-react` supports the jsdom component tests we may add later.
 * - Default `environment: 'node'` suits the Route Handler + pure-lib tests
 *   (call the exported `GET` directly, no HTTP server).
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
      // root-level modules (e.g. proxy.ts, Next requires it at the project root)
      "*.test.{ts,tsx}",
    ],
  },
});
