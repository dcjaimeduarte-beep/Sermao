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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const name of fs.readdirSync(DIST)) {
    const from = path.join(DIST, name);
    const to = path.join(OUT_DIR, name);
    if (fs.statSync(from).isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

function makeZip() {
  if (fs.existsSync(ZIP_PATH)) fs.rmSync(ZIP_PATH);

  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Compress-Archive -Path '${OUT_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`,
      { cwd: ROOT, stdio: "inherit" }
    );
    return;
  }

  execSync(`zip -r "${ZIP_PATH}" . -x "*.DS_Store"`, {
    cwd: OUT_DIR,
    stdio: "inherit",
  });
}

function listTree() {
  if (!fs.existsSync(OUT_DIR)) return "   (pasta vazia)";
  return fs
    .readdirSync(OUT_DIR)
    .filter((name) => name !== ZIP_NAME)
    .map((name) => `   ├── ${name}${fs.statSync(path.join(OUT_DIR, name)).isDirectory() ? "/" : ""}`)
    .join("\n");
}

log("Fazendo build de produção (npm run build:web)…");
execSync("npm run build:web", { cwd: ROOT, stdio: "inherit" });

log("Copiando .htaccess…");
copyFile(path.join(DEPLOY_ASSETS, ".htaccess"), path.join(DIST, ".htaccess"));

const userIni = path.join(DEPLOY_ASSETS, ".user.ini");
if (fs.existsSync(userIni)) {
  log("Copiando .user.ini (post_max_size)…");
  copyFile(userIni, path.join(DIST, ".user.ini"));
}
const proxyIni = path.join(ROOT, "proxy", ".user.ini");
if (fs.existsSync(proxyIni)) {
  copyFile(proxyIni, path.join(DIST, "proxy", ".user.ini"));
}

log("Copiando LEIA-ME.txt…");
copyFile(path.join(DEPLOY_ASSETS, "LEIA-ME.txt"), path.join(DIST, "LEIA-ME.txt"));

const deployPhpIni = path.join(DEPLOY_ASSETS, "php.ini");
if (fs.existsSync(deployPhpIni)) {
  log("Copiando php.ini…");
  copyFile(deployPhpIni, path.join(DIST, "php.ini"));
}

if (fs.existsSync(path.join(ROOT, "proxy"))) {
  log("Copiando pasta proxy/ (vai junto para substituir no ar)…");
  for (const name of fs.readdirSync(path.join(ROOT, "proxy"))) {
    if (name.endsWith(".example")) continue;
    copyFile(path.join(ROOT, "proxy", name), path.join(DIST, "proxy", name));
  }
}

log("Montando pasta sermao-deploy/ pronta para enviar por cima…");
syncUploadFolder();

log(`Gerando ${ZIP_NAME} na raiz (não entra na pasta de upload)…`);
makeZip();

if (fs.existsSync(ZIP_PATH) && fs.existsSync(path.join(OUT_DIR, "index.html"))) {
  const size = (fs.statSync(ZIP_PATH).size / 1024).toFixed(1);
  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓  Pacote gerado com sucesso!`);
  console.log(`   Pasta:   sermao-deploy/  ← mande esta pasta inteira por cima da que está no ar`);
  console.log(`   Zip:     ${ZIP_NAME} na raiz do projeto (${size} KB) — não precisa enviar`);
  console.log(`   Sistema: ${os.platform()}`);
  console.log(`\n   Conteúdo do pacote:`);
  console.log(listTree());
  console.log(`${"═".repeat(50)}\n`);
} else {
  console.error("✗  Erro: o pacote de deploy não foi gerado.");
  process.exit(1);
}
