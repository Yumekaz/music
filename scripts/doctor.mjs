import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function readCommand(command, args, fallbacks = []) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    for (const fallback of fallbacks) {
      try {
        return execFileSync(fallback, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      } catch {
        // Try the next fallback.
      }
    }
  }
  return "";
}

function readEnvFiles() {
  const env = {};
  for (const relativePath of [".env", path.join("server", ".env")]) {
    const filePath = path.join(root, relativePath);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
  return env;
}

function readNpmVersion() {
  const pathVersion = readCommand("npm", ["--version"], ["npm.cmd"]);
  if (pathVersion) return pathVersion;
  if (process.env.npm_execpath) {
    return readCommand(process.execPath, [process.env.npm_execpath, "--version"]);
  }
  return "";
}

const npmVersion = readNpmVersion();
check("Node", Boolean(process.version), process.version);
check("npm", Boolean(npmVersion), npmVersion || "npm not found");

try {
  fs.accessSync(path.join(root, "client", "vite.config.js"), fs.constants.R_OK);
  check("Vite config", true, "client/vite.config.js readable");
} catch (error) {
  check("Vite config", false, error.message);
}

const envFile = readEnvFiles();
const providerKeys = {
  YOUTUBE_API_KEY: Boolean(process.env.YOUTUBE_API_KEY || envFile.YOUTUBE_API_KEY),
  JAMENDO_CLIENT_ID: Boolean(process.env.JAMENDO_CLIENT_ID || envFile.JAMENDO_CLIENT_ID),
  LASTFM_API_KEY: Boolean(process.env.LASTFM_API_KEY || envFile.LASTFM_API_KEY),
  TASTEDIVE_API_KEY: Boolean(process.env.TASTEDIVE_API_KEY || envFile.TASTEDIVE_API_KEY)
};

check(
  "Provider env",
  true,
  Object.entries(providerKeys)
    .map(([key, present]) => `${key}=${present ? "set" : "missing"}`)
    .join(", ")
);

const sslBackend = readCommand("git", ["config", "--get", "http.sslBackend"]);
check(
  "Git SSL backend",
  sslBackend === "schannel",
  sslBackend ? `${sslBackend}${sslBackend === "schannel" ? "" : " (hint: schannel has worked best here)"}` : "not set; hint: git -c http.sslBackend=schannel push origin main"
);

check(
  "OneDrive path",
  !/OneDrive/i.test(root),
  /OneDrive/i.test(root)
    ? "Repo is inside OneDrive; Vite/esbuild may hit Windows access-denied errors"
    : "Repo is outside OneDrive"
);

console.log("Music app doctor\n");
for (const item of checks) {
  console.log(`${item.ok ? "OK  " : "WARN"} ${item.name}: ${item.detail}`);
}

const hardFailures = checks.filter((item) => !item.ok && item.name === "Vite config");
process.exitCode = hardFailures.length ? 1 : 0;
