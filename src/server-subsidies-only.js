/**
 * Serveur minimal pour tester les routes de subventions
 * Exécuter avec: node src/server-subsidies-only.js
 */

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
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'subsidies-only' });
});

// Routes de recherche unifiée de subventions (sans dépendance Prisma)
const subsidiesRouter = require('./routes/subsidies');
app.use('/api/subsidies', subsidiesRouter);

// Routes de génération de PDF (fonctionnent avec données passées directement)
const pdfRouter = require('./routes/pdf');
app.use('/api/pdf', pdfRouter);

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
  console.log(`🚀 Serveur Granto (Subventions) démarré sur le port ${PORT}`);
  console.log(`📡 API accessible sur http://0.0.0.0:${PORT}`);
  console.log(`🔍 Recherche: http://0.0.0.0:${PORT}/api/subsidies/search`);
  console.log(`📋 Sources: http://0.0.0.0:${PORT}/api/subsidies/sources`);
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
