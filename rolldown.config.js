import { defineConfig } from "rolldown";

export default defineConfig([
  // ESM build
  {
    input: "src/index.mjs",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
    },
  },
  // CJS build
  {
    input: "src/index.mjs",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
    },
  },
]);
