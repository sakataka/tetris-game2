#!/usr/bin/env bun

/**
 * Bundle size analysis and optimization tooling
 */

import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);

interface FileInfo {
  name: string;
  size: number;
  gzipSize: number;
  type: "vendor" | "feature" | "worker" | "main" | "css";
}

interface BundleAnalysis {
  files: FileInfo[];
  totalSize: number;
  totalGzipSize: number;
  violations: FileInfo[];
  recommendations: string[];
}

class BundleOptimizer {
  private buildDir: string;
  private sizeTargets: {
    total: number;
    chunks: Record<string, number>;
  };

  constructor(buildDir = "dist") {
    this.buildDir = buildDir;
    this.sizeTargets = {
      total: 150 * 1024, // 150KB
      chunks: {
        vendor: 80 * 1024, // 80KB for vendor libs
        main: 50 * 1024, // 50KB for main app
        feature: 20 * 1024, // 20KB per feature
        worker: 30 * 1024, // 30KB for workers
        css: 15 * 1024, // 15KB for CSS
      },
    };
  }

  async analyzeBundleSize(): Promise<BundleAnalysis> {
    const buildPath = resolve(process.cwd(), this.buildDir);

    try {
      const files = await this.getAssetFiles(buildPath);

      const analysis: BundleAnalysis = {
        files: [],
        totalSize: 0,
        totalGzipSize: 0,
        violations: [],
        recommendations: [],
      };

      for (const file of files) {
        const content = await readFile(file);
        const size = content.length;
        const gzipSize = (await gzipAsync(content)).length;

        const fileInfo: FileInfo = {
          name: basename(file),
          size,
          gzipSize,
          type: this.categorizeFile(file),
        };

        analysis.files.push(fileInfo);
        analysis.totalSize += size;
        analysis.totalGzipSize += gzipSize;

        // Check size violations
        if (this.checkSizeViolation(fileInfo)) {
          analysis.violations.push(fileInfo);
        }
      }

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze bundle: ${error}`);
    }
  }

  private async getAssetFiles(buildPath: string): Promise<string[]> {
    const entries = await readdir(buildPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(buildPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.getAssetFiles(fullPath);
        files.push(...subFiles);
      } else if (
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".css") ||
        entry.name.endsWith(".mjs")
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private categorizeFile(filePath: string): FileInfo["type"] {
    const fileName = basename(filePath);

    if (fileName.includes("vendor") || fileName.includes("node_modules")) {
      return "vendor";
    }
    if (fileName.includes("feature-")) {
      return "feature";
    }
    if (fileName.includes("worker")) {
      return "worker";
    }
    if (fileName.endsWith(".css")) {
      return "css";
    }
    return "main";
  }

  private checkSizeViolation(fileInfo: FileInfo): boolean {
    const target = this.sizeTargets.chunks[fileInfo.type] || this.sizeTargets.chunks.feature;
    return fileInfo.gzipSize > target;
  }

  private generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check if total bundle size exceeds target
    if (analysis.totalGzipSize > this.sizeTargets.total) {
      const excess = analysis.totalGzipSize - this.sizeTargets.total;
      recommendations.push(`Total bundle size exceeds target by ${this.formatBytes(excess)}`);
      recommendations.push("Consider implementing code splitting and lazy loading");
    }

    // Check for large individual files
    const largeFiles = analysis.files
      .filter((file) => file.gzipSize > 50 * 1024)
      .sort((a, b) => b.gzipSize - a.gzipSize);

    if (largeFiles.length > 0) {
      recommendations.push("Large files detected:");
      largeFiles.forEach((file) => {
        recommendations.push(
          `  - ${file.name}: ${this.formatBytes(file.gzipSize)} (consider splitting)`,
        );
      });
    }

    // Specific optimization suggestions
    const mainFiles = analysis.files.filter((f) => f.type === "main");
    if (mainFiles.some((f) => f.gzipSize > this.sizeTargets.chunks.main)) {
      recommendations.push("Main bundle is too large - implement lazy loading for:");
      recommendations.push("  - AI control panels");
      recommendations.push("  - Settings UI");
      recommendations.push("  - Advanced game features");
    }

    // Tree-shaking suggestions
    if (analysis.totalGzipSize > this.sizeTargets.total * 0.8) {
      recommendations.push("Enable better tree-shaking:");
      recommendations.push("  - Use named imports instead of default imports");
      recommendations.push("  - Mark side-effect-free packages in package.json");
      recommendations.push("  - Use rollup-plugin-analyzer to identify unused code");
    }

    return recommendations;
  }

  generateReport(analysis: BundleAnalysis): boolean {
    console.log("📦 Bundle Size Analysis Report");
    console.log("================================");
    console.log(`Total Bundle Size: ${this.formatBytes(analysis.totalSize)}`);
    console.log(`Total Gzipped Size: ${this.formatBytes(analysis.totalGzipSize)}`);
    console.log(`Target: ${this.formatBytes(this.sizeTargets.total)}`);

    const isWithinTarget = analysis.totalGzipSize <= this.sizeTargets.total;
    console.log(`Status: ${isWithinTarget ? "✅ PASS" : "❌ FAIL"}`);

    console.log("\n📄 File Breakdown:");
    analysis.files
      .sort((a, b) => b.gzipSize - a.gzipSize)
      .forEach((file) => {
        const status = this.checkSizeViolation(file) ? "⚠️" : "✅";
        console.log(`  ${status} ${file.name}: ${this.formatBytes(file.gzipSize)} (${file.type})`);
      });

    if (analysis.violations.length > 0) {
      console.log("\n⚠️ Size Violations:");
      analysis.violations.forEach((file) => {
        const target = this.sizeTargets.chunks[file.type] || this.sizeTargets.chunks.feature;
        const overage = file.gzipSize - target;
        console.log(`  ${file.name}: ${this.formatBytes(overage)} over limit`);
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      analysis.recommendations.forEach((rec) => {
        console.log(`  ${rec}`);
      });
    }

    // Performance metrics
    console.log("\n⚡ Performance Analysis:");
    const estimatedLoadTime = this.estimateLoadTime(analysis.totalGzipSize);
    console.log(`  Estimated load time (3G): ${estimatedLoadTime}ms`);
    console.log(`  Tree-shaking efficiency: ${this.calculateTreeShakingEfficiency(analysis)}%`);

    return isWithinTarget;
  }

  private estimateLoadTime(sizeBytes: number): number {
    // Assuming 3G connection (1.5 Mbps effective)
    const bitsPerSecond = 1.5 * 1024 * 1024;
    const bytesPerSecond = bitsPerSecond / 8;
    return Math.round((sizeBytes / bytesPerSecond) * 1000);
  }

  private calculateTreeShakingEfficiency(analysis: BundleAnalysis): number {
    // Estimate efficiency based on vendor vs app code ratio
    const vendorSize = analysis.files
      .filter((f) => f.type === "vendor")
      .reduce((sum, f) => sum + f.gzipSize, 0);

    const _appSize = analysis.totalGzipSize - vendorSize;
    const estimatedFullSize = analysis.totalGzipSize * 1.5; // Assume 50% waste without tree-shaking

    return Math.round(((estimatedFullSize - analysis.totalGzipSize) / estimatedFullSize) * 100);
  }

  formatBytes(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
}

// CLI usage
if (import.meta.main) {
  const optimizer = new BundleOptimizer();

  try {
    const analysis = await optimizer.analyzeBundleSize();
    const success = optimizer.generateReport(analysis);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Bundle analysis failed:", error);
    process.exit(1);
  }
}

export { BundleOptimizer, type BundleAnalysis, type FileInfo };
