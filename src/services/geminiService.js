/**
 * Service d'analyse IA avec Google Gemini
 * Pour l'assistant IA Sarthe - Analyse de projets et matching d'aides
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY non configurée dans .env');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Analyse un projet et génère des critères de recherche optimisés
 */
async function analyzeProject(description, commune, budget) {
  if (!genAI) {
    throw new Error('Gemini API non configurée');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0,  // Résultats déterministes
      topP: 0.1,
      topK: 1
    }
  });

  const prompt = `Tu es un expert en subventions publiques pour les collectivités territoriales de la Sarthe (Pays de la Loire).

PROJET À ANALYSER:
- Description: ${description}
- Commune: ${commune}
- Budget estimé: ${budget}€

TÂCHE:
Analyse ce projet et extrais les informations clés pour identifier les meilleures aides.

RÉPONDS AU FORMAT JSON EXACT (sans markdown):
{
  "categorie_principale": "energie" ou "voirie" ou "batiment" ou "environnement" ou "equipement" ou "numerique",
  "mots_cles": ["mot1", "mot2", "mot3"],
  "public_cible": "commune" ou "epci" ou "departement",
  "montant_estime": nombre,
  "urgence": "haute" ou "moyenne" ou "faible",
  "eligibilite_detr": true/false,
  "eligibilite_dsil": true/false,
  "description_enrichie": "Description professionnelle du projet pour le dossier"
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extraire le JSON (enlever markdown si présent)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Format de réponse invalide');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Génère une explication du match entre le projet et une aide
 */
async function explainMatch(projectAnalysis, aide) {
  if (!genAI) {
    return `Cette aide correspond à votre projet ${projectAnalysis.categorie_principale}.`;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Tu es un conseiller en subventions pour la Sarthe.

PROJET:
${projectAnalysis.description_enrichie}
Catégorie: ${projectAnalysis.categorie_principale}
Budget: ${projectAnalysis.montant_estime}€

AIDE IDENTIFIÉE:
Nom: ${aide.name}
Description: ${aide.description?.substring(0, 500)}
Financeur: ${aide.financers?.[0] || 'Non spécifié'}

Explique en 2-3 phrases courtes et concrètes pourquoi cette aide est pertinente pour ce projet.
Réponds directement sans introduction, au présent.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

/**
 * Génère le contenu du dossier de subvention complet
 */
async function generateDossierContent(projectAnalysis, aide, commune, collectivite) {
  if (!genAI) {
    throw new Error('Gemini API non configurée');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Tu es un expert en montage de dossiers de subvention pour les collectivités de la Sarthe.

PROJET:
${projectAnalysis.description_enrichie}
Budget: ${projectAnalysis.montant_estime}€
Commune: ${commune}

AIDE SOLLICITÉE:
${aide.name}
Financeur: ${aide.financers?.[0]}

GÉNÈRE un dossier de demande de subvention professionnel avec:

1. PRÉSENTATION DU CONTEXTE COMMUNAL (150 mots)
- Situation de la commune dans la Sarthe
- Enjeux locaux justifiant le projet

2. DESCRIPTION DÉTAILLÉE DU PROJET (200 mots)
- Objectifs précis
- Bénéfices attendus pour les habitants

3. PLAN DE FINANCEMENT
- Coût total HT: ${projectAnalysis.montant_estime}€
- Subvention sollicitée: ${Math.round(projectAnalysis.montant_estime * 0.7)}€ (70%)
- Autofinancement: ${Math.round(projectAnalysis.montant_estime * 0.3)}€ (30%)

4. CALENDRIER PRÉVISIONNEL
- Début travaux: [dans 2 mois]
- Durée: [selon type de projet]
- Fin travaux: [selon type de projet]

5. PIÈCES À FOURNIR
Liste précise des documents requis pour ce type de dossier

Réponds au format JSON:
{
  "contexte": "...",
  "description": "...",
  "plan_financement": {...},
  "calendrier": {...},
  "pieces_requises": [...]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Format de réponse invalide');
  }

  // Nettoyer TOUS les caractères de contrôle avant parsing
  let jsonText = jsonMatch[0];

  try {
    // Supprimer tous les caractères de contrôle ASCII (0-31) sauf espaces, tabs, newlines autorisés
    // Les remplacer par des espaces
    jsonText = jsonText.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ' ');

    // Normaliser les multiples espaces
    jsonText = jsonText.replace(/\s+/g, ' ');

    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error('❌ Erreur parsing JSON Gemini:', parseError.message);
    // Afficher le contexte autour de l'erreur
    const pos = parseInt(parseError.message.match(/\d+/)?.[0] || 0);
    console.error('📍 Position:', pos);
    console.error('📄 Contexte:', jsonText.substring(Math.max(0, pos - 100), Math.min(jsonText.length, pos + 100)));
    throw new Error(`Erreur parsing JSON: ${parseError.message}`);
  }
}

module.exports = {
  analyzeProject,
  explainMatch,
  generateDossierContent
};
