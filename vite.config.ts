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
    target: "es2022",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui") || id.includes("lucide-react")) {
              return "vendor-ui";
            }
            if (id.includes("zustand") || id.includes("immer")) {
              return "vendor-state";
            }
            if (id.includes("motion")) {
              return "vendor-motion";
            }
            if (id.includes("i18next")) {
              return "vendor-i18n";
            }
            return "vendor-misc";
          }

          // Workers
          if (id.includes("/workers/")) {
            return "ai-worker";
          }

          // AI engine
          if (id.includes("/game/ai/")) {
            return "ai-engine";
          }

          // Game engine core
          if (id.includes("/game/") && !id.includes("/game/ai/")) {
            return "game-engine";
          }

          // Features
          if (id.includes("/features/ai-control/")) {
            return "feature-ai-control";
          }
          if (id.includes("/features/settings/")) {
            return "feature-settings";
          }

          // Storybook (exclude from main bundle)
          if (id.includes("storybook") || id.includes(".stories.")) {
            return "storybook";
          }
        },

        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes("worker")) {
            return "workers/[name]-[hash].js";
          }
          if (chunkInfo.name?.startsWith("feature-")) {
            return "features/[name]-[hash].js";
          }
          if (chunkInfo.name?.startsWith("vendor-")) {
            return "vendor/[name]-[hash].js";
          }
          if (chunkInfo.name?.includes("ai")) {
            return "ai/[name]-[hash].js";
          }
          return "chunks/[name]-[hash].js";
        },
      },
    },
    // Split large chunks
    chunkSizeWarningLimit: 500,

    // Enable source maps for debugging but exclude from bundle
    sourcemap: false,
  },

  // Optimize dependencies for better tree-shaking
  optimizeDeps: {
    include: ["react", "react-dom", "zustand", "i18next", "react-i18next"],
    exclude: [
      // Exclude large optional dependencies
      "@storybook/react",
    ],
  },

  worker: {
    format: "es",
    plugins: () => [
      // Apply same plugins to workers if needed
    ],
    rollupOptions: {
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
