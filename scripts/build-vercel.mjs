import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyStaticExport } from "./verify-static-export.mjs";

// A variável só existe no processo deste build; o desenvolvimento mantém seu perfil.
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const runner = fileURLToPath(new URL("./run-static-build.mjs", import.meta.url));
const build = spawnSync(process.execPath, [runner], {
  cwd: projectRoot,
  env: { ...process.env, PORTFOLIO_STATIC_EXPORT: "1" },
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
await verifyStaticExport();
