const fs = require("node:fs");
const path = require("node:path");

const dist = path.join(__dirname, "..", "dist");
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(
  path.join(dist, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 0)
);
