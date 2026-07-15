import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // The source uses explicit `.js` specifiers for NodeNext-friendly output.
    // Rewrite them back to the `.ts` sources when running the tests.
    alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: "$1.ts" }],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
