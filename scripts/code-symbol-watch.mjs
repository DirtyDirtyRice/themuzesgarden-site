import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "lib", "scripts", "code-map-test-fixtures"];
const outputDir = path.join(root, "code-map-reports");

const fileTypes = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (fileTypes.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeSlash(value) {
  return value.replaceAll("\\", "/");
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function countWord(text, word) {
  const cleanText = stripComments(text);
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...cleanText.matchAll(new RegExp(`\\b${escaped}\\b`, "g"))].length;
}

function collectMatches(regex, text, kind) {
  const results = [];

  for (const match of text.matchAll(regex)) {
    results.push({
      name: match[1],
      kind,
      index: match.index ?? 0,
    });
  }

  return results;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}


function findMissingRequiredProps(relPath, text) {
  const findings = [];
  const cleanText = stripComments(text);

  for (const typeMatch of cleanText.matchAll(/type\s+([A-Za-z0-9_]+)Props\s*=\s*\{([\s\S]*?)\};/g)) {
    const componentName = typeMatch[1];
    const body = typeMatch[2];
    const requiredProps = [];

    for (const propMatch of body.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)) {
      requiredProps.push(propMatch[1]);
    }

    if (!requiredProps.length) continue;

    const componentTagRegex = new RegExp("<" + componentName + "(\\s[^>]*)?/?>", "g");

    for (const tagMatch of cleanText.matchAll(componentTagRegex)) {
      const fullTag = tagMatch[0];
      const line = lineNumberForIndex(text, tagMatch.index ?? 0);

      for (const propName of requiredProps) {
        if (!new RegExp("\\b" + propName + "\\s*=").test(fullTag)) {
          findings.push({
            severity: "high",
            path: relPath,
            line,
            symbol: propName,
            kind: "missing-required-prop",
            uses: 0,
            message: componentName + " is rendered without required prop " + propName + ".",
          });
        }
      }
    }
  }


  return findings;
}

function findLikelyUndefinedNames(relPath, text) {
  const findings = [];
  const cleanText = stripComments(text);

  const namesToWatch = ["viewMode"];

  for (const name of namesToWatch) {
    const used = new RegExp("\\b" + name + "\\b").test(cleanText);
    if (!used) continue;

    const declared =
      new RegExp("\\bconst\\s+" + name + "\\b").test(cleanText) ||
      new RegExp("\\blet\\s+" + name + "\\b").test(cleanText) ||
      new RegExp("\\bvar\\s+" + name + "\\b").test(cleanText) ||
      new RegExp("\\bfunction\\s+" + name + "\\b").test(cleanText) ||
      new RegExp("\\b" + name + "\\s*:", "m").test(cleanText);

    if (!declared) {
      findings.push({
        severity: "high",
        path: relPath,
        line: lineNumberForIndex(text, cleanText.indexOf(name)),
        symbol: name,
        kind: "likely-undefined-name",
        uses: 0,
        message: name + " is used but not declared in this file.",
      });
    }
  }

  return findings;
}
function analyzeFile(absPath, text) {
  const relPath = normalizeSlash(path.relative(root, absPath));

  const declarations = [
    ...collectMatches(/const\s+\[\s*([A-Za-z0-9_]+)\s*,\s*set[A-Za-z0-9_]+\s*\]\s*=\s*useState/g, text, "react-state-value"),
    ...collectMatches(/const\s+\[\s*[A-Za-z0-9_]+\s*,\s*(set[A-Za-z0-9_]+)\s*\]\s*=\s*useState/g, text, "react-state-setter"),
    ...collectMatches(/const\s+([A-Za-z0-9_]*(?:LINKS|ITEMS|ROUTES|MENU)[A-Za-z0-9_]*)\s*[:=]/g, text, "wiring-constant"),
    ...collectMatches(/const\s+([A-Z][A-Z0-9_]{2,})\s*[:=]/g, text, "constant"),
    ...collectMatches(/import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+["'][^"']+["']/g, text, "imported-component"),
    ...collectMatches(/function\s+(handle[A-Z][A-Za-z0-9_]*)\s*\(/g, text, "local-handler"),
  ];

  const findings = [];
  const seenSymbols = new Set();

  for (const item of declarations) {
    if (seenSymbols.has(item.name)) continue;
    seenSymbols.add(item.name);
    const uses = countWord(text, item.name);

    if (item.kind === "react-state-setter" && uses > 1) {
      continue;
    }

    if (item.kind !== "react-state-value" && item.kind !== "react-state-setter" && item.kind !== "constant" && item.kind !== "wiring-constant") {
      continue;
    }

    if (uses <= 1) {
      findings.push({
        severity: "high",
        path: relPath,
        line: lineNumberForIndex(text, item.index),
        symbol: item.name,
        kind: item.kind,
        uses,
        message: `${item.name} is declared but does not appear to be used.`,
      });
    } else if (uses === 2 && (item.kind === "constant" || item.kind === "react-state-value")) {
      findings.push({
        severity: "medium",
        path: relPath,
        line: lineNumberForIndex(text, item.index),
        symbol: item.name,
        kind: item.kind,
        uses,
        message: `${item.name} is barely used. Verify it is actually rendered or wired.`,
      });
    }
  }

  findings.push(...findLikelyUndefinedNames(relPath, text));
  findings.push(...findMissingRequiredProps(relPath, text));

  return findings;
}

async function main() {
  const files = [];

  for (const scanRoot of scanRoots) {
    const absRoot = path.join(root, scanRoot);
    if (await exists(absRoot)) {
      files.push(...await walk(absRoot));
    }
  }

  const findings = [];

  for (const file of files.sort()) {
    const text = await fs.readFile(file, "utf8");
    findings.push(...analyzeFile(file, text));
  }

  findings.sort((a, b) => {
    const score = { high: 0, medium: 1, low: 2 };
    return score[a.severity] - score[b.severity] || a.path.localeCompare(b.path);
  });

  await fs.mkdir(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "code-symbol-watch.json");
  const mdPath = path.join(outputDir, "code-symbol-watch.md");

  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fileCount: files.length,
        findingCount: findings.length,
        findings,
      },
      null,
      2
    )
  );

  const knownBadCaught = findings.some(
    (item) =>
      item.path.includes("code-map-test-fixtures/missing-tools-dropdown-example.tsx") &&
      item.symbol === "TOOLS_CHILD_LINKS"
  );

  await fs.writeFile(
    mdPath,
    [
      "# Code Symbol Watch",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Files scanned: ${files.length}`,
      `Findings: ${findings.length}`,
      `Known bad test: ${knownBadCaught ? "CAUGHT" : "MISSED"}`,
      "",
      ...findings.slice(0, 100).map(
        (item) =>
          `- ${item.severity.toUpperCase()} ${item.path}:${item.line} ${item.symbol} (${item.kind}, uses: ${item.uses}) - ${item.message}`
      ),
      "",
    ].join("\n")
  );

  console.log("Code symbol watch complete.");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log(`Known bad test: ${knownBadCaught ? "CAUGHT" : "MISSED"}`);
  console.log("Report: code-map-reports/code-symbol-watch.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
