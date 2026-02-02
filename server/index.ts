import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { initializeDatabase } from "./postgres-db";
import { initializeWebSocket } from "./websocket";
import { handleDemo } from "./routes/demo";
import { getTours, createTour, updateTour, deleteTour, saveTourSchedule, getTourSchedule, translateText } from "./routes/tours";
import { getAllStaff, createStaff, updateStaff, deleteStaff } from "./routes/staff";
import { login, logout, getSession } from "./routes/auth";
import { initializeDemo, initializePasswords } from "./routes/setup";
import { getAssignments, saveAssignment, deleteAssignment } from "./routes/assignments";
import { debugStatus, debugCreateAdminManual } from "./routes/debug";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbReady = false;

export async function initializeServer() {
  try {
    await initializeDatabase();
    dbReady = true;
    console.log("[Server] PostgreSQL database initialized and ready");
  } catch (error) {
    console.error("[Server] Failed to initialize database:", error);
    throw error;
  }
}

export function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize WebSocket server
  initializeWebSocket(httpServer);

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from the client build directory
  const clientBuildPath = path.join(__dirname, "../spa");
  console.log(`[Server] Serving static files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Debug endpoints
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      SUPABASE_URL: process.env.SUPABASE_URL ? "✓ set" : "✗ missing",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "✓ set" : "✗ missing",
      NODE_ENV: process.env.NODE_ENV,
    });
  });

  app.get("/api/debug/status", debugStatus);
  app.post("/api/debug/create-admin", debugCreateAdminManual);


  // API routes MUST come before the SPA fallback
  // Auth API routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/session", getSession);

  // Setup/initialization routes
  app.post("/api/setup/initialize-demo", initializeDemo);
  app.post("/api/setup/initialize-passwords", initializePasswords);

  // Tour API routes
  app.get("/api/tours", getTours);
  app.get("/api/tours/:id/schedule", getTourSchedule);
  app.post("/api/tours", createTour);
  app.put("/api/tours/:id", updateTour);
  app.patch("/api/tours/:id", updateTour);
  app.delete("/api/tours/:id", deleteTour);
  app.post("/api/tours/:id/schedule", saveTourSchedule);
  app.post("/api/translate", translateText);

  // Staff API routes
  app.get("/api/staff", getAllStaff);
  app.post("/api/staff", createStaff);
  app.put("/api/staff/:id", updateStaff);
  app.delete("/api/staff/:id", deleteStaff);

  // Activity Assignment API routes
  app.get("/api/assignments", getAssignments);
  app.post("/api/assignments", saveAssignment);
  app.delete("/api/assignments/:id", deleteAssignment);

  // SPA Fallback - serve index.html for all non-API routes
  // This allows client-side routing to work properly
  // MUST BE LAST - catch-all route
  app.use((_req, res) => {
    const indexPath = path.join(clientBuildPath, "index.html");
    console.log(`[Server] SPA fallback: serving ${indexPath}`);
    try {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Server] Error sending file ${indexPath}:`, err.message);
          res.status(404).json({ error: "Application files not found" });
        }
      });
    } catch (err) {
      console.error(`[Server] Error in SPA fallback:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return { app, httpServer };
}
