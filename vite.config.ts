import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();

      // Add Express as middleware DIRECTLY to the middlewares chain
      // This will run before Vite's SPA fallback
      server.middlewares.use((req: any, res: any, next: any) => {
        try {
          // Only handle API and demo routes with Express
          if (req?.url?.startsWith("/api") || req?.url?.startsWith("/demo")) {
            app(req, res, next);
          } else {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
  };
}
