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
  let baseApp: any;

  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      baseApp = createServer();

      // This function runs AFTER Vite's built-in middleware
      // Return a post-middleware that checks for API routes
      return (req: any, res: any, next: any) => {
        // Only handle API routes with Express
        if (req.url?.startsWith("/api") || req.url?.startsWith("/demo")) {
          baseApp(req, res);
        } else {
          next();
        }
      };
    },
  };
}
