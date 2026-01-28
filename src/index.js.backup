const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Configuration CORS - Autoriser les requêtes depuis le frontend
app.use(cors({
  origin: '*', // Permettre toutes les origines pour le développement
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Logger middleware pour debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes de base
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Granto API is running' });
});

// Routes API
app.use('/api/collectivites', require('./routes/collectivites'));
app.use('/api/projets', require('./routes/projets'));
app.use('/api/dispositifs', require('./routes/dispositifs'));
app.use('/api/dossiers', require('./routes/dossiers'));
app.use('/api/aides-territoires', require('./routes/aides-territoires'));
app.use('/api/dossiers', require('./routes/dossiers'));

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur serveur', message: err.message });
});

// Démarrage du serveur - ÉCOUTER SUR 0.0.0.0 pour être accessible depuis l'extérieur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Granto démarré sur le port ${PORT}`);
  console.log(`📡 API accessible sur http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit();
});

// Routes Aides-Territoires
const aidesTerrritoires = require('./services/aidesTerrritoires');

// Recherche d'aides
app.get('/api/aides-territoires/search', async (req, res) => {
  try {
    const results = await aidesTerrritoires.searchAids(req.query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur lors de la recherche d\'aides',
      details: error.message 
    });
  }
});

// Détails d'une aide
app.get('/api/aides-territoires/aids/:slug', async (req, res) => {
  try {
    const aid = await aidesTerrritoires.getAidDetails(req.params.slug);
    res.json(aid);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des détails',
      details: error.message 
    });
  }
});

// Recherche de périmètres
app.get('/api/aides-territoires/perimeters', async (req, res) => {
  try {
    const results = await aidesTerrritoires.searchPerimeters(req.query.q || '');
    res.json(results);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur lors de la recherche de périmètres',
      details: error.message 
    });
  }
});

// Test authentification
app.get('/api/aides-territoires/test', async (req, res) => {
  try {
    await aidesTerrritoires.authenticate();
    res.json({ success: true, message: 'Authentification réussie' });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erreur d\'authentification',
      details: error.message 
    });
  }
});
