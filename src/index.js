require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importer les middlewares de sécurité
const {
  generalLimiter,
  helmetConfig,
  secureLogger,
  sanitizeErrors,
  getCorsOptions
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

// SÉCURITÉ: Headers de sécurité avec Helmet
app.use(helmetConfig);

// SÉCURITÉ: CORS configuré avec whitelist
app.use(cors(getCorsOptions()));

// SÉCURITÉ: Rate limiting global
app.use(generalLimiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' })); // Limiter la taille des payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SÉCURITÉ: Logging sécurisé (ne log pas les tokens)
app.use(secureLogger);

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
  res.status(404).json({
    error: 'Route non trouvée',
    code: 'NOT_FOUND'
  });
});

// SÉCURITÉ: Gestion des erreurs globales avec sanitization
app.use(sanitizeErrors);

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
