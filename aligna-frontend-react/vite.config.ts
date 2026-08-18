import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "./",
  build: {
    outDir:
      mode === "android"
        ? resolve(__dirname, "../app/src/main/assets")
        : "dist",
    emptyOutDir: false,
    assetsDir: "react-assets",
    sourcemap: mode !== "android"
  }
}));
