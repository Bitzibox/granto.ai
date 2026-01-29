const express = require('express');
const router = express.Router();
const striptags = require('striptags');
const { authenticate, searchAids, getAidDetails } = require('../services/aidesTerritoires');

// Mapping département → région
const DEPT_TO_REGION = {
  '72': 'pays de la loire',
  'sarthe': 'pays de la loire',
  '44': 'pays de la loire',
  '49': 'pays de la loire',
  '53': 'pays de la loire',
  '85': 'pays de la loire',
  'loire-atlantique': 'pays de la loire',
  'maine-et-loire': 'pays de la loire',
  'mayenne': 'pays de la loire',
  'vendée': 'pays de la loire',
  'vendee': 'pays de la loire'
};

const PAYS_LOIRE_DEPTS = ['44', '49', '53', '72', '85', 'loire-atlantique', 'maine-et-loire', 'mayenne', 'sarthe', 'vendée', 'vendee'];

router.get('/test', async (req, res) => {
  try {
    await authenticate();
    res.json({ success: true, message: 'Authentification réussie' });
  } catch (error) {
    console.error('Erreur test API:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - GET /api/aides-territoires/search`);
    console.log('Paramètres reçus:', req.query);

    // Construire les paramètres pour l'API
    const params = {};

    if (req.query.text) {
      params.text = req.query.text;
    }

    if (req.query.aid_types && req.query.aid_types !== 'all') {
      params.aid_types = req.query.aid_types;
    }

    if (req.query.categories && req.query.categories !== 'all') {
      params.categories = req.query.categories;
    }

    // Par défaut, cibler les collectivités locales
    params.targeted_audiences = req.query.targeted_audiences || 'commune';

    // Augmenter le nombre de résultats
    params.pageSize = 200;

    console.log('Paramètres envoyés à l API:', params);

    const data = await searchAids(params);

    console.log(`✅ ${data.count} résultats bruts de l API`);

    let filteredResults = data.results || [];

    // Filtrage géographique intelligent
    const territoire = (req.query.targeted_audiences || '').toLowerCase().trim();

    if (territoire) {
      console.log(`🔍 Filtrage géographique pour: "${territoire}"`);

      // Identifier la région cible
      const targetRegion = DEPT_TO_REGION[territoire] || findRegionForCity(territoire);

      filteredResults = filteredResults.filter(aid => {
        const perimeter = (aid.perimeter || '').toLowerCase();
        const perimeterScale = (aid.perimeter_scale || '').toLowerCase();

        // 1. TOUJOURS inclure les aides nationales
        if (perimeter === 'france' || perimeterScale === 'france' || perimeterScale === 'pays') {
          return true;
        }

        // 2. Inclure les aides de la région
        if (targetRegion) {
          const regionMatch = perimeter.includes(targetRegion);
          if (regionMatch) {
            return true;
          }
        }

        // 3. Inclure les aides du département (Sarthe = 72)
        const isSarthe = territoire.includes('mans') ||
                        territoire.includes('saint-mars') ||
                        territoire.includes('sarthe') ||
                        territoire === '72';

        if (isSarthe) {
          const deptMatch = perimeter.includes('sarthe') || perimeter.includes('72');
          if (deptMatch) {
            return true;
          }
        }

        // 4. Inclure les aides mentionnant spécifiquement la ville
        if (perimeter.includes(territoire)) {
          return true;
        }

        // 5. Exclure les aides d'autres régions/départements spécifiques
        // mais garder les aides intercommunales ou locales génériques
        if (perimeterScale === 'epci' || perimeterScale === 'commune') {
          // Vérifier si c'est pour la bonne zone
          return perimeter.includes(territoire) ||
                 perimeter.includes('sarthe') ||
                 perimeter.includes('pays de la loire');
        }

        return false;
      });

      console.log(`✅ ${filteredResults.length} résultats après filtrage géographique`);
    }

    // Nettoyer le HTML des descriptions et construire l'URL externe
    const cleanedResults = filteredResults.map(aid => ({
      ...aid,
      description: aid.description ? striptags(aid.description).trim() : '',
      eligibility: aid.eligibility ? striptags(aid.eligibility).trim() : '',
      // Construire l'URL externe correcte
      external_url: `https://aides-territoires.beta.gouv.fr/aides/${aid.slug}/`
    }));

    res.json({
      count: cleanedResults.length,
      total_available: data.count,
      results: cleanedResults
    });

  } catch (error) {
    console.error('❌ Erreur recherche:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fonction pour trouver la région d'une ville
function findRegionForCity(city) {
  const cityLower = city.toLowerCase();

  // Villes de Sarthe / Pays de la Loire
  const paysLoireVilles = [
    'le mans', 'mans', 'saint-mars-la-brière', 'saint mars', 'la flèche',
    'sablé', 'mamers', 'allonnes', 'coulaines', 'nantes', 'angers',
    'laval', 'la roche-sur-yon', 'saint-nazaire', 'cholet'
  ];

  for (const ville of paysLoireVilles) {
    if (cityLower.includes(ville)) {
      return 'pays de la loire';
    }
  }

  return null;
}

router.get('/aid/:id', async (req, res) => {
  try {
    const data = await getAidDetails(req.params.id);
    
    // Nettoyer le HTML
    if (data.description) {
      data.description = striptags(data.description);
    }
    if (data.eligibility) {
      data.eligibility = striptags(data.eligibility);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur détails aide:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
