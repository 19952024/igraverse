import express, { type Request, Response, NextFunction } from "express";
import { serveStatic } from "./static";
import { createServer } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auth routes (MongoDB-backed via storage)
  app.post("/api/auth/signup", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      let { username, password } = parseResult.data;

      // Normalize username so signup/signin treat logically identical inputs the same.
      username = username.trim().toLowerCase();

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: passwordHash,
      });

      const { password: _ignored, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/signin", async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { username, password } = req.body ?? {};
      if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username ||
        !password
      ) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Apply the same normalization as during signup.
      username = username.trim().toLowerCase();

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _ignored, ...safeUser } = user;
      return res.status(200).json({ user: safeUser });
    } catch (err) {
      next(err);
    }
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.on("error", (err: any) => {
    if (err && err.code === "EADDRINUSE") {
      log(
        `port ${port} is already in use – server is probably already running`,
      );
      // Exit successfully so the second dev/start doesn't look like a crash
      process.exit(0);
    }

    console.error("HTTP server error:", err);
    process.exit(1);
  });

  httpServer.listen(
    {
      port,
      host: "127.0.0.1",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
