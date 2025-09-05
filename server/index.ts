/**
 * TranscendBody - Main Server Entry Point
 * 
 * This file sets up the Express.js server with all necessary middleware,
 * session management, and route configuration for the personal transformation
 * tracking application.
 * 
 * Features:
 * - Session-based authentication
 * - Request logging and monitoring
 * - Static file serving
 * - Error handling
 * - EJS template engine setup
 */

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { setupAuthentication } from "./auth.js";
import router from "./routes.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication (includes session middleware)
setupAuthentication(app);

// Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch (error) {
          logLine += ` :: [Response body could not be serialized]`;
        }
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Set view engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

// Main Router
app.use("/", router);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error("Error handler:", String(err));
  throw err;
});

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;
app.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});

