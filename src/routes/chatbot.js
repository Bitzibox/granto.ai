const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

const SYSTEM_CONTEXT = `Tu es l'assistant IA intégré à Granto, la plateforme de gestion de subventions pour les collectivités territoriales françaises.

CONTEXTE GRANTO:
Granto est une plateforme innovante qui aide les collectivités (communes, EPCI, départements) à :
1. RECHERCHER des subventions adaptées à leurs projets parmi des milliers d'aides disponibles (DETR, DSIL, fonds européens, régionaux, etc.)
2. ANALYSER automatiquement les projets grâce à l'IA pour identifier les meilleures aides correspondantes
3. MONTER des dossiers de demande de subvention avec génération automatique de documents PDF professionnels
4. SUIVRE l'avancement des demandes avec un tableau de bord centralisé
5. PERSONNALISER les templates PDF avec le logo et la charte graphique de la collectivité

FONCTIONNALITÉS PRINCIPALES:
- **Tableau de bord**: Vue d'ensemble des projets, dossiers en cours, calendrier des échéances
- **Recherche de subventions**: Moteur de recherche connecté à Aides-Territoires avec filtrage géographique intelligent
- **Assistant IA Sarthe**: Analyse un projet (description + commune + budget) et identifie les TOP 3 aides les plus pertinentes avec scoring intelligent
- **Génération PDF**: Création automatique de dossiers de demande complets et professionnels
- **Gestion des dossiers**: Suivi de l'état d'avancement de chaque demande
- **Paramètres templates**: Personnalisation complète des documents (logo, couleurs, marges, en-têtes/pieds de page)

DÉMO SARTHE:
Tu es présenté dans le cadre d'une démonstration au responsable numérique du département de la Sarthe (72).
Les cas d'usage typiques incluent :
- Rénovation énergétique de bâtiments communaux
- Aménagement de voirie et espaces publics
- Projets d'équipement numérique
- Transition écologique
- Mise en accessibilité des ERP

RÈGLES DE COMPORTEMENT:
- Réponds TOUJOURS en français
- Sois concis mais informatif (3-5 phrases max par réponse)
- Utilise un ton professionnel mais accessible
- Mets en avant les fonctionnalités de Granto quand c'est pertinent
- Si on te pose une question sur les subventions, guide l'utilisateur vers les bons outils de la plateforme
- Tu peux suggérer des actions concrètes ("Rendez-vous dans Recherche subventions pour...", "L'Assistant IA peut analyser votre projet...")
- N'invente PAS de chiffres ou de montants de subventions spécifiques
- Reste dans ton rôle d'assistant Granto, ne réponds pas à des questions hors sujet`;

// Stocker les conversations en mémoire (pour la démo)
const conversations = new Map();

