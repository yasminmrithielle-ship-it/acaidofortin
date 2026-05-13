import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const deployDir = resolve(root, "dist");
const mobileDistDir = resolve(root, "apps/mobile/dist");
const adminDistDir = resolve(root, "apps/admin/dist");

function run(command) {
  execSync(command, {
    cwd: root,
    stdio: "inherit"
  });
}

function copyDirectoryContents(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }

    cpSync(sourcePath, targetPath, { force: true });
  }
}

rmSync(deployDir, { recursive: true, force: true });

run("npm run build:web --workspace @fortin/mobile");
run("npm run build --workspace @fortin/admin");

copyDirectoryContents(mobileDistDir, deployDir);
copyDirectoryContents(adminDistDir, resolve(deployDir, "admin"));
