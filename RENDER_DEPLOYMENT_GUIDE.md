# 🚀 Guide de Déploiement sur Render

## Pourquoi Render ?
- **Gratuit** pour commencer (750h/mois incluses)
- **PostgreSQL gratuit** (90 jours puis payant)
- **Déploiement automatique** depuis GitHub
- **SSL/HTTPS** automatique
- **Domaine personnalisé** possible
- **Meilleur performance** que Replit

## Étapes de Déploiement

### 1. 📁 Préparation du Repository GitHub

#### A. Créer un repository GitHub
1. Allez sur GitHub.com
2. Cliquez "New Repository"
3. Nom : `restaurant-management-system`
4. Cochez "Public" ou "Private"
5. Cliquez "Create repository"

#### B. Pousser le code vers GitHub
```bash
# Dans Replit Shell
git remote add origin https://github.com/VOTRE-USERNAME/restaurant-management-system.git
git branch -M main
git push -u origin main
```

### 2. 🗄️ Configuration Base de Données PostgreSQL sur Render

#### A. Créer la base de données
1. Allez sur [render.com](https://render.com)
2. Créez un compte gratuit
3. Cliquez "New +" → "PostgreSQL"
4. Nom : `restaurant-db`
5. Plan : **Free** (pour commencer)
6. Cliquez "Create Database"

#### B. Noter les informations de connexion
```bash
# Render vous donnera :
Database URL: postgresql://user:password@host:port/database
PGHOST: dpg-xxxxx-a.oregon-postgres.render.com
PGPORT: 5432
PGDATABASE: restaurant_db_xxxx
PGUSER: restaurant_db_xxxx_user
PGPASSWORD: xxxxxxxxxxxxx
```

### 3. 🖥️ Déploiement de l'Application Web

#### A. Créer le service web
1. Sur Render Dashboard → "New +" → "Web Service"
2. Connectez votre repository GitHub
3. Sélectionnez `restaurant-management-system`

#### B. Configuration du service
```yaml
Name: restaurant-management-app
Environment: Node
Region: Oregon (US West)
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

#### C. Variables d'environnement
Dans la section "Environment Variables" :
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=votre-secret-aleatoire-tres-long-et-securise
PGHOST=dpg-xxxxx-a.oregon-postgres.render.com
PGPORT=5432
PGDATABASE=restaurant_db_xxxx
PGUSER=restaurant_db_xxxx_user
PGPASSWORD=xxxxxxxxxxxxx
```

### 4. 📋 Fichiers de Configuration Nécessaires

#### A. Créer `package.json` scripts pour production
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/public",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:@neondatabase/serverless --external:ws",
    "start": "node dist/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts"
  }
}
```

#### B. Créer `render.yaml` (optionnel)
```yaml
services:
  - type: web
    name: restaurant-management-app
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: restaurant-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true

databases:
  - name: restaurant-db
    plan: free
```

### 5. 🔧 Modifications du Code pour Render

#### A. Mise à jour `server/index.ts`
```typescript
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### B. Mise à jour `vite.config.ts` pour production
```typescript
export default defineConfig({
  plugins: [react(), cartographer(), runtimeErrorModal()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dir, "./client/src"),
      "@shared": path.resolve(import.meta.dir, "./shared"),
      "@assets": path.resolve(import.meta.dir, "./assets"),
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
```

### 6. 🚀 Processus de Déploiement

#### A. Déploiement initial
1. Poussez le code vers GitHub
2. Render détecte automatiquement les changements
3. Build automatique (5-10 minutes)
4. Déploiement automatique

#### B. Déploiements futurs
```bash
# Sur Replit ou votre machine locale
git add .
git commit -m "New feature: notification system"
git push origin main
# → Render redéploie automatiquement
```

### 7. 📊 Migration des Données

#### A. Export depuis Replit
```bash
# Dans Replit Shell
npm run db:push  # Pour créer les tables sur Render
```

#### B. Migration manuelle si nécessaire
```sql
-- Connectez-vous à la DB Render via psql ou pgAdmin
-- Copiez les données importantes depuis Replit
```

### 8. 🌐 Configuration Domaine (Optionnel)

#### A. Domaine gratuit Render
- Votre app sera disponible sur : `https://restaurant-management-app.onrender.com`

#### B. Domaine personnalisé
1. Dans Render Dashboard → Settings → Custom Domains
2. Ajoutez votre domaine : `monrestaurant.com`
3. Configurez les DNS selon les instructions Render

### 9. 📈 Monitoring et Maintenance

#### A. Logs en temps réel
```bash
# Via Render Dashboard → Logs
# Ou via CLI Render
```

#### B. Performance
- Render offre des métriques gratuites
- SSL/TLS automatique
- CDN intégré

### 10. 💰 Coûts Render

#### Plan Gratuit (idéal pour commencer)
- **Web Service** : 750h/mois (suffisant pour 1 site)
- **PostgreSQL** : 90 jours gratuits puis $7/mois
- **Bande passante** : 100GB/mois
- **Builds** : 500 minutes/mois

#### Mise à niveau (si nécessaire)
- **Starter Plan** : $7/mois (service web toujours actif)
- **PostgreSQL** : $7/mois (1GB storage)

## ✅ Avantages vs Replit

| Fonctionnalité | Replit | Render |
|---|---|---|
| Déploiement | Manuel | Automatique |
| Performance | Limitée | Excellente |
| Uptime | Peut dormir | 99.9% uptime |
| SSL | Inclus | Inclus |
| Domaine custom | Payant | Gratuit |
| Base de données | Incluse | PostgreSQL dédié |
| Scaling | Limité | Automatique |

## 🆘 Support et Dépannage

### Erreurs communes
```bash
# Build fails
→ Vérifiez les scripts package.json
→ Variables d'environnement correctes

# Database connection
→ Vérifiez DATABASE_URL
→ Whitelist IP si nécessaire

# Static files 404
→ Vérifiez build output directory
```

### Resources
- **Documentation Render** : [render.com/docs](https://render.com/docs)
- **Support Render** : Via dashboard ou Discord
- **Status Page** : [status.render.com](https://status.render.com)

---

🎯 **Render est parfait pour votre restaurant management system** - plus professionnel que Replit avec de meilleures performances !