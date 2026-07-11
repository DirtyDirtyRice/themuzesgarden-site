import fs from "node:fs/promises";
import path from "node:path";

const target = path.join(process.cwd(), "scripts", "code-symbol-watch.mjs");
let text = await fs.readFile(target, "utf8");

const helper = String.raw`
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
`;

if (!text.includes("function findMissingRequiredProps")) {
  text = text.replace(
    "function analyzeFile(absPath, text) {",
    helper + "\nfunction analyzeFile(absPath, text) {"
  );
}

if (!text.includes("findings.push(...findMissingRequiredProps(relPath, text));")) {
  text = text.replace(
    "  return findings;\n}",
    "  findings.push(...findMissingRequiredProps(relPath, text));\n\n  return findings;\n}"
  );
}

await fs.writeFile(target, text);
console.log("Added missing required prop watch.");