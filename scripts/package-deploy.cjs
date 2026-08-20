/**
 * package-deploy.cjs
 *
 * Script de build e empacotamento para deploy.
 * Gera sermao-deploy.zip pronto para upload no hosting.
 *
 * Uso: node scripts/package-deploy.cjs
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist-web");
const DEPLOY_ASSETS = path.join(ROOT, "deploy");
const PROXY_SRC = path.join(ROOT, "proxy", "openai.php");
const ZIP_NAME = "sermao-deploy.zip";
const ZIP_PATH = path.join(ROOT, ZIP_NAME);
const OUT_DIR = path.join(ROOT, "sermao-deploy");

function log(msg) {
  console.log(`\n✦ ${msg}`);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function syncUploadFolder() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });
  copyFile(path.join(DIST, "index.html"), path.join(OUT_DIR, "index.html"));
  copyDir(path.join(DIST, "assets"), path.join(OUT_DIR, "assets"));
  if (fs.existsSync(path.join(DIST, "bible"))) {
    copyDir(path.join(DIST, "bible"), path.join(OUT_DIR, "bible"));
  }
  if (fs.existsSync(ZIP_PATH)) {
    fs.copyFileSync(ZIP_PATH, path.join(OUT_DIR, ZIP_NAME));
  }
}

function makeZip() {
  if (fs.existsSync(ZIP_PATH)) fs.rmSync(ZIP_PATH);

  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Compress-Archive -Path '${DIST}\\*' -DestinationPath '${ZIP_PATH}' -Force"`,
      { cwd: ROOT, stdio: "inherit" }
    );
    return;
  }

  execSync(`zip -r "${ZIP_PATH}" . -x "*.DS_Store"`, {
    cwd: DIST,
    stdio: "inherit",
  });
}

function listTree() {
  const rows = ["   ├── index.html", "   ├── .htaccess", "   ├── LEIA-ME.txt", "   ├── assets/"];
  if (fs.existsSync(path.join(DIST, "bible"))) rows.push("   ├── bible/");
  if (fs.existsSync(path.join(DIST, "proxy", "openai.php"))) {
    rows.push("   └── proxy/");
    rows.push("       └── openai.php  ← não reenvie se a chave no servidor já está certa");
  }
  return rows.join("\n");
}

log("Fazendo build de produção (npm run build:web)…");
execSync("npm run build:web", { cwd: ROOT, stdio: "inherit" });

log("Copiando .htaccess…");
copyFile(path.join(DEPLOY_ASSETS, ".htaccess"), path.join(DIST, ".htaccess"));

log("Copiando LEIA-ME.txt…");
copyFile(path.join(DEPLOY_ASSETS, "LEIA-ME.txt"), path.join(DIST, "LEIA-ME.txt"));

if (fs.existsSync(PROXY_SRC)) {
  log("Copiando proxy/openai.php…");
  copyFile(PROXY_SRC, path.join(DIST, "proxy", "openai.php"));
} else {
  log("proxy/openai.php não encontrado — o zip sai sem proxy (não sobrescreva o do servidor).");
}

log(`Gerando ${ZIP_NAME}…`);
makeZip();

log("Copiando pasta sermao-deploy/ (pronta para upload)…");
syncUploadFolder();

if (fs.existsSync(ZIP_PATH) && fs.existsSync(path.join(OUT_DIR, "index.html"))) {
  const size = (fs.statSync(ZIP_PATH).size / 1024).toFixed(1);
  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓  Pacote gerado com sucesso!`);
  console.log(`   Pasta:   sermao-deploy/  ← envie index.html + assets/`);
  console.log(`   Zip:     sermao-deploy/${ZIP_NAME} (${size} KB)`);
  console.log(`   Sistema: ${os.platform()}`);
  console.log(`\n   Conteúdo do pacote:`);
  console.log(listTree());
  console.log(`${"═".repeat(50)}\n`);
} else {
  console.error("✗  Erro: o pacote de deploy não foi gerado.");
  process.exit(1);
}
