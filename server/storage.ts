import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { getUsersCollection } from "./mongo";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

/**
 * In-memory storage implementation, primarily useful for tests or
 * running the app without any external database.
 */
export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

/**
 * MongoDB-backed storage implementation.
 */
export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const users = await getUsersCollection();
    const doc = await users.findOne({ id });
    return doc ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await getUsersCollection();
    const doc = await users.findOne({ username });
    return doc ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await getUsersCollection();
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    await users.insertOne(user);
    return user;
  }
}

// Use MongoDB storage by default in the running application.
export const storage: IStorage = new MongoStorage();

