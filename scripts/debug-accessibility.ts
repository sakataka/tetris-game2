#!/usr/bin/env bun

import { checkA11y, injectAxe } from "axe-playwright";
import { chromium } from "playwright";

async function debugHeadingStructure(url = "http://localhost:4173"): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for game layout to load
    await page.waitForSelector('[data-testid="game-layout"]', { timeout: 10000 }).catch(() => {
      console.log("Game layout not found, continuing...");
    });

    // Extract all heading elements from the page
    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      return headingElements.map((heading) => ({
        tag: heading.tagName.toLowerCase(),
        text: heading.textContent?.trim() || "",
        id: heading.id || "",
        className: heading.className || "",
        isVisible:
          getComputedStyle(heading).display !== "none" &&
          getComputedStyle(heading).visibility !== "hidden" &&
          heading.offsetWidth > 0 &&
          heading.offsetHeight > 0,
        selector:
          heading.tagName.toLowerCase() +
          (heading.id ? `#${heading.id}` : "") +
          (heading.className ? `.${heading.className.split(" ").join(".")}` : ""),
      }));
    });

    console.log("\n📋 Current Heading Structure on Page:");
    console.log("=====================================");

    if (headings.length === 0) {
      console.log("❌ No heading elements found on the page");
    } else {
      headings.forEach((heading, index) => {
        const visibility = heading.isVisible ? "👁️  Visible" : "🙈 Hidden";
        console.log(`${index + 1}. ${heading.tag.toUpperCase()} ${visibility}`);
        console.log(`   Text: "${heading.text}"`);
        console.log(`   ID: "${heading.id}"`);
        console.log(`   Classes: "${heading.className}"`);
        console.log(`   Selector: ${heading.selector}`);
        console.log("");
      });
    }

    // Analyze heading hierarchy
    const visibleHeadings = headings.filter((h) => h.isVisible);
    console.log("🔍 Heading Hierarchy Analysis:");
    console.log("==============================");

    if (visibleHeadings.length === 0) {
      console.log("❌ No visible headings found");
    } else {
      const headingLevels = visibleHeadings.map((h) => Number.parseInt(h.tag.substring(1)));

      console.log(
        "Visible heading sequence:",
        headingLevels.map((level) => `h${level}`).join(" → "),
      );

      // Check for hierarchy violations
      const violations = [];
      for (let i = 1; i < headingLevels.length; i++) {
        const current = headingLevels[i];
        const previous = headingLevels[i - 1];

        if (current > previous + 1) {
          violations.push({
            index: i,
            issue: `h${previous} followed by h${current} (skips h${previous + 1})`,
          });
        }
      }

      if (violations.length > 0) {
        console.log("\n🚨 Detected Hierarchy Violations:");
        violations.forEach((violation) => {
          console.log(`   - ${violation.issue} at position ${violation.index + 1}`);
          console.log(`     Element: "${visibleHeadings[violation.index].text}"`);
        });
      } else {
        console.log("\n✅ Heading hierarchy appears correct");
      }
    }

    // Run axe-core specifically for heading-order
    await injectAxe(page);

    const results = await checkA11y(page, null, {
      runOnly: {
        type: "rule",
        values: ["heading-order"],
      },
    }).catch((error) => error);

    if (results.violations) {
      console.log("\n🔍 Axe-core Heading-Order Violations:");
      console.log("====================================");

      results.violations.forEach((violation, index) => {
        console.log(`${index + 1}. Rule: ${violation.id}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        console.log("   Affected nodes:");

        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`     ${nodeIndex + 1}. Target: ${node.target.join(" ")}`);
          console.log(`        HTML: ${node.html}`);
          console.log(`        Failure: ${node.failureSummary}`);
          if (node.any.length > 0) {
            console.log("        Any checks:");
            node.any.forEach((check) => {
              console.log(`          - ${check.id}: ${check.message}`);
            });
          }
        });
        console.log("");
      });
    } else {
      console.log("\n✅ No heading-order violations detected by axe-core");
    }

    await browser.close();
  } catch (error) {
    await browser.close();
    console.error("❌ Debug failed:", error);
  }
}

// CLI execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const customUrl = args.find((arg) => arg.startsWith("--url="))?.split("=")[1];

  debugHeadingStructure(customUrl)
    .then(() => {
      console.log("\n✅ Debug completed");
    })
    .catch((error) => {
      console.error("❌ Debug failed:", error);
      process.exit(1);
    });
}

export { debugHeadingStructure };
