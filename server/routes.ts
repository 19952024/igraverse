import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // All API routes should be prefixed with /api
  const router = createServer();

  app.post(
    "/api/auth/signup",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parseResult = insertUserSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({ message: "Invalid payload" });
        }

        const { username, password } = parseResult.data;

        const existing = await storage.getUserByUsername(username);
        if (existing) {
          return res.status(409).json({ message: "Username already taken" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await storage.createUser({
          username,
          password: passwordHash,
        });

        // Never send password/hash back to client
        const { password: _ignored, ...safeUser } = user;

        return res.status(201).json({ user: safeUser });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    "/api/auth/signin",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password } = req.body ?? {};
        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          !username ||
          !password
        ) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

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
    },
  );

  return httpServer;
}

