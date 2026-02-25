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
- **Recherche de subventions et Assistant IA** (/recherche-subventions): L'Assistant IA est en haut de cette page, il analyse un projet (description + commune + budget) et identifie les TOP 3 aides. La recherche manuelle est en bas.
- **Projets** (/projets): Gestion de tous vos projets
- **Dossiers** (/dossiers): Suivi de l'état d'avancement de chaque demande
- **Paramètres Templates** (/parametres/templates): Personnalisation complète des documents (logo, couleurs, marges, en-têtes/pieds de page)
- **Collectivités** (/collectivites): Gestion des collectivités

NAVIGATION SYSTÈME:
Quand tu mentionnes une fonctionnalité, utilise TOUJOURS ce format pour créer un lien cliquable :
[LINK:/chemin|Texte du lien]

Exemples :
- "Rendez-vous dans [LINK:/recherche-subventions|Recherche de subventions]"
- "Utilisez [LINK:/recherche-subventions|l'Assistant IA]"
- "Personnalisez dans [LINK:/parametres/templates|Paramètres > Templates]"

ACTIONS AVEC PRÉ-REMPLISSAGE:
Pour diriger l'utilisateur vers un formulaire pré-rempli, utilise :
[ACTION:chemin|texte|param1=value1&param2=value2]

Exemple :
- "[ACTION:/recherche-subventions|Analyser ce projet|description=Rénovation énergétique de la mairie&commune=Le Mans&budget=250000]"

QUESTIONS PROGRESSIVES:
Quand l'utilisateur demande l'Assistant IA ou la recherche de subventions SANS fournir tous les détails nécessaires, pose-lui des questions pour collecter les informations manquantes:
- Description du projet (type de travaux, objectif)
- Commune concernée
- Budget estimé

⚠️ TRÈS IMPORTANT - GESTION DE LA MÉMOIRE:
- TOUJOURS analyser l'HISTORIQUE DE CONVERSATION complet avant de répondre
- Si l'utilisateur a DÉJÀ mentionné une information (projet, commune, budget) dans un message précédent, NE PAS la redemander
- Extraire et mémoriser toutes les informations de projet mentionnées dans l'historique
- Ne demander QUE les informations manquantes qui n'apparaissent nulle part dans l'historique
- Dès que tu as les 3 informations (description, commune, budget) provenant de N'IMPORTE QUEL message de l'historique, génère IMMÉDIATEMENT le lien [ACTION]

⚠️ NAVIGATION AVEC ACTIONS PRÉ-REMPLIES:
- Quand toutes les infos (description, commune, budget) sont disponibles, utilise EXCLUSIVEMENT le lien [ACTION] fourni
- NE JAMAIS dire "rendez-vous sur la page projets" ou mentionner "projets" comme destination
- TOUJOURS dire "Je peux maintenant lancer l'analyse" ou "Voici le lien pour l'Assistant IA"
- Le lien [ACTION] fourni est DÉJÀ configuré pour rediriger vers l'Assistant IA avec pré-remplissage

Exemple de dialogue correct:
Utilisateur: "Je veux des aides pour restaurer le gymnase de ma commune pour 500000€"
Assistant: "Excellent ! J'ai noté votre projet de restauration du gymnase avec un budget de 500 000€. Pour lancer l'analyse avec l'Assistant IA, il me manque juste le nom de votre commune. Quelle est-elle ?"
Utilisateur: "Saint Mars la Brière"
Assistant: "Parfait ! J'ai toutes les informations nécessaires. [ACTION:/recherche-subventions|Lancer l'analyse du projet|description=restauration du gymnase&commune=Saint Mars la Brière&budget=500000] pour identifier les meilleures subventions correspondantes."

⚠️ ERREUR À ÉVITER:
❌ Ne JAMAIS redemander une info déjà fournie
❌ Ne JAMAIS dire "Il me manque la description" si elle a été mentionnée 3 messages avant
❌ TOUJOURS vérifier TOUT l'historique avant de demander quoi que ce soit

