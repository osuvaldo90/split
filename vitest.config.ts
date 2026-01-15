import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["tests/**/*.test.ts", "convex/**/*.test.ts"],
    globals: true,
    // convex-test requires node environment for fs operations
    // import.meta.glob is handled by Vite plugin automatically
    environmentMatchGlobs: [
      ["convex/**/*.test.ts", "node"],
    ],
    // Required for convex-test to resolve module paths
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
