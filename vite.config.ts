import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "src/problem2",
  base: "./",
  plugins: [viteSingleFile()],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    modulePreload: false,
  },
});
