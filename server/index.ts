import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createDefaultSuperAdmin } from "./super-admin-init";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function createDefaultAdmin() {
  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      // Create default admin user
      await storage.createUser({
        username: "admin",
        password: "admin123", // Will be hashed by storage
        role: "admin"
      });
      log("✓ Default admin user created: admin / admin123");
    }
  } catch (error) {
    log("Error creating default admin: " + (error as Error).message);
  }
}

async function initializeSystemSettings() {
  try {
    // Vérifier si le paramètre app_name existe déjà
    const appNameSetting = await storage.getSystemSetting("app_name");
    if (!appNameSetting) {
      await storage.createSystemSetting({
        key: "app_name",
        value: "Restaurant Manager",
        description: "Nom personnalisé de l'application",
        category: "branding"
      });
      log("✓ System setting app_name initialized");
    }
  } catch (error) {
    log("Error initializing system settings: " + (error as Error).message);
  }
}

(async () => {
  // Create default admin user
  await createDefaultAdmin();
  await createDefaultSuperAdmin();
  await initializeSystemSettings();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment (Render) or default to 5000 (Replit)
  // this serves both the API and the client.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
