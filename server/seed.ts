// server/seed.ts ou server/seed.mts
import { db, pool } from './db'; // Assurez-vous que le chemin est correct vers votre fichier db.ts
import { users } from '../shared/schema'; // Chemin vers votre schéma d'utilisateurs
import { eq } from 'drizzle-orm'; // Pour la clause where
import bcrypt from 'bcrypt'; // Assurez-vous d'avoir installé bcrypt: npm install bcrypt

async function seedDatabase() {
  console.log('Démarrage du seeding de la base de données...');
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'VotreMotDePasseSuperSecure'; // *** TRÈS IMPORTANT : CHOISISSEZ UN MOT DE PASSE SÉCURISÉ ***
    const saltRounds = 10; // Doit correspondre à la logique de hachage de votre backend

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Vérifier si l'utilisateur admin existe déjà pour éviter les doublons
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        id: 'votre_uuid_unique_ici', // Générez un UUID (e.g., crypto.randomUUID() si Node.js 16+, ou `gen_random_uuid()` si Postgre)
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin', // Assurez-vous que ce rôle existe dans votre schéma
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Utilisateur admin par défaut créé avec succès.');
    } else {
      console.log('Utilisateur admin par défaut existe déjà, pas de création nécessaire.');
    }

    console.log('Seeding de la base de données terminé.');
  } catch (error) {
    console.error('Erreur lors du seeding de la base de données:', error);
    process.exit(1); // Quitter en cas d'erreur
  } finally {
    // C'est important de fermer la pool de connexion après le seeding
    // si le script doit se terminer (ce qui est le cas pour un seed script).
    if (pool) {
      await pool.end();
    }
  }
}

seedDatabase();