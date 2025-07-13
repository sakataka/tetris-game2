#!/usr/bin/env bun

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkA11y, getViolations, injectAxe } from "axe-playwright";
import { chromium } from "playwright";

interface AccessibilityReport {
  timestamp: string;
  url: string;
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  passes: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  incomplete: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  summary: {
    violationCount: number;
    passCount: number;
    incompleteCount: number;
    wcagLevel: "A" | "AA" | "AAA";
    score: number;
    criticalViolations: number;
    moderateViolations: number;
    minorViolations: number;
  };
  colorContrastIssues: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  keyboardNavigationIssues: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  focusManagementIssues: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
  ariaIssues: Array<{
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }>;
}

const CRITICAL_RULE_IDS = [
  "color-contrast",
  "keyboard-navigation",
  "aria-required",
  "aria-valid",
  "button-name",
  "input-button-name",
  "link-name",
];

const MODERATE_RULE_IDS = [
  "aria-hidden-focus",
  "focus-order-semantics",
  "tabindex",
  "aria-roles",
  "heading-order",
];

async function runAccessibilityAudit(url = "http://localhost:5173"): Promise<AccessibilityReport> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the page
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for game layout to load
    await page.waitForSelector('[data-testid="game-layout"]', { timeout: 10000 }).catch(() => {
      console.log("Game layout not found, continuing with audit...");
    });

    // Inject axe-core
    await injectAxe(page);

    // Run accessibility check with WCAG 2.2 AA standards
    const results = await checkA11y(page, null, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
      rules: {
        // Enhanced rules for game-specific accessibility
        "color-contrast": { enabled: true },
        "color-contrast-enhanced": { enabled: true },
        keyboard: { enabled: true },
        "aria-labels": { enabled: true },
        "aria-roles": { enabled: true },
        "aria-required-attr": { enabled: true },
        "aria-valid-attr": { enabled: true },
        "aria-valid-attr-value": { enabled: true },
        "button-name": { enabled: true },
        bypass: { enabled: true },
        "document-title": { enabled: true },
        "focus-order-semantics": { enabled: true },
        "focusable-content": { enabled: true },
        "frame-title": { enabled: true },
        "heading-order": { enabled: true },
        "html-has-lang": { enabled: true },
        "html-lang-valid": { enabled: true },
        "image-alt": { enabled: true },
        "input-button-name": { enabled: true },
        label: { enabled: true },
        "landmark-banner-is-top-level": { enabled: true },
        "landmark-complementary-is-top-level": { enabled: true },
        "landmark-contentinfo-is-top-level": { enabled: true },
        "landmark-main-is-top-level": { enabled: true },
        "landmark-no-duplicate-banner": { enabled: true },
        "landmark-no-duplicate-contentinfo": { enabled: true },
        "landmark-one-main": { enabled: true },
        "link-name": { enabled: true },
        list: { enabled: true },
        listitem: { enabled: true },
        "page-has-heading-one": { enabled: true },
        region: { enabled: true },
        "skip-link": { enabled: true },
        tabindex: { enabled: true },
      },
    });

    const violations = await getViolations(page);

    // Categorize violations by severity
    const criticalViolations = violations.filter(
      (v) => CRITICAL_RULE_IDS.includes(v.id) || v.impact === "critical",
    );
    const moderateViolations = violations.filter(
      (v) => MODERATE_RULE_IDS.includes(v.id) || v.impact === "serious",
    );
    const minorViolations = violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor",
    );

    // Categorize specific types of issues
    const colorContrastIssues = violations.filter((v) => v.id.includes("color-contrast"));
    const keyboardNavigationIssues = violations.filter(
      (v) => v.id.includes("keyboard") || v.id.includes("tabindex") || v.id.includes("focus"),
    );
    const focusManagementIssues = violations.filter(
      (v) => v.id.includes("focus") || v.id.includes("bypass"),
    );
    const ariaIssues = violations.filter((v) => v.id.includes("aria"));

    await browser.close();

    // Calculate accessibility score
    const totalChecks = results.passes.length + violations.length + results.incomplete.length;
    const score = totalChecks > 0 ? (results.passes.length / totalChecks) * 100 : 0;

    // Determine WCAG level
    let wcagLevel: "A" | "AA" | "AAA" = "AAA";
    if (criticalViolations.length > 0) {
      wcagLevel = "A";
    } else if (moderateViolations.length > 0) {
      wcagLevel = "AA";
    }

    const report: AccessibilityReport = {
      timestamp: new Date().toISOString(),
      url,
      violations: violations,
      passes: results.passes,
      incomplete: results.incomplete,
      summary: {
        violationCount: violations.length,
        passCount: results.passes.length,
        incompleteCount: results.incomplete.length,
        wcagLevel,
        score: Math.round(score),
        criticalViolations: criticalViolations.length,
        moderateViolations: moderateViolations.length,
        minorViolations: minorViolations.length,
      },
      colorContrastIssues,
      keyboardNavigationIssues,
      focusManagementIssues,
      ariaIssues,
    };

    // Ensure report directory exists
    const reportsDir = resolve("./accessibility-reports");
    mkdirSync(reportsDir, { recursive: true });

    // Save detailed report
    const reportFile = resolve(reportsDir, `audit-${Date.now()}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Output summary to console
    console.log("\n🔍 Accessibility Audit Results");
    console.log("================================");
    console.log(`📍 URL: ${url}`);
    console.log(`📊 Overall Score: ${report.summary.score}%`);
    console.log(`🏆 WCAG Level: ${report.summary.wcagLevel}`);
    console.log("\n📈 Summary:");
    console.log(`  ✅ Passes: ${report.summary.passCount}`);
    console.log(`  ❌ Violations: ${report.summary.violationCount}`);
    console.log(`  ⚠️  Incomplete: ${report.summary.incompleteCount}`);

    console.log("\n🚨 Violations by Severity:");
    console.log(`  🔴 Critical: ${report.summary.criticalViolations}`);
    console.log(`  🟡 Moderate: ${report.summary.moderateViolations}`);
    console.log(`  🔵 Minor: ${report.summary.minorViolations}`);

    console.log("\n🎯 Specific Issues:");
    console.log(`  🎨 Color Contrast: ${colorContrastIssues.length}`);
    console.log(`  ⌨️  Keyboard Navigation: ${keyboardNavigationIssues.length}`);
    console.log(`  🎯 Focus Management: ${focusManagementIssues.length}`);
    console.log(`  🏷️  ARIA Issues: ${ariaIssues.length}`);

    if (violations.length > 0) {
      console.log("\n📋 Top Violations Found:");
      violations.slice(0, 5).forEach((violation, index) => {
        console.log(`${index + 1}. [${violation.impact?.toUpperCase()}] ${violation.id}`);
        console.log(`   ${violation.description}`);
        console.log(`   Affected elements: ${violation.nodes.length}`);
        if (violation.nodes.length > 0) {
          console.log(`   Example: ${violation.nodes[0].target.join(" ")}`);
        }
        console.log("");
      });
    }

    console.log(`\n📄 Detailed report saved: ${reportFile}`);

    return report;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Test specific game states
async function runComprehensiveAudit(): Promise<void> {
  console.log("🚀 Starting Comprehensive Accessibility Audit...\n");

  const testUrls = [
    "http://localhost:5173",
    "http://localhost:5173?debug=true",
    "http://localhost:5173?preset=tetris&ai=advanced",
  ];

  const allReports: AccessibilityReport[] = [];

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const report = await runAccessibilityAudit(url);
      allReports.push(report);
      console.log("✅ Completed\n");
    } catch (error) {
      console.error(`❌ Failed to audit ${url}:`, error);
    }
  }

  // Generate combined report
  if (allReports.length > 0) {
    const combinedReport = {
      timestamp: new Date().toISOString(),
      reports: allReports,
      overallSummary: {
        averageScore: Math.round(
          allReports.reduce((sum, r) => sum + r.summary.score, 0) / allReports.length,
        ),
        totalViolations: allReports.reduce((sum, r) => sum + r.summary.violationCount, 0),
        totalPasses: allReports.reduce((sum, r) => sum + r.summary.passCount, 0),
        worstWcagLevel: allReports.reduce(
          (worst, r) => {
            const levels = { AAA: 3, AA: 2, A: 1 };
            return levels[r.summary.wcagLevel] < levels[worst] ? r.summary.wcagLevel : worst;
          },
          "AAA" as "A" | "AA" | "AAA",
        ),
      },
    };

    const reportsDir = resolve("./accessibility-reports");
    const combinedFile = resolve(reportsDir, `combined-audit-${Date.now()}.json`);
    writeFileSync(combinedFile, JSON.stringify(combinedReport, null, 2));

    console.log("📊 Combined Audit Summary");
    console.log("=========================");
    console.log(`🎯 Average Score: ${combinedReport.overallSummary.averageScore}%`);
    console.log(`📈 Total Passes: ${combinedReport.overallSummary.totalPasses}`);
    console.log(`📉 Total Violations: ${combinedReport.overallSummary.totalViolations}`);
    console.log(`🏆 Overall WCAG Level: ${combinedReport.overallSummary.worstWcagLevel}`);
    console.log(`📄 Combined report: ${combinedFile}\n`);
  }
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const isComprehensive = args.includes("--comprehensive");
  const customUrl = args.find((arg) => arg.startsWith("--url="))?.split("=")[1];

  if (isComprehensive) {
    runComprehensiveAudit()
      .then(() => {
        console.log("✅ Comprehensive audit completed");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Comprehensive audit failed:", error);
        process.exit(1);
      });
  } else {
    runAccessibilityAudit(customUrl)
      .then((report) => {
        if (report.summary.violationCount > 0) {
          console.log(`\n⚠️  Found ${report.summary.violationCount} violations. Review needed.`);
          process.exit(1);
        } else {
          console.log("\n🎉 No violations found! Accessibility looks good.");
          process.exit(0);
        }
      })
      .catch((error) => {
        console.error("❌ Accessibility audit failed:", error);
        process.exit(1);
      });
  }
}

export { runAccessibilityAudit, runComprehensiveAudit };
