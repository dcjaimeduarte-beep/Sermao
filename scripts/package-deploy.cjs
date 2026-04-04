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

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist-web");
const DEPLOY_ASSETS = path.join(ROOT, "deploy");
const PROXY_SRC = path.join(ROOT, "proxy", "openai.php");
const ZIP_NAME = "sermao-deploy.zip";
const ZIP_PATH = path.join(ROOT, ZIP_NAME);

function log(msg) {
  console.log(`\n✦ ${msg}`);
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ── 1. Build de produção ──────────────────────────────────────────
log("Fazendo build de produção (npm run build:web)…");
execSync("npm run build:web", { cwd: ROOT, stdio: "inherit" });

// ── 2. Copiar .htaccess para dist-web/ ───────────────────────────
log("Copiando .htaccess…");
copyFile(
  path.join(DEPLOY_ASSETS, ".htaccess"),
  path.join(DIST, ".htaccess")
);

// ── 3. Copiar LEIA-ME.txt para dist-web/ ─────────────────────────
log("Copiando LEIA-ME.txt…");
copyFile(
  path.join(DEPLOY_ASSETS, "LEIA-ME.txt"),
  path.join(DIST, "LEIA-ME.txt")
);

// ── 4. Copiar proxy/ para dist-web/proxy/ ────────────────────────
log("Copiando proxy/openai.php…");
copyFile(PROXY_SRC, path.join(DIST, "proxy", "openai.php"));

// ── 5. Gerar .zip com PowerShell ─────────────────────────────────
log(`Gerando ${ZIP_NAME}…`);

// Remove zip anterior se existir
if (fs.existsSync(ZIP_PATH)) {
  fs.rmSync(ZIP_PATH);
}

// PowerShell: compacta o conteúdo de dist-web/ no zip
execSync(
  `powershell -Command "Compress-Archive -Path '${DIST}\\*' -DestinationPath '${ZIP_PATH}' -Force"`,
  { cwd: ROOT, stdio: "inherit" }
);

// ── 6. Verificação final ──────────────────────────────────────────
if (fs.existsSync(ZIP_PATH)) {
  const size = (fs.statSync(ZIP_PATH).size / 1024).toFixed(1);
  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓  Pacote gerado com sucesso!`);
  console.log(`   Arquivo: ${ZIP_NAME} (${size} KB)`);
  console.log(`   Local:   ${ZIP_PATH}`);
  console.log(`\n   Conteúdo do pacote:`);
  console.log(`   ├── index.html`);
  console.log(`   ├── .htaccess`);
  console.log(`   ├── LEIA-ME.txt`);
  console.log(`   ├── assets/`);
  console.log(`   └── proxy/`);
  console.log(`       └── openai.php  ← edite antes de enviar!`);
  console.log(`${"═".repeat(50)}\n`);
} else {
  console.error("✗  Erro: o arquivo .zip não foi gerado.");
  process.exit(1);
}
