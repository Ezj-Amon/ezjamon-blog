import { cpSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

process.env.CMS_BUILD = "true";

const run = command => {
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("astro check");
run("astro build");
run("pagefind --site dist/client");

rmSync("public/pagefind", { recursive: true, force: true });
cpSync("dist/client/pagefind", "public/pagefind", { recursive: true });
