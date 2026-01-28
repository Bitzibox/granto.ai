#!/bin/bash
echo "🚀 Déploiement de Granto..."

cd /opt/granto

echo "📦 Installation des dépendances..."
npm install

echo "🏗️  Build du frontend..."
npm run build

echo "🔄 Redémarrage des applications..."
pm2 restart ecosystem.config.js

echo "✅ Déploiement terminé !"
pm2 status
