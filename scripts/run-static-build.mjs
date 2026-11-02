import { fileURLToPath } from "node:url";

const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), "build"];

if (process.platform === "win32") {
  // O CLI desta versão beta chama process.exit(0) com handles nativos em fechamento.
  // No Windows, deixa o Node encerrar naturalmente; erros continuam encerrando com falha.
  const immediateExit = process.exit.bind(process);
  process.exit = code => {
    if (code !== undefined && Number(code) !== 0) immediateExit(code);
    process.exitCode = 0;
  };
}
await import(cli.href);