router.post('/message', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message requis' });
    }

    if (!genAI) {
      // Fallback sans API Gemini - réponses prédéfinies intelligentes
      const fallbackResponse = getFallbackResponse(message);
      return res.json({
        response: fallbackResponse,
        conversationId: conversationId || generateId()
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 500
      }
    });

    // Récupérer ou créer l'historique de conversation
    const convId = conversationId || generateId();
    let history = conversations.get(convId) || [];

    // Construire le prompt avec contexte
    const chatHistory = history.map(h => `${h.role}: ${h.content}`).join('\n');

    const prompt = `${SYSTEM_CONTEXT}

${chatHistory ? `HISTORIQUE DE CONVERSATION:\n${chatHistory}\n` : ''}
UTILISATEUR: ${message}

Réponds de manière concise et utile. Si la question concerne les subventions ou la gestion de projets, guide l'utilisateur vers les fonctionnalités appropriées de Granto.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Sauvegarder dans l'historique
    history.push({ role: 'Utilisateur', content: message });
    history.push({ role: 'Assistant', content: text });

    // Garder les 20 derniers messages max
    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversations.set(convId, history);

    // Nettoyer les vieilles conversations (> 1h)
    cleanOldConversations();

    res.json({
      response: text,
      conversationId: convId
    });
  } catch (err) {
    console.error('Erreur chatbot:', err);
    res.status(500).json({
      error: 'Erreur lors du traitement du message',
      response: 'Désolé, je rencontre un problème technique. Réessayez dans un instant.'
    });
  }
});

// Endpoint suggestions contextuelles
router.get('/suggestions', (req, res) => {
  const page = req.query.page || 'default';

  const suggestions = {
    default: [
      'Comment fonctionne Granto ?',
      'Quelles subventions pour ma commune ?',
      'Comment monter un dossier ?',
      'Aidez-moi à trouver une aide'
    ],
    dashboard: [
      'Résumez mes projets en cours',
      'Quelles sont les prochaines échéances ?',
      'Comment ajouter un nouveau projet ?'
    ],
    'recherche-subventions': [
      'Quels filtres utiliser ?',
      'DETR ou DSIL : quelle différence ?',
      'Aides pour la rénovation énergétique ?'
    ],
    'assistant-ia': [
      'Comment utiliser l\'assistant IA ?',
      'Quel format pour la description ?',
      'Le scoring est-il fiable ?'
    ],
    'parametres': [
      'Comment personnaliser mes PDF ?',
      'Quel format de logo utiliser ?',
      'Modifier l\'en-tête des documents ?'
    ]
  };

  res.json({
    suggestions: suggestions[page] || suggestions.default
  });
});

function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function cleanOldConversations() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, _] of conversations) {
    const timestamp = parseInt(id.split('_')[1]);
    if (timestamp && timestamp < oneHourAgo) {
      conversations.delete(id);
    }
  }
}

function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello')) {
    return 'Bonjour ! Je suis l\'assistant Granto. Je peux vous aider à naviguer dans la plateforme, trouver des subventions adaptées à vos projets ou vous guider dans le montage de dossiers. Comment puis-je vous aider ?';
  }
  if (lower.includes('subvention') || lower.includes('aide') || lower.includes('financement')) {
    return 'Pour rechercher des subventions adaptées à votre projet, rendez-vous dans **Recherche subventions** dans le menu de gauche. Vous pouvez aussi utiliser l\'**Assistant IA** qui analyse automatiquement votre projet et identifie les meilleures aides disponibles avec un score de pertinence.';
  }
  if (lower.includes('dossier') || lower.includes('demande') || lower.includes('pdf')) {
    return 'Granto peut générer automatiquement vos dossiers de demande de subvention en PDF professionnel. Utilisez l\'**Assistant IA** pour analyser votre projet, puis cliquez sur "Télécharger le dossier" pour obtenir un document complet prêt à envoyer. Vous pouvez personnaliser le template dans **Paramètres**.';
  }
  if (lower.includes('detr') || lower.includes('dsil')) {
    return 'La **DETR** (Dotation d\'Équipement des Territoires Ruraux) et la **DSIL** (Dotation de Soutien à l\'Investissement Local) sont les deux principales dotations de l\'État pour les collectivités. L\'Assistant IA de Granto évalue automatiquement l\'éligibilité de votre projet à ces dispositifs.';
  }
  if (lower.includes('comment') && lower.includes('fonctionne')) {
    return 'Granto simplifie la gestion des subventions en 3 étapes :\n1. **Décrivez votre projet** via l\'Assistant IA\n2. **Identifiez les aides** grâce à notre moteur de recherche intelligent\n3. **Générez vos dossiers** en PDF professionnel, prêts à envoyer\n\nLe tout avec un tableau de bord centralisé pour suivre vos demandes.';
  }
  if (lower.includes('template') || lower.includes('logo') || lower.includes('personnalis')) {
    return 'Vous pouvez personnaliser vos documents PDF dans **Paramètres > Templates**. Ajoutez le logo de votre collectivité, modifiez les couleurs, les marges, et les en-têtes/pieds de page pour créer des dossiers à votre image.';
  }

  return 'Je suis l\'assistant Granto, votre guide pour la gestion des subventions. Je peux vous aider à :\n- **Rechercher des aides** adaptées à vos projets\n- **Utiliser l\'Assistant IA** pour analyser vos besoins\n- **Générer des dossiers PDF** professionnels\n- **Naviguer** dans la plateforme\n\nQue souhaitez-vous faire ?';
}

module.exports = router;
