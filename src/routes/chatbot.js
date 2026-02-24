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

FONCTIONNALITÉS PRINCIPALES ET LEURS ROUTES:
- **Tableau de bord** (/): Vue d'ensemble des projets, dossiers en cours, calendrier des échéances
- **Recherche de subventions** (/recherche-subventions): Moteur de recherche connecté à Aides-Territoires avec filtrage géographique intelligent
- **Assistant IA** (/assistant-ia): Analyse un projet (description + commune + budget) et identifie les TOP 3 aides les plus pertinentes avec scoring intelligent
- **Projets** (/projets): Gestion de tous vos projets
- **Dossiers** (/dossiers): Suivi de l'état d'avancement de chaque demande
- **Paramètres Templates** (/parametres/templates): Personnalisation complète des documents (logo, couleurs, marges, en-têtes/pieds de page)
- **Collectivités** (/collectivites): Gestion des collectivités

NAVIGATION SYSTÈME:
Quand tu mentionnes une fonctionnalité, utilise TOUJOURS ce format pour créer un lien cliquable :
[LINK:/chemin|Texte du lien]

Exemples :
- "Rendez-vous dans [LINK:/recherche-subventions|Recherche de subventions]"
- "Utilisez [LINK:/assistant-ia|l'Assistant IA]"
- "Personnalisez dans [LINK:/parametres/templates|Paramètres > Templates]"

ACTIONS AVEC PRÉ-REMPLISSAGE:
Pour diriger l'utilisateur vers un formulaire pré-rempli, utilise :
[ACTION:chemin|texte|param1=value1&param2=value2]

Exemple :
- "[ACTION:/assistant-ia|Analyser ce projet|description=Rénovation énergétique de la mairie&commune=Le Mans&budget=250000]"

RÈGLES DE COMPORTEMENT:
- Réponds TOUJOURS en français
- Sois concis mais informatif (3-5 phrases max par réponse)
- Utilise un ton professionnel mais accessible
- TOUJOURS créer des liens cliquables quand tu mentionnes une fonctionnalité
- Guide activement l'utilisateur avec des liens directs
- Extrais les informations du contexte (projet, commune, budget) pour pré-remplir les formulaires
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

    let responseText;
    if (!genAI) {
      // Fallback sans API Gemini - réponses prédéfinies intelligentes
      responseText = getFallbackResponse(message);
    } else {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
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

Réponds de manière concise et utile avec des liens cliquables [LINK:...] ou actions [ACTION:...] quand c'est pertinent.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text().trim();

      // Sauvegarder dans l'historique
      history.push({ role: 'Utilisateur', content: message });
      history.push({ role: 'Assistant', content: responseText });

      // Garder les 20 derniers messages max
      if (history.length > 20) {
        history = history.slice(-20);
      }
      conversations.set(convId, history);

      // Nettoyer les vieilles conversations (> 1h)
      cleanOldConversations();
    }

    // Parser et enrichir la réponse
    const enrichedResponse = enrichResponseWithLinks(responseText);

    res.json({
      response: enrichedResponse.text,
      actions: enrichedResponse.actions,
      conversationId: conversationId || generateId()
    });
  } catch (err) {
    console.error('Erreur chatbot:', err);
    res.status(500).json({
      error: 'Erreur lors du traitement du message',
      response: 'Désolé, je rencontre un problème technique. Réessayez dans un instant.',
      actions: []
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

function enrichResponseWithLinks(text) {
  const actions = [];
  let enrichedText = text;

  // Parser les liens [LINK:/path|label]
  enrichedText = enrichedText.replace(/\[LINK:(\/[^\|]+)\|([^\]]+)\]/g, (match, path, label) => {
    const actionId = `action_${actions.length}`;
    actions.push({
      id: actionId,
      type: 'link',
      path: path,
      label: label
    });
    return `<action data-id="${actionId}">${label}</action>`;
  });

  // Parser les actions [ACTION:/path|label|params]
  enrichedText = enrichedText.replace(/\[ACTION:(\/[^\|]+)\|([^\|]+)\|([^\]]+)\]/g, (match, path, label, params) => {
    const actionId = `action_${actions.length}`;
    const paramsObj = {};
    params.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        paramsObj[key] = decodeURIComponent(value);
      }
    });
    actions.push({
      id: actionId,
      type: 'action',
      path: path,
      label: label,
      params: paramsObj
    });
    return `<action data-id="${actionId}">${label}</action>`;
  });

  // Auto-détection des fonctionnalités mentionnées (fallback si pas de LINK/ACTION)
  const autoLinks = [
    { pattern: /Assistant IA(?! \(cliquez ici\))/gi, path: '/assistant-ia', label: 'Assistant IA' },
    { pattern: /Recherche (?:de )?subventions?(?! \(cliquez ici\))/gi, path: '/recherche-subventions', label: 'Recherche de subventions' },
    { pattern: /Tableau de bord(?! \(cliquez ici\))/gi, path: '/', label: 'Tableau de bord' },
    { pattern: /Paramètres(?: > Templates)?(?! \(cliquez ici\))/gi, path: '/parametres/templates', label: 'Paramètres' },
    { pattern: /Projets(?! \(cliquez ici\))/gi, path: '/projets', label: 'Projets' },
    { pattern: /Dossiers(?! \(cliquez ici\))/gi, path: '/dossiers', label: 'Dossiers' },
  ];

  autoLinks.forEach(({ pattern, path, label }) => {
    // Ne transformer que si pas déjà dans une balise action
    const parts = enrichedText.split(/(<action[^>]*>.*?<\/action>)/);
    enrichedText = parts.map((part, index) => {
      // Ne pas toucher aux parties qui sont déjà des actions (index impair)
      if (index % 2 === 1) return part;

      // Appliquer le pattern sur les parties de texte normal
      return part.replace(pattern, (match) => {
        const actionId = `action_${actions.length}`;
        actions.push({
          id: actionId,
          type: 'link',
          path: path,
          label: match
        });
        return `<action data-id="${actionId}">${match}</action>`;
      });
    }).join('');
  });

  return {
    text: enrichedText,
    actions: actions
  };
}

