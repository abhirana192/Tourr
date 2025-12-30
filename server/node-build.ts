import { createServer, initializeServer } from "./index";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  try {
    // Initialize database first
    await initializeServer();

    // Then create and start the server
    const app = createServer();
    const port = process.env.PORT || 3000;

    // Check if spa files exist
    const spaPath = path.join(__dirname, "../spa");
    console.log(`[Startup] Checking for SPA files at: ${spaPath}`);
    if (fs.existsSync(spaPath)) {
      console.log(`[Startup] ✓ SPA directory found`);
      const indexPath = path.join(spaPath, "index.html");
      if (fs.existsSync(indexPath)) {
        console.log(`[Startup] ✓ index.html found`);
      } else {
        console.warn(`[Startup] ⚠ index.html NOT found at ${indexPath}`);
      }
    } else {
      console.warn(`[Startup] ⚠ SPA directory NOT found at ${spaPath}`);
      console.log(`[Startup] Working directory: ${process.cwd()}`);
      console.log(`[Startup] __dirname: ${__dirname}`);
    }

    app.listen(port, () => {
      console.log(`🚀 Fusion Starter server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error("[Startup] Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
