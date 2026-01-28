#!/bin/bash
set -e

echo "🚀 Déploiement de Granto..."

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Arrêter le frontend avant le build
echo "⏸️  Arrêt temporaire du frontend..."
pm2 stop granto-frontend 2>/dev/null || true

# Build du frontend
echo "🏗️  Build du frontend..."
rm -rf .next
npm run build

# Vérifier que le build a réussi
if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ Erreur : Le build a échoué"
    exit 1
fi

echo "✅ Build réussi (BUILD_ID: $(cat .next/BUILD_ID))"

# Redémarrage des applications
echo "🔄 Redémarrage des applications..."
pm2 restart granto-backend
pm2 restart granto-frontend

# Attendre que les services soient prêts
sleep 3

# Afficher le statut
pm2 status

echo ""
echo "✅ Déploiement terminé !"
echo "📍 Frontend: http://163.172.28.104:3002"
echo "📍 Backend:  http://163.172.28.104:3001"
