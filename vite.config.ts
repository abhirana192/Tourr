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
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Mount Express app as middleware for the Vite dev server
      // Use a custom middleware that only processes API routes
      return () => {
        server.middlewares.use((req, res, next) => {
          // Only pass API and specific routes to Express
          if (req.url?.startsWith("/api") || req.url?.startsWith("/demo")) {
            app(req, res, next);
          } else {
            // Let Vite handle everything else (static files, SPA routing, etc)
            next();
          }
        });
      };
    },
  };
}
