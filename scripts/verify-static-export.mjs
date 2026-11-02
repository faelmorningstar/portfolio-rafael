import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist", "client");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
async function filesAt(directory, prefix = "") {
  const files = [];
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix + item.name;
    if (item.isDirectory()) files.push(...await filesAt(path.join(directory, item.name), relative + "/"));
    else files.push(relative);
  }
  return files;
}

export async function verifyStaticExport({ checkHTTP = false } = {}) {
  const files = await filesAt(output), exactPaths = new Set(files);
  assert.ok(exactPaths.has("index.html"), "Faltou index.html: dist/client sozinho não comprova uma exportação estática.");
  assert.ok(files.some(file => file.endsWith(".js")), "Faltou JavaScript de hidratação.");
  assert.ok(files.some(file => file.endsWith(".css")), "Faltou CSS de produção.");
  const forbidden = /(^|\/)(refer[eê]ncias|diagnostics|comparacao-fontes|server|app)(\/|\.|$)/i;
  assert.ok(!files.some(file => forbidden.test(file)), "Há referências, páginas temporárias ou arquivos de servidor na saída pública.");
  const publicFiles = await filesAt(path.join(root, "public"));
  for (const file of publicFiles) {
    assert.ok(exactPaths.has(file), `Asset ausente ou com capitalização diferente: ${file}`);
    assert.equal(hash(await fs.readFile(path.join(output, file))), hash(await fs.readFile(path.join(root, "public", file))), `Asset alterado: ${file}`);
  }
  const requested = new Set(["/"]);
  const inspectURL = (value, file) => {
    if (!value || /^(?:data:|https?:|mailto:|tel:|#|javascript:)/i.test(value)) return;
    const url = new URL(value, `https://export.invalid/${file}`);
    const relative = decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
    assert.ok(exactPaths.has(relative), `Caminho inexistente em ${file}: ${value}`);
    requested.add(url.pathname);
  };
  for (const file of files.filter(file => /\.(html|css|js)$/.test(file))) {
    const text = await fs.readFile(path.join(output, file), "utf8");
    assert.ok(!text.includes("Comparação temporária das fontes"), `Página temporária entrou em ${file}`);
    if (file.endsWith(".html")) {
      assert.ok(!text.includes("/@vite/client"), "A saída contém o cliente de desenvolvimento.");
      for (const match of text.matchAll(/\s(?:src|href)="([^"]+)"/g)) inspectURL(match[1].replaceAll("&amp;", "&"), file);
    }
    if (file.endsWith(".css")) for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) inspectURL(match[1].trim(), file);
  }
  // Estes arquivos são escolhidos pelo JavaScript durante os efeitos, não só pelo HTML.
  for (const file of ["rafael.png", "dragon-approved.png", "hybrid-portrait-approved.png", "Alchemion-Demo.ttf", "Centaur MT Oldstyle Figures Bold Italic.otf", "cursors/feather.png", "cursors/sword.png", "cursors/eye-0.png", "cursors/eye-1.png", "cursors/eye-2.png"]) {
    assert.ok(exactPaths.has(file), `Asset dinâmico ausente: ${file}`); requested.add("/" + file.split("/").map(encodeURIComponent).join("/"));
  }
  if (checkHTTP) await verifyHTTP(requested, exactPaths);
  console.log(`Exportação validada: ${files.length} arquivos; HTML, CSS, hidratação, imagens, fontes e cursores presentes; nenhuma referência ou página temporária pública.`);
}

async function verifyHTTP(requested, exactPaths) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".otf": "font/otf" };
  // Serve somente o artefato exportado, sem o dev server ou fallback de SPA.
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      const file = decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
      if (!exactPaths.has(file)) { response.writeHead(404); response.end("Not found"); return; }
      const bytes = await fs.readFile(path.join(output, file));
      response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }); response.end(bytes);
    } catch { response.writeHead(500); response.end("Error"); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const url of requested) {
      const response = await fetch(origin + url); assert.equal(response.status, 200, url);
      const file = decodeURIComponent(url).replace(/^\//, "") || "index.html";
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(await fs.readFile(path.join(output, file))), url);
    }
    for (const url of ["/comparacao-fontes", "/comparacao-fontes.html", "/referencias/", "/refer%C3%AAncias/", "/diagnostics/font-comparison.tsx"]) assert.equal((await fetch(origin + url)).status, 404, url);
    console.log(`HTTP de produção validado: ${requested.size} caminhos retornam 200 com bytes corretos; rotas locais retornam 404.`);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await verifyStaticExport({ checkHTTP: process.argv.includes("--http") });
