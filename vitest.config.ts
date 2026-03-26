import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/out/**", "**/node_modules/**"],
    // This repo uses TS "module": "commonjs"; keep tests simple and Node-based.
  },
});

