import { MongoClient, type Db, type Collection, ServerApiVersion } from "mongodb";
import type { User } from "@shared/schema";

let client: MongoClient | null = null;
let db: Db | null = null;

const DEFAULT_URI = "mongodb://127.0.0.1:27017/igraverse";

async function getClient(): Promise<MongoClient> {
  if (client) return client;

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db();
  return client;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  await getClient();
  return db!;
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const database = await getDb();
  return database.collection<User>("users");
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

