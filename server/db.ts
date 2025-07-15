import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg'; // <-- CHANGÉ ICI : Importation par défaut de 'pg'
const { Pool } = pkg; // <-- CHANGÉ ICI : Déstructuration de Pool depuis l'objet importé

// import ws from "ws"; // Déjà commenté/supprimé, c'est bien
import * as schema from "../shared/schema"; // Chemin corrigé, c'est bien

// neonConfig.webSocketConstructor = ws; // Déjà commenté/supprimé, c'est bien

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Ajout de la configuration SSL, crucial pour Render en production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
export const db = drizzle({ client: pool, schema });