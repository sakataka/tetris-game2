const path = require("node:path");

/**
 * JSCodeshift transform to convert relative imports to path aliases (@/)
 *
 * Usage:
 * - Phase 1 (deep paths): jscodeshift -t scripts/transform-imports.js --deep src
 * - Phase 2 (parent paths): jscodeshift -t scripts/transform-imports.js --parent src
 */

function transformer(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Get the current file's directory relative to src
  const srcDir = path.resolve(process.cwd(), "src");
  const currentFileDir = path.dirname(file.path);
  const _relativePath = path.relative(srcDir, currentFileDir);

  let hasChanges = false;

  // Function to convert relative path to alias path
  const convertToAliasPath = (relativePath) => {
    // Skip same directory imports (./)
    if (relativePath.startsWith("./")) {
      return null;
    }

    // Convert ../ relative paths to @/ aliases
    if (relativePath.startsWith("../")) {
      // Phase filtering
      if (options.deep && !relativePath.startsWith("../../")) {
        return null; // Only process deep paths (../../+) in deep mode
      }
      if (options.parent && relativePath.startsWith("../../")) {
        return null; // Skip deep paths in parent mode
      }

      try {
        const resolvedPath = path.resolve(currentFileDir, relativePath);
        const relativeTSrc = path.relative(srcDir, resolvedPath);

        // Ensure we're still within src directory
        if (relativeTSrc.startsWith("..")) {
          return null;
        }

        const aliasPath = `@/${relativeTSrc.replace(/\\/g, "/")}`;
        return aliasPath;
      } catch (_error) {
        console.warn(`Failed to resolve path: ${relativePath} from ${file.path}`);
        return null;
      }
    }

    return null;
  };

  // Transform import declarations
  root.find(j.ImportDeclaration).forEach((path) => {
    const importPath = path.node.source.value;
    const aliasPath = convertToAliasPath(importPath);

    if (aliasPath) {
      path.node.source.value = aliasPath;
      hasChanges = true;
    }
  });

  // Transform dynamic imports
  root
    .find(j.CallExpression, {
      callee: { type: "Import" },
    })
    .forEach((path) => {
      if (path.node.arguments[0] && path.node.arguments[0].type === "StringLiteral") {
        const importPath = path.node.arguments[0].value;
        const aliasPath = convertToAliasPath(importPath);

        if (aliasPath) {
          path.node.arguments[0].value = aliasPath;
          hasChanges = true;
        }
      }
    });

  // Transform require() calls
  root
    .find(j.CallExpression, {
      callee: { name: "require" },
    })
    .forEach((path) => {
      if (path.node.arguments[0] && path.node.arguments[0].type === "StringLiteral") {
        const importPath = path.node.arguments[0].value;
        const aliasPath = convertToAliasPath(importPath);

        if (aliasPath) {
          path.node.arguments[0].value = aliasPath;
          hasChanges = true;
        }
      }
    });

  return hasChanges
    ? root.toSource({
        quote: "single",
        reuseParsers: true,
      })
    : null;
}

module.exports = transformer;
module.exports.parser = "tsx";
