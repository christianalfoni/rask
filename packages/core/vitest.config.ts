import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: [
      {
        find: /^rask-ui\/jsx-runtime$/,
        replacement: path.resolve(__dirname, "./src/jsx-runtime.ts"),
      },
      {
        find: /^rask-ui\/jsx-dev-runtime$/,
        replacement: path.resolve(__dirname, "./src/jsx-dev-runtime.ts"),
      },
      {
        find: /^rask-ui$/,
        replacement: path.resolve(__dirname, "./src/index.ts"),
      },
    ],
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "rask-ui",
  },
});
