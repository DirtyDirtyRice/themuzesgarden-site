import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "lib", "scripts"];
const outputDir = path.join(root, "code-map-reports");

const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

function normalizeSlash(value) {
  return value.replaceAll("\\", "/");
}

async function exists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      files.push(...await walk(abs));
      continue;
    }

    if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) {
      files.push(abs);
    }
  }

  return files;
}

function findAll(regex, text, pick = 1) {
  const values = [];
  for (const match of text.matchAll(regex)) {
    values.push(match[pick]);
  }
  return [...new Set(values)].sort();
}

function findVisibleTexts(text) {
  const values = [];

  for (const match of text.matchAll(/>\s*([^<>{}\n][^<>{}\n]{2,120}?)\s*</g)) {
    values.push(match[1].replace(/\s+/g, " ").trim());
  }

  for (const match of text.matchAll(/(?:placeholder|aria-label|title)=["']([^"']{3,120})["']/g)) {
    values.push(match[1].replace(/\s+/g, " ").trim());
  }

  return [...new Set(values)]
    .filter((value) => value && !value.includes("className"))
    .sort();
}

function analyzeFile(absPath, text) {
  const relPath = normalizeSlash(path.relative(root, absPath));
  const route =
    relPath.startsWith("app/") && relPath.endsWith("/page.tsx")
      ? "/" + relPath.replace(/^app\//, "").replace(/\/page\.tsx$/, "")
      : null;

  return {
    path: relPath,
    route: route === "/" ? "/" : route,
    imports: findAll(/from\s+["']([^"']+)["']/g, text),
    sideEffectImports: findAll(/import\s+["']([^"']+)["']/g, text),
    exportedTypes: findAll(/export\s+type\s+([A-Za-z0-9_]+)/g, text),
    exportedInterfaces: findAll(/export\s+interface\s+([A-Za-z0-9_]+)/g, text),
    exportedFunctions: findAll(/export\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)/g, text),
    exportedConsts: findAll(/export\s+const\s+([A-Za-z0-9_]+)/g, text),
    localTypes: findAll(/(?:^|\n)\s*type\s+([A-Za-z0-9_]+)/g, text),
    localFunctions: findAll(/(?:^|\n)\s*function\s+([A-Za-z0-9_]+)/g, text),
    reactHooks: findAll(/\b(use[A-Z][A-Za-z0-9_]*)\s*\(/g, text),
    visibleTexts: findVisibleTexts(text),
  };
}

async function main() {
  const files = [];

  for (const scanRoot of scanRoots) {
    const abs = path.join(root, scanRoot);
    if (await exists(abs)) {
      files.push(...await walk(abs));
    }
  }

  const analyzed = [];
  for (const file of files.sort()) {
    const text = await fs.readFile(file, "utf8");
    analyzed.push(analyzeFile(file, text));
  }

  await fs.mkdir(outputDir, { recursive: true });

  const snapshot = {
    generatedAt: new Date().toISOString(),
    root,
    fileCount: analyzed.length,
    routeCount: analyzed.filter((file) => file.route).length,
    files: analyzed,
  };

  await fs.writeFile(
    path.join(outputDir, "code-map-snapshot.json"),
    JSON.stringify(snapshot, null, 2)
  );

  await fs.writeFile(
    path.join(outputDir, "code-map-summary.md"),
    [
      "# Code Map Snapshot",
      "",
      `Generated: ${snapshot.generatedAt}`,
      `Files scanned: ${snapshot.fileCount}`,
      `Routes found: ${snapshot.routeCount}`,
      "",
      "## Routes",
      "",
      ...analyzed.filter((file) => file.route).map((file) => `- ${file.route} -> ${file.path}`),
      "",
    ].join("\n")
  );

  console.log("Code map snapshot complete.");
  console.log(`Files scanned: ${snapshot.fileCount}`);
  console.log(`Routes found: ${snapshot.routeCount}`);
  console.log("Visible text finder added.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
