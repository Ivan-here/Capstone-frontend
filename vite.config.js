import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/notifications-api": {
        target: "http://localhost:8085",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/notifications-api/, ""),
      },
    },
  },
});