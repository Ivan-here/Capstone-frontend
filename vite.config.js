import { securityHeaders } from "./security-headers.js";
import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
  plugins: [react(), {
    name: "production-security-headers",
    generateBundle() {
      if (command === "build") this.emitFile({ type: "asset", fileName: "_headers", source: securityHeaders(env.VITE_API_BASE_URL) });
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/notifications-api": {
        target: "http://localhost:9000",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/notifications-api/, ""),
      },
    },
  },
};
});
