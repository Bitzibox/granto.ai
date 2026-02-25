const express = require('express');
const router = express.Router();
const { analyzeProject, explainMatch } = require('../services/geminiService');
const { searchAids } = require('../services/aidesTerritoires');
const { identifierCommune, estEligibleGeographiquement } = require('../services/geoService');
const { genererDossierPDF } = require('../services/pdfService');
const { getTemplateById, getDefaultTemplate, getSystemDefaultTemplate } = require('../services/pdfTemplateService');

// Départements Sarthe et Pays de la Loire
const SARTHE_DEPTS = ['72', 'sarthe', 'saint-mars', 'le mans', 'mans'];
const PAYS_LOIRE_DEPTS = ['44', '49', '53', '72', '85', 'loire-atlantique', 'maine-et-loire', 'mayenne', 'sarthe', 'vendée'];

/**
 * POST /api/assistant-ia/analyze
 * Analyse un projet avec Gemini et trouve les meilleures aides
 */
router.post('/analyze', async (req, res) => {
  try {
    const { description, commune, budget } = req.body;

    if (!description || !commune || !budget) {
      return res.status(400).json({
        error: 'Description, commune et budget requis'
      });
    }

    console.log(`🤖 Analyse IA: ${description} - ${commune} - ${budget}€`);

    // 1. Identifier la commune (département et région)
    let communeInfo;
    try {
      communeInfo = await identifierCommune(commune);
      console.log(`📍 Commune: ${communeInfo.nom} - Dept: ${communeInfo.departement} - Région: ${communeInfo.region}`);
    } catch (error) {
      console.warn(`⚠️ Impossible d'identifier la commune ${commune}, on continue sans filtrage géo`);
      communeInfo = { departement: null, region: null };
    }

    // 2. Analyser le projet avec Gemini
    const analysis = await analyzeProject(description, commune, budget);
    console.log('📊 Analyse Gemini:', analysis);

    // 3. Rechercher les aides correspondantes
    const searchParams = {
      text: analysis.mots_cles.join(' '),
      targeted_audiences: 'commune',
      pageSize: 50
    };

    const aidesData = await searchAids(searchParams);
    let aides = aidesData.results || [];

    console.log(`📦 ${aides.length} aides trouvées avant filtrage géographique`);

    // 4. FILTRAGE GÉOGRAPHIQUE - Ne garder que les aides éligibles
    if (communeInfo.departement) {
      aides = aides.filter(aide => {
        const eligible = estEligibleGeographiquement(
          aide.perimeter,
          communeInfo.departement,
          communeInfo.region
        );
        if (!eligible) {
          console.log(`❌ Rejeté (hors zone): ${aide.name} - Périmètre: ${aide.perimeter}`);
        }
        return eligible;
      });

      console.log(`✅ ${aides.length} aides éligibles après filtrage géographique`);
    }

    // 5. Filtrer et scorer les aides avec scoring amélioré
    const aidesAvecScores = await Promise.all(
      aides.map(async (aide) => {
        let score = 0;
        const perimeter = (aide.perimeter || '').toLowerCase();
        const name = (aide.name || '').toLowerCase();
        const description = (aide.description || '').toLowerCase();
        const fullText = `${name} ${description}`;

        // 1. Scoring géographique prioritaire (40 points max)
        if (communeInfo.departement && perimeter.includes(communeInfo.departement)) {
          score += 40; // Même département - priorité maximale
        } else if (SARTHE_DEPTS.some(d => perimeter.includes(d) || name.includes(d))) {
          score += 35; // Sarthe spécifiquement
        } else if (PAYS_LOIRE_DEPTS.some(d => perimeter.includes(d))) {
          score += 25; // Pays de la Loire
        } else if (perimeter.includes('france') && !perimeter.includes('île')) {
          score += 15; // National
        }

        // 2. DETR/DSIL bonus (30 points max) - très important pour communes
        if ((name.includes('detr') || name.includes('dsil')) &&
            (analysis.eligibilite_detr || analysis.eligibilite_dsil)) {
          score += 30;
        }

        // 3. Score basé sur catégorie principale (20 points)
        if (fullText.includes(analysis.categorie_principale)) {
          score += 20;
        }

        // 4. Score basé sur mots-clés (max 30 points - 6 points par mot-clé trouvé)
        let motsClesTouves = 0;
        analysis.mots_cles.forEach(mot => {
          if (fullText.includes(mot.toLowerCase())) {
            motsClesTouves++;
            score += 6;
          }
        });

        // 5. Taux de subvention élevé (15 points max)
        if (aide.subvention_rate_upper_bound) {
          if (aide.subvention_rate_upper_bound >= 80) {
            score += 15;
          } else if (aide.subvention_rate_upper_bound >= 60) {
            score += 10;
          } else if (aide.subvention_rate_upper_bound >= 40) {
            score += 5;
          }
        }

        // 6. Bonus si le budget est dans la fourchette (10 points)
        if (aide.subvention_rate_lower_bound && aide.subvention_rate_upper_bound) {
          const subventionEstimee = (aide.subvention_rate_lower_bound + aide.subvention_rate_upper_bound) / 200 * analysis.montant_estime;
          if (subventionEstimee >= analysis.montant_estime * 0.3) {
            score += 10;
          }
        }

        // Normaliser le score sur 100
        const scoreNormalise = Math.min(100, Math.round(score));

        // Générer explication du match SEULEMENT pour le top 3 (optimisation)
        let explication = '';

        return {
          ...aide,
          score: scoreNormalise,
          explication, // Vide pour l'instant, sera rempli pour top 3
          external_url: `https://aides-territoires.beta.gouv.fr/aides/${aide.slug}/`,
          mots_cles_matches: motsClesTouves
        };
      })
    );

    // 6. Trier TOUS les résultats par score décroissant
    const aidesSortees = aidesAvecScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // En cas d'égalité, prioriser par nombre de mots-clés matchés
      return b.mots_cles_matches - a.mots_cles_matches;
    });

    // 7. Générer les explications IA UNIQUEMENT pour le top 3 (pour la performance)
    const top3 = aidesSortees.slice(0, 3);
    for (const aide of top3) {
      try {
        aide.explication = await explainMatch(analysis, aide);
      } catch (err) {
        console.warn('Erreur génération explication:', err.message);
        aide.explication = `Cette aide est adaptée à votre projet de ${analysis.categorie_principale}.`;
      }
    }

    // 8. Pour les autres, explication générique simple
    const autresAides = aidesSortees.slice(3);
    for (const aide of autresAides) {
      aide.explication = `Aide ${aide.score >= 60 ? 'pertinente' : 'possible'} pour votre projet.`;
    }

    console.log(`✅ Top 3 aides avec scores:`, top3.map(a => ({ nom: a.name, score: a.score })));
    console.log(`📋 Total aides retournées: ${aidesSortees.length}`);

    res.json({
      success: true,
      analysis,
      commune: communeInfo,
      aides: top3,
      autres_aides: autresAides,
      total_found: aidesSortees.length,
      total_eligible: aides.length
    });

  } catch (error) {
    console.error('❌ Erreur analyse IA:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de l\'analyse IA'
    });
  }
});

