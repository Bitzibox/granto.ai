#!/bin/bash

echo "🚀 Script de démarrage du backend Granto.ai"
echo "============================================"
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Vérifier si le backend est déjà en cours d'exécution
if lsof -i :3001 &> /dev/null; then
    echo "⚠️  Le port 3001 est déjà utilisé"
    echo "   Arrêt du processus existant..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Vérifier si le client Prisma est généré
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "⚠️  Client Prisma non généré"
    echo "   Génération du client Prisma..."
    npx prisma generate

    if [ $? -ne 0 ]; then
        echo "❌ Échec de la génération du client Prisma"
        echo "   Essayez manuellement: npx prisma generate"
        echo "   Ou avec: PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate"
        exit 1
    fi
fi

echo "✅ Client Prisma prêt"
echo ""

# Démarrer le backend
echo "🔄 Démarrage du backend Express sur le port 3001..."
PORT=3001 node src/index.js &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "   Attente du démarrage..."
sleep 3

# Vérifier que le backend est bien démarré
if lsof -i :3001 &> /dev/null; then
    echo "✅ Backend démarré avec succès (PID: $BACKEND_PID)"
    echo "   http://localhost:3001"
    echo ""
    echo "📝 Logs en direct:"
    echo "   tail -f /tmp/backend-granto.log"
    echo ""
    echo "🛑 Pour arrêter le backend:"
    echo "   kill $BACKEND_PID"
    echo "   ou: lsof -ti :3001 | xargs kill"
    echo ""

    # Afficher les logs en direct
    tail -f /tmp/backend-granto.log 2>/dev/null || echo "⚠️  Pas de fichier de logs"
else
    echo "❌ Le backend n'a pas démarré correctement"
    echo "   Vérifiez les logs pour plus d'informations"
    exit 1
fi
