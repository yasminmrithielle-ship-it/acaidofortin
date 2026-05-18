import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const deployDir = resolve(root, "dist");
const mobileDir = resolve(root, "apps/mobile");
const adminDir = resolve(root, "apps/admin");
const androidAssetsDir = resolve(root, "android-apk/assets");
const mobileDistDir = resolve(mobileDir, "dist");
const adminDistDir = resolve(adminDir, "dist");

const tscBin = require.resolve("typescript/bin/tsc");
const vitePackageJsonPath = require.resolve("vite/package.json");
const viteBin = resolve(dirname(vitePackageJsonPath), "bin/vite.js");

if (typeof process.loadEnvFile === "function") {
  const preservedEnv = {
    VITE_API_URL: process.env.VITE_API_URL,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
  };

  for (const envFileName of [".env", ".env.local"]) {
    const envFilePath = resolve(root, envFileName);
    if (existsSync(envFilePath)) {
      process.loadEnvFile(envFilePath);
    }
  }

  if (preservedEnv.VITE_API_URL) {
    process.env.VITE_API_URL = preservedEnv.VITE_API_URL;
  }

  if (preservedEnv.EXPO_PUBLIC_API_URL) {
    process.env.EXPO_PUBLIC_API_URL = preservedEnv.EXPO_PUBLIC_API_URL;
  }
}

const sharedBuildEnv = {
  ...process.env,
  VITE_API_URL: process.env.VITE_API_URL ?? process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? process.env.VITE_API_URL
};

function runNodeScript(scriptPath, args, cwd) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd,
    stdio: "inherit",
    env: sharedBuildEnv
  });
}

function copyDirectoryContents(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);

    if (!existsSync(sourcePath)) {
      continue;
    }

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

rmSync(deployDir, { recursive: true, force: true });
copyDirectoryContents(mobileDistDir, deployDir);
copyDirectoryContents(adminDistDir, resolve(deployDir, "admin"));