function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  // Détection de projet avec paramètres (PRIORITAIRE - avant les réponses génériques)
  const hasCommune = lower.match(/commune[s]?\s+(?:de\s+|d')?([a-zàâäéèêëïîôùûü\s-]+?)(?:\s+avec|\s+pour|\s+et|\s*$|,|\.|budget)/i);
  const hasBudget = lower.match(/budget[s]?\s+(?:de\s+)?(\d+[\s\d]*)/i);
  const hasProject = lower.match(/(?:projet|rénovation|aménagement|construction|travaux)(?:\s+(?:de|d'))?\s+([a-zàâäéèêëïîôùûü\s]+?)(?:\s+pour|\s+de|\s+à|\s+avec|\s*$|,|budget)/i);

  if ((lower.includes('projet') || lower.includes('rénovation') || lower.includes('aménagement') || lower.includes('construction') || lower.includes('travaux')) && (hasCommune || hasBudget || hasProject)) {
    let params = [];
    let projectDesc = '';

    if (hasProject) {
      projectDesc = hasProject[1].trim();
      params.push(`description=${encodeURIComponent(projectDesc)}`);
    }
    if (hasCommune) {
      const communeName = hasCommune[1].trim().replace(/\s+(avec|pour|et|budget).*/, '');
      params.push(`commune=${encodeURIComponent(communeName)}`);
    }
    if (hasBudget) {
      params.push(`budget=${hasBudget[1].replace(/\s/g, '')}`);
    }

    if (params.length > 0) {
      return `Je peux vous aider à analyser ce projet ! [ACTION:/assistant-ia|Cliquez ici pour lancer l'analyse|${params.join('&')}] et découvrez les subventions disponibles pour ${projectDesc || 'votre projet'}.`;
    }
  }

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello')) {
    return 'Bonjour ! Je suis l\'assistant Granto. Je peux vous aider à naviguer dans la plateforme, trouver des subventions adaptées à vos projets ou vous guider dans le montage de dossiers. Comment puis-je vous aider ?';
  }

  if (lower.includes('subvention') || lower.includes('aide') || lower.includes('financement')) {
    return 'Pour rechercher des subventions adaptées à votre projet, rendez-vous dans [LINK:/recherche-subventions|Recherche de subventions]. Vous pouvez aussi utiliser [LINK:/assistant-ia|l\'Assistant IA] qui analyse automatiquement votre projet et identifie les meilleures aides disponibles avec un score de pertinence.';
  }

  if (lower.includes('dossier') || lower.includes('demande') || lower.includes('pdf')) {
    return 'Granto peut générer automatiquement vos dossiers de demande de subvention en PDF professionnel. Utilisez [LINK:/assistant-ia|l\'Assistant IA] pour analyser votre projet, puis cliquez sur "Télécharger le dossier" pour obtenir un document complet prêt à envoyer. Vous pouvez personnaliser le template dans [LINK:/parametres/templates|Paramètres].';
  }

  if (lower.includes('detr') || lower.includes('dsil')) {
    return 'La **DETR** (Dotation d\'Équipement des Territoires Ruraux) et la **DSIL** (Dotation de Soutien à l\'Investissement Local) sont les deux principales dotations de l\'État pour les collectivités. [LINK:/assistant-ia|L\'Assistant IA] de Granto évalue automatiquement l\'éligibilité de votre projet à ces dispositifs.';
  }

  if (lower.includes('comment') && lower.includes('fonctionne')) {
    return 'Granto simplifie la gestion des subventions en 3 étapes :\n1. **Décrivez votre projet** via [LINK:/assistant-ia|l\'Assistant IA]\n2. **Identifiez les aides** grâce à [LINK:/recherche-subventions|notre moteur de recherche]\n3. **Générez vos dossiers** en PDF professionnel, prêts à envoyer\n\nLe tout avec un [LINK:/|tableau de bord] centralisé pour suivre vos demandes.';
  }

  if (lower.includes('template') || lower.includes('logo') || lower.includes('personnalis')) {
    return 'Vous pouvez personnaliser vos documents PDF dans [LINK:/parametres/templates|Paramètres > Templates]. Ajoutez le logo de votre collectivité, modifiez les couleurs, les marges, et les en-têtes/pieds de page pour créer des dossiers à votre image.';
  }

  return 'Je suis l\'assistant Granto, votre guide pour la gestion des subventions. Je peux vous aider à :\n- [LINK:/recherche-subventions|Rechercher des aides] adaptées à vos projets\n- [LINK:/assistant-ia|Utiliser l\'Assistant IA] pour analyser vos besoins\n- Générer des dossiers PDF professionnels\n- [LINK:/|Naviguer dans la plateforme]\n\nQue souhaitez-vous faire ?';
}

module.exports = router;
