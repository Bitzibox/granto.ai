# 🔒 Guide de Sécurité Granto

Ce document décrit les mesures de sécurité implémentées dans Granto et comment les utiliser.

## ✅ Mesures de Sécurité Implémentées

### 1. Protection contre le Directory Traversal

**Fichiers:** `src/routes/pdf.js`

**Mesures:**
- Sanitization des noms de fichiers avec `path.basename()`
- Validation des extensions (whitelist `.pdf` uniquement)
- Vérification que le chemin résolu reste dans le répertoire autorisé
- Suppression des caractères spéciaux et des séquences `../`

**Exemple d'attaque bloquée:**
```
❌ GET /api/pdf/download/../../../etc/passwd
✅ Bloqué avec erreur 403 "Accès refusé"
```

### 2. Authentification JWT

**Fichier:** `src/middleware/auth.js`

**Configuration requise dans `.env`:**
```env
JWT_SECRET=votre_secret_super_fort_ici
JWT_EXPIRES_IN=7d
```

**Utilisation:**

```javascript
const { authenticateToken, requireRole } = require('./middleware/auth');

// Route protégée - nécessite authentification
router.get('/api/projets', authenticateToken, (req, res) => {
  // req.user contient les informations de l'utilisateur
  console.log(req.user); // { id, email, role }
});

// Route protégée - nécessite rôle admin
router.delete('/api/projets/:id',
  authenticateToken,
  requireRole('admin'),
  (req, res) => {
    // Seuls les admins peuvent accéder
  }
);
```

**Format du token dans les requêtes:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Rate Limiting

**Fichier:** `src/middleware/security.js`

**Limites configurées:**
- **General:** 100 requêtes / 15 minutes
- **Strict (login, etc.):** 5 tentatives / 15 minutes
- **Création (POST):** 20 créations / heure

**Utilisation:**

```javascript
const { generalLimiter, strictLimiter, createLimiter } = require('./middleware/security');

// Rate limiting général (déjà appliqué globalement)
app.use(generalLimiter);

// Route sensible (login)
router.post('/api/auth/login', strictLimiter, loginHandler);

// Route de création
router.post('/api/projets', authenticateToken, createLimiter, createProjet);
```

### 4. CORS Sécurisé

**Fichier:** `src/index.js`

**Configuration dans `.env`:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,https://granto.example.com
```

**Comportement:**
- ✅ Accepte uniquement les origines dans la whitelist
- ❌ Bloque toutes les autres origines
- ✅ Permet les credentials (cookies, Authorization header)

### 5. Headers de Sécurité (Helmet)

**Fichier:** `src/middleware/security.js`

**Headers appliqués:**
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### 6. Validation des Inputs

**Utilisation recommandée avec Zod:**

```javascript
const { z } = require('zod');

const ProjetSchema = z.object({
  titre: z.string().min(1).max(200),
  description: z.string().optional(),
  montantTtc: z.number().positive(),
  collectiviteId: z.number().int().positive()
});

router.post('/api/projets', authenticateToken, async (req, res) => {
  try {
    // Valider les données
    const validatedData = ProjetSchema.parse(req.body);

    // Créer le projet avec les données validées
    const projet = await prisma.projet.create({
      data: validatedData
    });

    res.json(projet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.errors
      });
    }
    throw error;
  }
});
```

### 7. Sanitization des Erreurs

**Fichier:** `src/middleware/security.js`

**Comportement:**
- **Développement:** Messages d'erreur détaillés avec stack trace
- **Production:** Messages génériques sans détails techniques

**Configuration:**
```env
NODE_ENV=production
```

## 🚨 Vulnérabilités Restantes à Corriger

### CRITIQUE: Absence d'authentification sur les routes

**Routes à protéger immédiatement:**

```javascript
// src/routes/collectivites.js
const { authenticateToken } = require('../middleware/auth');

// Protéger toutes les routes
router.post('/', authenticateToken, createCollectivite);
router.put('/:id', authenticateToken, updateCollectivite);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteCollectivite);

// Même chose pour projets.js, dossiers.js, dispositifs.js
```

### HIGH: Validation des inputs manquante

Ajouter Zod pour valider **TOUS** les req.body avant insertion en base.

### MEDIUM: Logs non sécurisés

Implémenter une solution de logging structurée (Winston, Pino) avec rotation et stockage sécurisé.

## 🛠️ Installation des Dépendances Manquantes

```bash
npm install helmet express-rate-limit jsonwebtoken zod
```

## 📝 Checklist de Déploiement en Production

- [ ] Générer un JWT_SECRET fort: `openssl rand -base64 64`
- [ ] Configurer ALLOWED_ORIGINS avec les domaines réels
- [ ] Définir NODE_ENV=production
- [ ] Activer HTTPS uniquement (pas de HTTP)
- [ ] Configurer un reverse proxy (Nginx) avec rate limiting additionnel
- [ ] Implémenter des sauvegardes régulières de la base de données
- [ ] Configurer la rotation des logs
- [ ] Mettre en place un monitoring (erreurs 500, tentatives d'intrusion)
- [ ] Activer les audits de sécurité réguliers
- [ ] Implémenter une politique de mots de passe forts
- [ ] Activer l'authentification à deux facteurs (2FA)

## 🔍 Tests de Sécurité

### Tester le Directory Traversal

```bash
# Doit être bloqué
curl http://localhost:3001/api/pdf/download/../../../etc/passwd

# Doit fonctionner
curl http://localhost:3001/api/pdf/download/valid-file.pdf
```

### Tester le Rate Limiting

```bash
# Envoyer 101 requêtes rapidement (doit bloquer après 100)
for i in {1..101}; do
  curl http://localhost:3001/health
done
```

### Tester l'authentification JWT

```bash
# Sans token - doit échouer avec 401
curl http://localhost:3001/api/projets

# Avec token invalide - doit échouer avec 403
curl -H "Authorization: Bearer invalid_token" http://localhost:3001/api/projets

# Avec token valide - doit fonctionner
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projets
```

### Tester le CORS

```bash
# Depuis une origine non autorisée - doit être bloqué
curl -H "Origin: https://malicious.com" http://localhost:3001/api/projets

# Depuis une origine autorisée - doit fonctionner
curl -H "Origin: http://localhost:3000" http://localhost:3001/api/projets
```

## 📚 Ressources Supplémentaires

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Security Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [Helmet.js Documentation](https://helmetjs.github.io/)

## 🆘 Signaler une Vulnérabilité

Si vous découvrez une vulnérabilité de sécurité, veuillez nous contacter immédiatement à:
**security@granto.example.com**

**NE PAS** ouvrir d'issue publique sur GitHub pour les vulnérabilités de sécurité.
