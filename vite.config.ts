import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function omitUnusedBibleOriginal() {
  return {
    name: "omit-bible-original",
    closeBundle() {
      const dir = path.resolve(__dirname, "dist-web", "bible", "original");
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), omitUnusedBibleOriginal()],
  server: {
    // No Windows, "localhost" no Node cai em ::1 e o navegador tenta 127.0.0.1.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist-web",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
