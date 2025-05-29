// src/lib/db.ts
import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGO_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || "fdz";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = client.connect();
}

export default clientPromise;

// Helper function to get a database instance
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}
