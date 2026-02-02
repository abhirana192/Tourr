import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "tours" | "staff" | "assignments";
  data: any;
}

/**
 * Initialize WebSocket server with HTTP server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Subscribe to real-time updates
    socket.on("subscribe", (table: string) => {
      socket.join(`table:${table}`);
      console.log(`[WebSocket] Client ${socket.id} subscribed to ${table}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

/**
 * Broadcast a database change to all connected clients
 */
export function broadcastChange(event: RealtimeEvent) {
  if (!io) {
    console.warn("[WebSocket] Server not initialized, cannot broadcast");
    return;
  }

  const room = `table:${event.table}`;
  console.log(
    `[WebSocket] Broadcasting ${event.type} on ${event.table} to room ${room}`
  );

  io.to(room).emit("change", event);
}

/**
 * Get the socket.io server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

export default io;
