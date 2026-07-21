// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": "next/dist/compiled/server-only/empty.js",
    },
  },
  test: {
    environment: "node",
    include: ["engine/test/**/*.test.ts"],
    testTimeout: 15_000,
  },
});