# Restaurant Management System

Un système de gestion de restaurant complet avec interface client QR code, tableau de bord administrateur, et intégration Mobile Money pour les marchés africains.

## Fonctionnalités

### 🍽️ Gestion Restaurant
- **Produits & Catégories** : Gestion complète du menu
- **Tables & QR Codes** : Tables avec codes QR pour commandes clients
- **Commandes** : Suivi en temps réel des commandes avec notifications
- **Ventes & Dépenses** : Tracking financier complet
- **Utilisateurs** : Système de rôles et permissions

### 📱 Interface Client
- **Menu QR Code** : Scan et commande directe depuis la table
- **Suivi Commandes** : Tracking temps réel du statut des commandes
- **Notifications** : Alertes automatiques sur l'avancement

### 💰 Paiements Mobile Money
- **Orange Money** : Intégration API complète
- **MTN MoMo** : Support transactions mobiles
- **Moov Money** : Paiements Burkina Faso
- **Wave** : Solution de paiement Sénégal
- **Cash** : Paiements traditionnels

### 🔐 Administration Multi-Niveau
- **Admin Restaurant** : Gestion quotidienne
- **Super Admin** : Configuration système et transferts
- **Permissions** : Contrôle granulaire des accès

## Technologies

- **Frontend** : React 18 + TypeScript + TailwindCSS
- **Backend** : Express.js + Node.js
- **Base de données** : PostgreSQL + Drizzle ORM
- **Build** : Vite + esbuild
- **UI** : shadcn/ui + Radix UI
- **Auth** : JWT + bcrypt

## Déploiement

### Replit (Développement)
```bash
npm run dev
```

### Render (Production)
```bash
npm run build
npm start
```

### Variables d'environnement requises
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
NODE_ENV=production
```

## Structure du Projet

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants UI
│   │   ├── pages/         # Pages de l'application
│   │   ├── hooks/         # Hooks React personnalisés
│   │   └── lib/           # Utilitaires
├── server/                # Backend Express
│   ├── db.ts             # Configuration base de données
│   ├── routes.ts         # Routes API
│   └── storage.ts        # Couche d'accès aux données
├── shared/                # Types partagés
│   └── schema.ts         # Schéma Drizzle + types
└── dist/                 # Build de production
```

## Configuration Mobile Money

Les clés API doivent être configurées dans les variables d'environnement :

```bash
# Orange Money
ORANGE_MONEY_API_KEY=your_key
ORANGE_MONEY_SECRET=your_secret

# MTN MoMo
MTN_MOMO_API_KEY=your_key
MTN_MOMO_SECRET=your_secret

# Moov Money
MOOV_MONEY_API_KEY=your_key
MOOV_MONEY_SECRET=your_secret

# Wave
WAVE_API_KEY=your_key
WAVE_SECRET=your_secret
```

## Support

Ce système est spécialement conçu pour les restaurants africains avec :
- Support CFA franc (FCFA)
- Intégrations Mobile Money locales
- Interface French/English
- Gestion hors ligne partielle

## Licence

MIT License - Voir fichier LICENSE pour plus de détails.