import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getTours, createTour, updateTour, deleteTour, saveTourSchedule, getTourSchedule } from "./routes/tours";
import { getAllStaff, createStaff, updateStaff, deleteStaff } from "./routes/staff";
import { login, logout, getSession } from "./routes/auth";
import { initializeDemo } from "./routes/setup";

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

  // Debug endpoint
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      SUPABASE_URL: process.env.SUPABASE_URL ? "✓ set" : "✗ missing",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "✓ set" : "✗ missing",
      NODE_ENV: process.env.NODE_ENV,
    });
  });

  // Auth API routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/session", getSession);

  // Setup/initialization routes
  app.post("/api/setup/initialize-demo", initializeDemo);

  // Tour API routes
  app.get("/api/tours", getTours);
  app.get("/api/tours/:id/schedule", getTourSchedule);
  app.post("/api/tours", createTour);
  app.put("/api/tours/:id", updateTour);
  app.delete("/api/tours/:id", deleteTour);
  app.post("/api/tours/:id/schedule", saveTourSchedule);

  // Staff API routes
  app.get("/api/staff", getAllStaff);
  app.post("/api/staff", createStaff);
  app.put("/api/staff/:id", updateStaff);
  app.delete("/api/staff/:id", deleteStaff);

  return app;
}