RÈGLES DE COMPORTEMENT:
- Réponds TOUJOURS en français
- Sois clair et complet dans tes explications (adapte la longueur selon la question)
- Pour les questions simples, reste concis (2-3 phrases)
- Pour les questions complexes ou les tutoriels, donne des réponses détaillées et structurées
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
          temperature: 0.4,  // Plus déterministe pour extraire infos précises
          topP: 0.9,
          maxOutputTokens: 1500
        }
      });

      // Récupérer ou créer l'historique de conversation
      const convId = conversationId || generateId();
      let history = conversations.get(convId) || [];

      // Extraire automatiquement les infos du projet de TOUT l'historique + message actuel
      const allMessages = [...history.map(h => h.content), message].join(' ');
      const extractedInfo = extractProjectInfo(allMessages);

      // Debug: log des infos extraites
      console.log('🔍 Extraction automatique:', JSON.stringify(extractedInfo, null, 2));
      console.log('📝 Texte analysé:', allMessages);

      // Construire le prompt avec contexte
      const chatHistory = history.map(h => `${h.role}: ${h.content}`).join('\n');

      // Construire un résumé des infos extraites
      let extractedSummary = '\n📋 INFORMATIONS EXTRAITES DE LA CONVERSATION:';
      if (extractedInfo.description) extractedSummary += `\n✅ Projet: ${extractedInfo.description}`;
      if (extractedInfo.commune) extractedSummary += `\n✅ Commune: ${extractedInfo.commune}`;
      if (extractedInfo.budget) extractedSummary += `\n✅ Budget: ${extractedInfo.budget}€`;

      if (extractedInfo.description && extractedInfo.commune && extractedInfo.budget) {
        extractedSummary += '\n\n🎯 TOUTES LES INFOS SONT PRÉSENTES ! Génère IMMÉDIATEMENT ce lien (et AUCUN AUTRE) : [ACTION:/recherche-subventions|Lancer l\'analyse du projet|description=' + encodeURIComponent(extractedInfo.description) + '&commune=' + encodeURIComponent(extractedInfo.commune) + '&budget=' + extractedInfo.budget + ']\n\n⚠️ NE PAS mentionner "projets" ou "page projets" - ce lien redirige DÉJÀ vers l\'Assistant IA avec pré-remplissage.';
      } else {
        extractedSummary += '\n\n❓ Informations manquantes:';
        if (!extractedInfo.description) extractedSummary += '\n- Description du projet';
        if (!extractedInfo.commune) extractedSummary += '\n- Commune';
        if (!extractedInfo.budget) extractedSummary += '\n- Budget';
        extractedSummary += '\n\nDemande UNIQUEMENT les informations manquantes ci-dessus.';
      }

      const prompt = `${SYSTEM_CONTEXT}

${chatHistory ? `HISTORIQUE DE CONVERSATION:\n${chatHistory}\n` : ''}
UTILISATEUR: ${message}
${extractedSummary}

Réponds avec des liens cliquables [LINK:...] ou actions [ACTION:...] quand c'est pertinent.`;

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
    { pattern: /Assistant IA(?! \(cliquez ici\))/gi, path: '/recherche-subventions', label: 'Assistant IA' },
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

