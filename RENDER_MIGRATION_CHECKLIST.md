# ✅ Checklist Migration vers Render

## Étape 1: Préparation Repository (FAIT ✅)
- [x] Configuration .gitignore
- [x] README.md documentation
- [x] render.yaml configuration
- [x] server/index.ts adapté pour PORT variable
- [x] package.json scripts optimisés

## Étape 2: Création Repository GitHub
- [ ] 1. Aller sur [github.com](https://github.com)
- [ ] 2. Cliquer "New Repository"
- [ ] 3. Nom: `restaurant-management-system`
- [ ] 4. Description: "Système gestion restaurant avec QR codes et Mobile Money"
- [ ] 5. Public ou Privé (au choix)
- [ ] 6. **NE PAS** cocher "Initialize with README"
- [ ] 7. Cliquer "Create repository"

## Étape 3: Push du Code
```bash
# Dans Replit Shell, exécuter ces commandes une par une:
git init
git add .
git commit -m "Initial commit: Restaurant Management System with QR codes and Mobile Money"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/restaurant-management-system.git
git push -u origin main
```

## Étape 4: Configuration Render Database
- [ ] 1. Aller sur [render.com](https://render.com)
- [ ] 2. Créer compte gratuit
- [ ] 3. Cliquer "New +" → "PostgreSQL"
- [ ] 4. Nom: `restaurant-db`
- [ ] 5. Plan: **Free** (90 jours gratuits)
- [ ] 6. Région: Oregon (US West)
- [ ] 7. Noter l'URL de connexion fournie

## Étape 5: Déploiement Web Service
- [ ] 1. Sur Render Dashboard → "New +" → "Web Service"
- [ ] 2. Connecter votre repository GitHub
- [ ] 3. Sélectionner `restaurant-management-system`
- [ ] 4. Configuration:
  ```
  Name: restaurant-management-app
  Environment: Node
  Region: Oregon (US West)
  Branch: main
  Build Command: npm install && npm run build
  Start Command: npm start
  ```

## Étape 6: Variables d'Environnement
Ajouter dans Render → Settings → Environment Variables:

### Variables Obligatoires
```bash
NODE_ENV=production
SESSION_SECRET=votre-secret-super-long-et-aleatoire-minimum-32-caracteres
DATABASE_URL=[URL fournie par Render PostgreSQL]
```

### Variables Mobile Money (Optionnelles)
```bash
ORANGE_MONEY_API_KEY=your_key
ORANGE_MONEY_SECRET=your_secret
MTN_MOMO_API_KEY=your_key
MTN_MOMO_SECRET=your_secret
MOOV_MONEY_API_KEY=your_key
MOOV_MONEY_SECRET=your_secret
WAVE_API_KEY=your_key
WAVE_SECRET=your_secret
```

## Étape 7: Migration Base de Données
- [ ] 1. Attendre que le service web soit déployé
- [ ] 2. Les tables seront créées automatiquement au premier démarrage
- [ ] 3. Admin par défaut créé: `admin` / `admin123`
- [ ] 4. Super admin créé: `superadmin` / `superadmin123`

## Étape 8: Tests Post-Déploiement
- [ ] 1. Accéder à l'URL Render: `https://restaurant-management-app.onrender.com`
- [ ] 2. Tester connexion admin
- [ ] 3. Créer quelques produits/catégories
- [ ] 4. Générer un QR code table
- [ ] 5. Tester commande client via QR code
- [ ] 6. Vérifier notifications temps réel

## Étape 9: Configuration Domaine (Optionnel)
- [ ] 1. Render Dashboard → Settings → Custom Domains
- [ ] 2. Ajouter votre domaine personnalisé
- [ ] 3. Configurer DNS selon instructions Render

## Étape 10: Monitoring
- [ ] 1. Activer notifications Render (email/Slack)
- [ ] 2. Surveiller métriques performance
- [ ] 3. Vérifier logs en cas de problème

---

## 🆘 Support en Cas de Problème

### Build Errors
- Vérifier variables d'environnement
- Consulter logs de build dans Render
- S'assurer que DATABASE_URL est correct

### Database Connection
- Vérifier que PostgreSQL Render est actif
- Confirmer DATABASE_URL dans variables env
- Attendre quelques minutes après création DB

### Performance
- Plan gratuit Render: 750h/mois
- Upgrade vers Starter ($7/mois) si besoin
- PostgreSQL gratuit 90 jours puis $7/mois

---

🎯 **Une fois terminé, votre restaurant aura une solution professionnelle avec:**
- URL propre et SSL automatique
- Performance optimale 24/7
- Sauvegarde base de données automatique
- Mise à jour automatique via Git
- Support technique Render inclus