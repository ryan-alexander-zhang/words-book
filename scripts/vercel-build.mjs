import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";

function run(command, args) {
  const executable = isWindows ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const isVercelPreview = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview";

if (isVercelPreview) {
  console.log("Skipping prisma migrate deploy for Vercel preview build.");
} else {
  run("npx", ["prisma", "migrate", "deploy"]);
}

run("npm", ["run", "build"]);
