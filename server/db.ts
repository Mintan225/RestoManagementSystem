import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
// import ws from "ws"; // <--- REMOVE OR COMMENT OUT THIS LINE
import * as schema from "../shared/schema";

// neonConfig.webSocketConstructor = ws; // <--- REMOVE OR COMMENT OUT THIS LINE

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add SSL configuration for Render if your DATABASE_URL includes sslmode=require
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
export const db = drizzle({ client: pool, schema });