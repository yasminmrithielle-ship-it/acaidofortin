import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const deployDir = resolve(root, "dist");
const mobileDir = resolve(root, "apps/mobile");
const adminDir = resolve(root, "apps/admin");
const apiDir = resolve(root, "services/api");
const androidAssetsDir = resolve(root, "android-apk/assets");
const mobileDistDir = resolve(mobileDir, "dist");
const adminDistDir = resolve(adminDir, "dist");

const tscBin = require.resolve("typescript/bin/tsc");
const vitePackageJsonPath = require.resolve("vite/package.json");
const viteBin = resolve(dirname(vitePackageJsonPath), "bin/vite.js");

function runNodeScript(scriptPath, args, cwd) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd,
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

function copyMobileBuildToAndroidAssets() {
  if (!existsSync(resolve(root, "android-apk"))) {
    return;
  }

  rmSync(androidAssetsDir, { recursive: true, force: true });
  copyDirectoryContents(mobileDistDir, androidAssetsDir);

  const indexPath = resolve(androidAssetsDir, "index.html");
  const indexHtml = readFileSync(indexPath, "utf8")
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll('href="/assets/', 'href="./assets/');

  writeFileSync(indexPath, indexHtml);
}

runNodeScript(tscBin, ["-b"], mobileDir);
runNodeScript(viteBin, ["build"], mobileDir);
copyMobileBuildToAndroidAssets();
runNodeScript(tscBin, ["-b"], adminDir);
runNodeScript(viteBin, ["build"], adminDir);
runNodeScript(tscBin, ["-p", "tsconfig.json"], apiDir);

rmSync(deployDir, { recursive: true, force: true });
copyDirectoryContents(mobileDistDir, deployDir);
copyDirectoryContents(adminDistDir, resolve(deployDir, "admin"));
