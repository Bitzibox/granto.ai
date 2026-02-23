const express = require('express');
const router = express.Router();
const { analyzeProject, explainMatch } = require('../services/geminiService');
const { searchAids } = require('../services/aidesTerritoires');
const { identifierCommune, estEligibleGeographiquement } = require('../services/geoService');
const { genererDossierPDF } = require('../services/pdfService');

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

    // 5. Filtrer et scorer les aides
    const aidesAvecScores = await Promise.all(
      aides.map(async (aide) => {
        let score = 0;
        const perimeter = (aide.perimeter || '').toLowerCase();
        const name = (aide.name || '').toLowerCase();
        const description = (aide.description || '').toLowerCase();

        // Scoring prioritaire Sarthe
        if (SARTHE_DEPTS.some(d => perimeter.includes(d) || name.includes(d))) {
          score += 50; // Priorité maximale Sarthe
        } else if (PAYS_LOIRE_DEPTS.some(d => perimeter.includes(d))) {
          score += 30; // Pays de la Loire
        } else if (perimeter.includes('france') && !perimeter.includes('île')) {
          score += 20; // National
        } else {
          score += 5; // Autres
        }

        // Score basé sur catégorie
        if (name.includes(analysis.categorie_principale) ||
            description.includes(analysis.categorie_principale)) {
          score += 25;
        }

        // Score basé sur mots-clés
        analysis.mots_cles.forEach(mot => {
          if (name.includes(mot) || description.includes(mot)) {
            score += 10;
          }
        });

        // DETR/DSIL bonus
        if ((name.includes('detr') || name.includes('dsil')) &&
            (analysis.eligibilite_detr || analysis.eligibilite_dsil)) {
          score += 40;
        }

        // Montant compatible
        if (aide.subvention_rate_lower_bound && aide.subvention_rate_upper_bound) {
          const montantMin = aide.subvention_rate_lower_bound * analysis.montant_estime / 100;
          const montantMax = aide.subvention_rate_upper_bound * analysis.montant_estime / 100;
          if (montantMin <= analysis.montant_estime && montantMax >= analysis.montant_estime * 0.3) {
            score += 15;
          }
        }

        // Générer explication du match
        let explication = '';
        try {
          explication = await explainMatch(analysis, aide);
        } catch (err) {
          console.warn('Erreur génération explication:', err.message);
          explication = `Cette aide est adaptée à votre projet de ${analysis.categorie_principale}.`;
        }

        return {
          ...aide,
          score,
          explication,
          external_url: `https://aides-territoires.beta.gouv.fr/aides/${aide.slug}/`
        };
      })
    );

    // 4. Trier par score et prendre top 3
    const top3 = aidesAvecScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`✅ Top 3 aides avec scores:`, top3.map(a => ({ nom: a.name, score: a.score })));

    res.json({
      success: true,
      analysis,
      commune: communeInfo,
      aides: top3,
      total_found: aides.length,
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
    const { aide, commune, analysis, collectivite } = req.body;

    if (!aide || !commune || !analysis) {
      return res.status(400).json({
        error: 'Paramètres manquants pour la génération PDF'
      });
    }

    console.log(`📄 Génération PDF pour aide: ${aide.name}`);

    // Générer le PDF
    const pdfBuffer = await genererDossierPDF({
      projet: {
        description: analysis.description_enrichie,
        budget: analysis.montant_estime
      },
      aide,
      commune,
      collectivite: collectivite || commune.nom,
      analysis
    });

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
