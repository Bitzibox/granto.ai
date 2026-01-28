require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes principales
app.use('/api/collectivites', require('./routes/collectivites'));
app.use('/api/projets', require('./routes/projets'));
app.use('/api/dispositifs', require('./routes/dispositifs'));
app.use('/api/dossiers', require('./routes/dossiers'));

// Import du service Aides-Territoires
const aidesTerritoires = require('./services/aidesTerritoires');

// Routes Aides-Territoires
const aidesTerritoriesRouter = require('./routes/aides-territoires');
app.use('/api/aides-territoires', aidesTerritoriesRouter);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: err.message 
  });
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Granto démarré sur le port ${PORT}`);
  console.log(`📡 API accessible sur http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = app;
