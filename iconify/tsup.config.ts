import { defineConfig } from "tsup";

export default defineConfig([
  // Library build
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ["react", "react-dom"],
  },
  // CLI build
  {
    entry: ["src/cli.ts"],
    format: ["cjs"],
    platform: "node",
    target: "node16",
    sourcemap: true,
    clean: false,
    treeshake: true,
  },
]);
