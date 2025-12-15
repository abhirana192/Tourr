import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getTours, createTour, updateTour, deleteTour, saveTourSchedule, getTourSchedule } from "./routes/tours";

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
  app.get("/api/tours/:id/schedule", getTourSchedule);
  app.post("/api/tours", createTour);
  app.put("/api/tours/:id", updateTour);
  app.delete("/api/tours/:id", deleteTour);
  app.post("/api/tours/:id/schedule", saveTourSchedule);

  return app;
}