// Extraire automatiquement les informations de projet de l'historique complet
function extractProjectInfo(fullText) {
  const lower = fullText.toLowerCase();
  const info = {
    description: null,
    commune: null,
    budget: null
  };

  // Extraction du projet (patterns multiples - capturer l'action + l'objet)
  const projectPatterns = [
    // Pattern 1: "restaurer le gymnase de X" -> "restauration du gymnase"
    /(restaur(?:er|ation)|rénov(?:er|ation)|aménag(?:er|ement)|construct(?:ion|ion de)|réhabilit(?:er|ation))\s+(?:le|la|l'|les|du|de la|d'un|d'une)?\s*([a-zàâäéèêëïîôùûü\s]+?)(?:\s+(?:de|à|pour|dans|avec|et)|$)/gi,
    // Pattern 2: "travaux de rénovation du gymnase"
    /travaux\s+de\s+([a-zàâäéèêëïîôùûü\s]+?)(?:\s+(?:de|à|pour|dans|et)|$)/gi,
    // Pattern 3: "aide pour [projet]"
    /aide[s]?\s+pour\s+(?:la|le|l'|les)?\s*([a-zàâäéèêëïîôùûü\s]+?)(?:\s+(?:de|à|pour|dans|et)|$)/gi,
    // Pattern 4: simple "gymnase/gymanse" si isolé (tolérant aux fautes de frappe)
    /(?:gymna[ns]e|école|mairie|église|parc|voirie|route|bâtiment|salle|stade|piscine|médiathèque)/gi,
  ];

  for (const pattern of projectPatterns) {
    const matches = [...fullText.matchAll(pattern)];
    if (matches.length > 0) {
      // Construire la description avec action + objet
      if (matches[0][2]) {
        // Pattern avec action + objet
        const action = matches[0][1].toLowerCase().replace(/er$/, 'ation').replace(/é/, 'e');
        const objet = matches[0][2].trim();
        info.description = `${action} ${objet}`;
        break;
      } else if (matches[0][1]) {
        // Pattern "travaux de X"
        info.description = matches[0][1].trim();
        break;
      } else {
        // Pattern simple objet seul
        info.description = matches[0][0];
        break;
      }
    }
  }

  // Extraction de la commune (patterns case-insensitive pour gérer toutes variations)
  const communePatterns = [
    // Pattern 1: "commune de X" ou "ville X" ou "à X"
    /(?:commune|ville|à)\s+(?:de\s+|d')?([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜa-zàâäéèêëïîôùûü]+(?:\s+(?:la|le|les|de|du)?\s*[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜa-zàâäéèêëïîôùûü]+)*)/gi,
    // Pattern 2: "Saint/Sainte X" (accept all case variations)
    /(?:Saint|Sainte)\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜa-zàâäéèêëïîôùûü]+(?:\s+(?:la|le|les)?\s*[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜa-zàâäéèêëïîôùûü]+)*/gi,
  ];

  for (const pattern of communePatterns) {
    const matches = [...fullText.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0][matches[0].length - 1] || matches[0][0];
      const cleaned = match.trim().replace(/^(de|d'|à)\s+/i, '');
      if (cleaned.length > 2 && cleaned.length < 50) {
        // Normaliser la casse : Majuscule au début de chaque mot
        info.commune = cleaned.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        break;
      }
    }
  }

  // Extraction du budget
  const budgetPatterns = [
    /(\d[\d\s]{3,})\s*(?:€|euros?|EUR)/gi,
    /budget\s+(?:de\s+)?(\d[\d\s]{3,})/gi,
    /montant\s+(?:de\s+)?(\d[\d\s]{3,})/gi,
    /pour\s+(?:un\s+montant\s+de\s+)?(\d[\d\s]{3,})\s*(?:€|euros?)/gi,
  ];

  for (const pattern of budgetPatterns) {
    const matches = [...fullText.matchAll(pattern)];
    if (matches.length > 0) {
      const budgetStr = matches[0][1].replace(/\s/g, '');
      const budgetNum = parseInt(budgetStr, 10);
      if (budgetNum >= 1000 && budgetNum <= 100000000) {
        info.budget = budgetNum;
        break;
      }
    }
  }

  return info;
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
      return `Je peux vous aider à analyser ce projet ! [ACTION:/recherche-subventions|Cliquez ici pour lancer l'analyse|${params.join('&')}] et découvrez les subventions disponibles pour ${projectDesc || 'votre projet'}.`;
    }
  }

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello')) {
    return 'Bonjour ! Je suis l\'assistant Granto. Je peux vous aider à naviguer dans la plateforme, trouver des subventions adaptées à vos projets ou vous guider dans le montage de dossiers. Comment puis-je vous aider ?';
  }

  // Demande explicite d'utiliser l'assistant IA sans fournir de détails
  if ((lower.includes('assistant') || lower.includes('analyser') || lower.includes('analyse')) && !hasProject && !hasCommune && !hasBudget) {
    return 'Parfait ! L\'**Assistant IA** va analyser votre projet et vous proposer les meilleures subventions disponibles.\n\nPour commencer, j\'ai besoin de quelques informations :\n\n1️⃣ **Quel est votre projet ?** (ex: rénovation énergétique d\'une école, aménagement d\'une place, construction d\'une salle polyvalente...)\n\n2️⃣ **Dans quelle commune ?** (nom de la commune)\n\n3️⃣ **Quel est votre budget estimé ?** (en euros)\n\nVous pouvez me donner ces informations dans un seul message ou une par une. 😊';
  }

  if (lower.includes('subvention') || lower.includes('aide') || lower.includes('financement')) {
    return 'Pour rechercher des subventions adaptées à votre projet, rendez-vous dans [LINK:/recherche-subventions|Recherche de subventions]. Vous pouvez aussi utiliser [LINK:/recherche-subventions|l\'Assistant IA] qui analyse automatiquement votre projet et identifie les meilleures aides disponibles avec un score de pertinence.';
  }

  if (lower.includes('dossier') || lower.includes('demande') || lower.includes('pdf')) {
    return 'Granto peut générer automatiquement vos dossiers de demande de subvention en PDF professionnel. Utilisez [LINK:/recherche-subventions|l\'Assistant IA] pour analyser votre projet, puis cliquez sur "Télécharger le dossier" pour obtenir un document complet prêt à envoyer. Vous pouvez personnaliser le template dans [LINK:/parametres/templates|Paramètres].';
  }

  if (lower.includes('detr') || lower.includes('dsil')) {
    return 'La **DETR** (Dotation d\'Équipement des Territoires Ruraux) et la **DSIL** (Dotation de Soutien à l\'Investissement Local) sont les deux principales dotations de l\'État pour les collectivités. [LINK:/recherche-subventions|L\'Assistant IA] de Granto évalue automatiquement l\'éligibilité de votre projet à ces dispositifs.';
  }

  if (lower.includes('comment') && lower.includes('fonctionne')) {
    return 'Granto simplifie la gestion des subventions en 3 étapes :\n1. **Décrivez votre projet** via [LINK:/recherche-subventions|l\'Assistant IA]\n2. **Identifiez les aides** grâce à [LINK:/recherche-subventions|notre moteur de recherche]\n3. **Générez vos dossiers** en PDF professionnel, prêts à envoyer\n\nLe tout avec un [LINK:/|tableau de bord] centralisé pour suivre vos demandes.';
  }

  if (lower.includes('template') || lower.includes('logo') || lower.includes('personnalis')) {
    return 'Vous pouvez personnaliser vos documents PDF dans [LINK:/parametres/templates|Paramètres > Templates]. Ajoutez le logo de votre collectivité, modifiez les couleurs, les marges, et les en-têtes/pieds de page pour créer des dossiers à votre image.';
  }

  return 'Je suis l\'assistant Granto, votre guide pour la gestion des subventions. Je peux vous aider à :\n- [LINK:/recherche-subventions|Rechercher des aides] adaptées à vos projets\n- [LINK:/recherche-subventions|Utiliser l\'Assistant IA] pour analyser vos besoins\n- Générer des dossiers PDF professionnels\n- [LINK:/|Naviguer dans la plateforme]\n\nQue souhaitez-vous faire ?';
}

module.exports = router;
