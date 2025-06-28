import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "baseline-widely-available",
  },
  experimental: {
    enableNativePlugin: true,
  },
});
