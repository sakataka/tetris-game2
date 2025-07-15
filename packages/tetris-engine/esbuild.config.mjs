import { build } from "esbuild";

const config = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  format: "esm",
  target: "es2022",
  platform: "neutral",
  bundle: false,
  splitting: false,
  sourcemap: true,
  treeShaking: true,
  minify: false,
  keepNames: true,
  external: [],
};

// Build function
async function buildPackage() {
  try {
    await build(config);
    console.log("✅ esbuild: JavaScript compilation completed");
  } catch (error) {
    console.error("❌ esbuild failed:", error);
    process.exit(1);
  }
}

// Watch function
async function watchPackage() {
  try {
    const context = await build({
      ...config,
      logLevel: "info",
    });

    await context.watch();
    console.log("👀 esbuild: Watching for changes...");
  } catch (error) {
    console.error("❌ esbuild watch failed:", error);
    process.exit(1);
  }
}

// CLI handling
const isWatch = process.argv.includes("--watch");
if (isWatch) {
  watchPackage();
} else {
  buildPackage();
}
