import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-oxc";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

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
    rollupOptions: {
      // Ensure workers are built correctly
      output: {
        // Keep worker files separate for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes("worker")) {
            return "workers/[name]-[hash].js";
          }
          return "chunks/[name]-[hash].js";
        },
      },
    },
  },
  worker: {
    // Configure worker build options
    format: "es",
    plugins: () => [
      // Apply same plugins to workers if needed
    ],
    rollupOptions: {
      // Worker-specific rollup options
      output: {
        format: "es",
        entryFileNames: "workers/[name]-[hash].js",
      },
    },
  },
  experimental: {
    enableNativePlugin: true,
  },
});