/**
 * POST /api/assistant-ia/generate-pdf
 * Génère un dossier de subvention en PDF
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    const { aide, commune, analysis, collectivite, templateId, userId } = req.body;

    if (!aide || !commune || !analysis) {
      return res.status(400).json({
        error: 'Paramètres manquants pour la génération PDF'
      });
    }

    console.log(`📄 Génération PDF pour aide: ${aide.name}`);

    // Récupérer le template à utiliser
    let templateConfig = null;
    try {
      if (templateId && templateId !== 'system-default') {
        // Template spécifique sélectionné
        console.log(`📋 Utilisation du template: ${templateId}`);
        templateConfig = await getTemplateById(templateId);
      } else if (userId) {
        // Récupérer le template par défaut de l'utilisateur
        console.log(`📋 Recherche du template par défaut pour l'utilisateur: ${userId}`);
        templateConfig = await getDefaultTemplate(userId);
        if (templateConfig) {
          console.log(`✅ Template par défaut trouvé: ${templateConfig.nom}`);
        } else {
          console.log(`⚠️ Pas de template par défaut, utilisation du template système`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Erreur récupération template, utilisation du template système:`, err.message);
      templateConfig = null;
    }

    // Générer le PDF avec le template
    const pdfBuffer = await genererDossierPDF({
      projet: {
        description: analysis.description_enrichie,
        budget: analysis.montant_estime
      },
      aide,
      commune,
      collectivite: collectivite || commune.nom,
      analysis
    }, templateConfig);

    // Nom de fichier sécurisé
    const filename = `Dossier_${aide.slug || 'subvention'}_${Date.now()}.pdf`;

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

    console.log(`✅ PDF généré: ${filename} (${pdfBuffer.length} bytes)`);

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

module.exports = router;
