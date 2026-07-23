import "server-only";

import { mkdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { registerWorkspaceProject, type RegisterWorkspaceProjectResult } from "./workspaceProjectRegistry";

export type CreateWorkspaceProjectInput = {
  parentDirectory: string;
  projectName: string;
};

export type CreateWorkspaceProjectResult = RegisterWorkspaceProjectResult & {
  createdFiles: string[];
};

const namePattern = /^[a-z0-9][a-z0-9._-]{1,62}$/;

function validatedName(value: string): string {
  const name = value.trim().toLowerCase();
  if (!namePattern.test(name) || name === "." || name === "..") {
    throw new Error("Project name must be 2-63 lowercase letters, numbers, dots, underscores, or hyphens.");
  }
  return name;
}

async function validatedParent(value: string): Promise<string> {
  if (!value.trim()) throw new Error("A parent directory is required.");
  const parent = await realpath(path.resolve(value.trim()));
  const information = await stat(parent);
  if (!information.isDirectory()) throw new Error("The selected parent path is not a directory.");
  if (path.parse(parent).root === parent) throw new Error("Choose a specific development folder, not a filesystem root.");
  return parent;
}

export async function createWorkspaceTypeScriptProject(
  input: CreateWorkspaceProjectInput,
  hostRoot = process.cwd(),
): Promise<CreateWorkspaceProjectResult> {
  const parent = await validatedParent(input.parentDirectory);
  const projectName = validatedName(input.projectName);
  const destination = path.join(parent, projectName);
  const temporary = path.join(parent, `.${projectName}.workspace-creating-${process.pid}-${Date.now()}`);

  try {
    await stat(destination);
    throw new Error("The destination project folder already exists. Choose a new project name.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const packageJson = {
    name: projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      build: "tsc --noEmit",
      typecheck: "tsc --noEmit",
    },
    devDependencies: {
      typescript: "^5.9.0",
    },
  };
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      declaration: true,
      outDir: "dist",
      rootDir: "src",
      skipLibCheck: true,
    },
    include: ["src/**/*.ts"],
  };
  const source = `export type ProjectIdentity = {\n  name: string;\n  createdAt: string;\n};\n\nexport const projectIdentity: ProjectIdentity = {\n  name: ${JSON.stringify(projectName)},\n  createdAt: ${JSON.stringify(new Date().toISOString())},\n};\n`;
  const files = ["package.json", "tsconfig.json", ".gitignore", "src/index.ts"];

  try {
    await mkdir(path.join(temporary, "src"), { recursive: true });
    await Promise.all([
      writeFile(path.join(temporary, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, { encoding: "utf8", flag: "wx" }),
      writeFile(path.join(temporary, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`, { encoding: "utf8", flag: "wx" }),
      writeFile(path.join(temporary, ".gitignore"), "node_modules/\ndist/\n.env\n.env.local\n", { encoding: "utf8", flag: "wx" }),
      writeFile(path.join(temporary, "src", "index.ts"), source, { encoding: "utf8", flag: "wx" }),
    ]);
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }

  const registration = await registerWorkspaceProject(destination, hostRoot);
  return { ...registration, createdFiles: files };
}
