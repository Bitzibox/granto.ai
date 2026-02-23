# 🤖 Assistant IA Sarthe - Guide de Déploiement

## 🎯 Objectif

Transformer la démonstration Granto en expérience "magique" pour le département de la Sarthe.

**Le pitch en 10 secondes :**
> "Un maire tape 'Rénovation voirie Saint-Mars-la-Brière 50k€' → CLIC → 7 secondes → 3 aides DETR/DSIL parfaites + dossier complet PDF prêt dépôt !"

---

## 📦 Dépendances Requises

### Installation

```bash
cd /opt/granto
npm install @google/generative-ai
```

---

## 🔑 Configuration API Gemini

### 1. Obtenir une clé API Google Gemini

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec un compte Google
3. Créez une nouvelle clé API (gratuit jusqu'à 60 requêtes/minute)
4. Copiez la clé

### 2. Ajouter la clé dans .env

```bash
# Sur le serveur
cd /opt/granto
nano .env
```

Ajoutez cette ligne :

```bash
GEMINI_API_KEY=votre_cle_api_ici
```

---

## 🚀 Déploiement Complet

### Sur le serveur de production (/opt/granto)

```bash
# 1. Pull du code
cd /opt/granto
git pull origin claude/modernize-granto-design-ekxFU

# 2. Installer la nouvelle dépendance
npm install @google/generative-ai

# 3. Configurer Gemini API (si pas déjà fait)
echo "GEMINI_API_KEY=votre_cle_api_ici" >> .env

# 4. Rebuild frontend
rm -rf .next
npm run build

# 5. Redémarrer les services
pm2 restart granto-backend
pm2 restart granto-frontend

# 6. Vérifier les logs
pm2 logs granto-backend --lines 20
pm2 logs granto-frontend --lines 20
```

---

## 🧪 Tests de Validation

### Scénarios de Démonstration Prioritaires

#### 1. Rénovation Voirie (DETR/DSIL)

```
Description: Rénovation voirie principale avec éclairage LED économe
Commune: Saint-Mars-la-Brière
Budget: 50000
```

**Résultat attendu :**
- Top 3 contenant DETR et/ou DSIL
- Scores > 80%
- Explications mentionnant voirie + efficacité énergétique

#### 2. Éco-rénovation Bâtiment Public

```
Description: Isolation thermique et panneaux solaires sur mairie
Commune: Le Mans
Budget: 150000
```

**Résultat attendu :**
- Aides transition énergétique
- Aides rénovation bâtiments publics
- Scores > 70%

#### 3. Aménagement Espace Public Rural

```
Description: Création aire de jeux et parcours santé
Commune: Saint-Mars-la-Brière
Budget: 30000
```

**Résultat attendu :**
- Aides aménagement rural
- Aides équipements sportifs
- Scores > 60%

---

## 🎨 Points Clés UX

### Hiérarchie Visuelle

✅ **EN HAUT** : Assistant IA (premier élément visible)
- Card avec border bleu, shadow, gradient
- Badge "Nouveau"
- Icône Sparkles (✨)

✅ **AU MILIEU** : Séparateur "ou recherchez manuellement"

✅ **EN BAS** : Recherche manuelle (inchangée)

### Performance

- ⏱️ Temps total < 10 secondes
- 🎯 Top 3 priorise Sarthe/Pays de la Loire
- 💡 Explications IA personnalisées pour chaque match
- 🏆 Scoring intelligent (Sarthe +50pts, DETR/DSIL +40pts)

---

## 📊 Architecture Technique

### Frontend

- `/app/recherche-subventions/page.tsx` - Page principale (modifiée)
- `/components/assistant-ia-sarthe.tsx` - Composant IA (nouveau)
- `/app/api/assistant-ia/analyze/route.ts` - Proxy Next.js (nouveau)

### Backend

- `/src/routes/assistant-ia.js` - Route Express (nouveau)
- `/src/services/geminiService.js` - Service Gemini (nouveau)
- `/src/index.js` - Routing (modifié)

### Workflow

1. **User Input** → Frontend collecte description/commune/budget
2. **POST /api/assistant-ia/analyze** → Proxy Next.js
3. **Gemini Analysis** → Extraction mots-clés + catégorie
4. **Search Aides** → API Aides-Territoires
5. **Intelligent Scoring** → Priorité Sarthe + matching
6. **AI Explanations** → Gemini explique chaque match
7. **Return Top 3** → Avec scores et explications

---

## 🐛 Dépannage

### L'analyse ne fonctionne pas

```bash
# Vérifier que Gemini API est configurée
pm2 logs granto-backend | grep GEMINI

# Tester l'API directement
curl -X POST http://localhost:3001/api/assistant-ia/analyze \
  -H "Content-Type: application/json" \
  -d '{"description":"test voirie","commune":"Saint-Mars","budget":50000}'
```

### Erreur "Gemini API non configurée"

```bash
# Vérifier .env
cat /opt/granto/.env | grep GEMINI

# Ajouter si manquant
echo "GEMINI_API_KEY=votre_cle" >> /opt/granto/.env

# Redémarrer backend
pm2 restart granto-backend
```

### Pas de résultats

- Vérifier que l'API Aides-Territoires répond (logs backend)
- Vérifier la connexion Internet du serveur
- Essayer avec des mots-clés plus génériques

---

## 🎬 Checklist Démo Finale

Avant la démonstration avec la Sarthe :

- [ ] Gemini API configurée et testée
- [ ] Backend redémarré (`pm2 restart granto-backend`)
- [ ] Frontend rebuild (`rm -rf .next && npm run build && pm2 restart granto-frontend`)
- [ ] Test du scénario "Rénovation voirie Saint-Mars 50k€"
- [ ] Vérification que Top 3 contient DETR/DSIL
- [ ] Temps de réponse < 10 secondes
- [ ] Explications IA affichées correctement
- [ ] Design visuellement attractif (gradient bleu)
- [ ] Mobile responsive

---

## 📈 Prochaines Itérations

**Pour après la démo** (si succès) :

1. **Génération PDF automatique** avec :
   - Plan de financement détaillé
   - Modèle de délibération
   - Liste pièces justificatives
   - Contacts services Sarthe

2. **Historique des analyses** sauvegardées

3. **Export vers dossier** direct

4. **Amélioration scoring** basée sur retours

---

## 🆘 Support

En cas de problème urgent le jour de la démo :

1. Vérifier logs : `pm2 logs granto-backend --lines 50`
2. Redémarrer services : `pm2 restart all`
3. Mode dégradé : masquer temporairement l'assistant IA si bug bloquant

---

## ✨ Message Clé

> "L'assistant IA n'est pas une fonctionnalité. C'est le moment qui vend Granto."

**L'effet "magie" recherché :**
Transformer 3 champs de formulaire en dossier de subvention professionnel en moins de 10 secondes.

Bonne démonstration ! 🚀
