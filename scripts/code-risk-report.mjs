import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const snapshotPath = path.join(root, "code-map-reports", "code-map-snapshot.json");
const outputPath = path.join(root, "code-map-reports", "code-risk-report.json");

function normalizeSlash(value) {
  return value.replaceAll("\\", "/");
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function importKey(filePath) {
  const clean = filePath.replace(/\.(tsx|ts|jsx|js)$/, "");
  return clean.split("/").at(-1);
}

function looksLikeStateName(name) {
  return /open|active|selected|mode|view|menu|visible|enabled/i.test(name);
}

function findPossiblyUnrenderedNames(file, allText) {
  const names = [
    ...file.exportedConsts,
    ...file.exportedFunctions,
    ...(file.localTypes ?? []),
    ...file.exportedTypes,
    ...file.exportedInterfaces,
  ];

  return names
    .map((name) => ({
      name,
      count: countOccurrences(allText, name),
    }))
    .filter((item) => item.count <= 1 || looksLikeStateName(item.name));
}

async function main() {
  const raw = await fs.readFile(snapshotPath, "utf8");
  const snapshot = JSON.parse(raw);
  const files = snapshot.files ?? [];

  const allText = files
    .map((file) =>
      [
        file.path,
        file.route ?? "",
        ...(file.imports ?? []),
        ...(file.sideEffectImports ?? []),
        ...(file.exportedTypes ?? []),
        ...(file.exportedInterfaces ?? []),
        ...(file.exportedFunctions ?? []),
        ...(file.exportedConsts ?? []),
        ...(file.localTypes ?? []),
        ...(file.localFunctions ?? []),
        ...(file.reactHooks ?? []),
        ...(file.visibleTexts ?? []),
      ].join(" ")
    )
    .join("\n");

  const importFollowers = files.map((file) => {
    const key = importKey(file.path);
    const followers = files
      .filter((candidate) => candidate.path !== file.path)
      .filter((candidate) => (candidate.imports ?? []).some((item) => item.includes(key)))
      .map((candidate) => candidate.path);

    return {
      path: file.path,
      key,
      followers,
    };
  });

  const exportedButNoFollowers = importFollowers
    .filter((item) => item.followers.length === 0)
    .filter((item) => {
      const file = files.find((candidate) => candidate.path === item.path);
      return file && (
        (file.exportedTypes ?? []).length ||
        (file.exportedInterfaces ?? []).length ||
        (file.exportedFunctions ?? []).length ||
        (file.exportedConsts ?? []).length
      );
    })
    .slice(0, 200);

  const routes = files.filter((file) => file.route);
  const routeOrphans = routes
    .filter((routeFile) => countOccurrences(allText, routeFile.route) <= 1)
    .map((routeFile) => ({
      route: routeFile.route,
      path: routeFile.path,
    }))
    .slice(0, 200);

  const unusedTypeWatch = files
    .flatMap((file) =>
      [
        ...(file.localTypes ?? []),
        ...(file.exportedTypes ?? []),
        ...(file.exportedInterfaces ?? []),
      ].map((name) => ({
        name,
        path: file.path,
        count: countOccurrences(allText, name),
      }))
    )
    .filter((item) => item.count <= 1)
    .slice(0, 200);

  const missingRenderWatch = files
    .map((file) => ({
      path: file.path,
      warnings: findPossiblyUnrenderedNames(file, allText),
    }))
    .filter((item) => item.warnings.length)
    .slice(0, 200);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      filesScanned: files.length,
      exportedButNoFollowers: exportedButNoFollowers.length,
      routeOrphans: routeOrphans.length,
      unusedTypeWatch: unusedTypeWatch.length,
      missingRenderWatch: missingRenderWatch.length,
    },
    exportedButNoFollowers,
    routeOrphans,
    unusedTypeWatch,
    missingRenderWatch,
  };

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

  console.log("Code risk report complete.");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Exported/no followers: ${exportedButNoFollowers.length}`);
  console.log(`Route orphans: ${routeOrphans.length}`);
  console.log(`Unused type watch: ${unusedTypeWatch.length}`);
  console.log(`Missing render watch: ${missingRenderWatch.length}`);
  console.log(`Report: ${normalizeSlash(path.relative(root, outputPath))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
