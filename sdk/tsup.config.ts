import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/react.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2021",
  external: ["react"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" }
  },
})
