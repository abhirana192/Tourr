import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleDemo } from "./routes/demo";
import { getTours, createTour, updateTour, deleteTour } from "./routes/tours";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Tour API routes
  app.get("/api/tours", getTours);
  app.post("/api/tours", createTour);
  app.put("/api/tours/:id", updateTour);
  app.delete("/api/tours/:id", deleteTour);

  // SPA fallback: Serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    const indexPath = path.join(__dirname, "../dist/spa/index.html");
    res.sendFile(indexPath, { root: "." }, (err) => {
      if (err) {
        res.status(404).json({ error: "Not found" });
      }
    });
  });

  return app;
}
