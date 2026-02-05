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
  'vendee': 'pays de la loire',

  // Normandie
  '14': 'normandie',
  '27': 'normandie',
  '50': 'normandie',
  '61': 'normandie',
  '76': 'normandie',
  'calvados': 'normandie',
  'eure': 'normandie',
  'manche': 'normandie',
  'orne': 'normandie',
  'seine-maritime': 'normandie',
};

// Mapping ville → département
const CITY_TO_DEPT = {
  // Pays de la Loire
  'le mans': 'sarthe',
  'mans': 'sarthe',
  'nantes': 'loire-atlantique',
  'angers': 'maine-et-loire',
  'laval': 'mayenne',
  'la roche-sur-yon': 'vendée',

  // Normandie
  'caen': 'calvados',
  'évreux': 'eure',
  'evreux': 'eure',
  'saint-lô': 'manche',
  'saint-lo': 'manche',
  'alençon': 'orne',
  'alencon': 'orne',
  'rouen': 'seine-maritime',
  'le havre': 'seine-maritime',
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

    // TOUJOURS cibler les communes pour avoir le maximum d'aides
    // Le filtrage géographique se fera côté backend
    params.targeted_audiences = 'commune';

    // L'API limite à 50 résultats par page, il faut paginer
    params.pageSize = 50;

    console.log('Paramètres envoyés à l\'API:', params);

    // Récupérer toutes les pages de résultats
    let allResults = [];
    let currentPage = 1;
    let totalCount = 0;

    console.log('📄 Récupération de toutes les pages...');

    while (true) {
      params.page = currentPage;
      const data = await searchAids(params);

      if (currentPage === 1) {
        totalCount = data.count;
        console.log(`✅ ${totalCount} résultats totaux à récupérer`);
      }

      const pageResults = data.results || [];
      console.log(`📦 Page ${currentPage}: ${pageResults.length} résultats`);

      if (pageResults.length === 0) {
        break; // Plus de résultats
      }

      allResults = allResults.concat(pageResults);
      currentPage++;

      // Sécurité : arrêter après 10 pages max (500 résultats)
      if (currentPage > 10) {
        console.log('⚠️ Limite de 10 pages atteinte');
        break;
      }

      // Si on a récupéré tous les résultats, arrêter
      if (allResults.length >= totalCount) {
        break;
      }
    }

    console.log(`✅ Total récupéré: ${allResults.length} résultats sur ${totalCount}`);

    let filteredResults = allResults;

    // Mapping ID → slug pour aid_types_full (l'API utilise des IDs, pas des slugs)
    const AID_TYPE_ID_TO_SLUG = {
      1: 'grant',                    // Subvention
      2: 'loan',                     // Prêt
      3: 'recoverable_advance',      // Avance récupérable
      4: 'cee',                      // Certificat d'économie d'énergie
      5: 'other',                    // Autre aide financière
      6: 'technical_engineering',    // Ingénierie technique
      7: 'financial_engineering',    // Ingénierie financière
      8: 'legal_engineering'         // Ingénierie juridique
    };

    // Filtrer par type d'aide côté backend si spécifié
    const aidTypeFilter = req.query.aid_types;
    if (aidTypeFilter && aidTypeFilter !== 'all') {
      const initialCount = filteredResults.length;
      console.log(`🔍 Tentative de filtrage par type "${aidTypeFilter}"...`);

      filteredResults = filteredResults.filter(aid => {
        // L'API retourne aid_types_full avec des objets {id, name}
        const aidTypesFull = aid.aid_types_full || [];

        // Log détaillé pour les 5 premières aides
        if (initialCount <= 5) {
          console.log(`  📋 "${aid.name}":`);
          console.log(`     aid_types_full = ${JSON.stringify(aidTypesFull)}`);
          console.log(`     recherché = "${aidTypeFilter}"`);
        }

        // Vérifier dans aid_types_full en mappant les IDs aux slugs
        let hasType = false;

        if (Array.isArray(aidTypesFull) && aidTypesFull.length > 0) {
          hasType = aidTypesFull.some(type => {
            const slug = AID_TYPE_ID_TO_SLUG[type.id];
            return slug === aidTypeFilter;
          });
        }

        return hasType;
      });

      console.log(`✅ Filtrage par type "${aidTypeFilter}": ${initialCount} → ${filteredResults.length} résultats`);

      if (filteredResults.length === 0 && initialCount > 0) {
        console.log(`⚠️ ATTENTION: Aucun résultat après filtrage par type. Vérifiez que le paramètre correspond aux valeurs de l'API.`);
      }
    }

    // Récupérer le territoire saisi par l'utilisateur
    const territoire = (req.query.targeted_audiences || '').toLowerCase().trim();

    // ÉTAPE 1 : Filtrage géographique côté backend (PRIORITÉ)
    // Cela permet de garder les aides régionales/départementales même si elles ne contiennent pas les mots-clés
    if (territoire && territoire !== 'commune') {
      console.log(`🔍 Filtrage géographique côté backend pour: "${territoire}"`);

      // Identifier le département et la région cible
      // Si c'est une ville connue, récupérer son département
      // Sinon si c'est déjà un département connu, l'utiliser directement
      const targetDept = CITY_TO_DEPT[territoire] || (DEPT_TO_REGION[territoire] ? territoire : null);
      const targetRegion = targetDept ? DEPT_TO_REGION[targetDept] : (DEPT_TO_REGION[territoire] || findRegionForCity(territoire));

      console.log(`📍 Ville: "${territoire}" → Département: ${targetDept || 'inconnu'} → Région: ${targetRegion || 'inconnue'}`);

      const beforeGeoFilter = filteredResults.length;
      let excludedCount = 0;
      let nationalCount = 0;
      let regionalCount = 0;
      let departmentalCount = 0;

      filteredResults = filteredResults.filter(aid => {
        const perimeter = (aid.perimeter || '').toLowerCase();
        const perimeterScale = (aid.perimeter_scale || '').toLowerCase();

        // 1. TOUJOURS inclure les aides nationales (France ou Pays)
        // IMPORTANT: "Île-de-France" contient "france" donc on doit vérifier scale d'abord
        const isNational =
          perimeterScale === 'france' ||
          perimeterScale === 'pays' ||
          perimeter === 'france' ||
          (perimeter.includes('france') && !perimeter.includes('île')); // Exclure "Île-de-France"

        if (isNational) {
          nationalCount++;
          if (nationalCount <= 3) {
            console.log(`✅ Nationale: "${aid.name}"`);
          }
          return true;
        }

        // 2. Inclure les aides régionales si on a identifié une région
        if (targetRegion && perimeter.includes(targetRegion)) {
          regionalCount++;
          if (regionalCount <= 3) {
            console.log(`✅ Régionale: "${aid.name}" (${aid.perimeter})`);
          }
          return true;
        }

        // 3. Inclure les aides départementales si on a identifié un département
        if (targetDept && perimeter.includes(targetDept)) {
          departmentalCount++;
          if (departmentalCount <= 3) {
            console.log(`✅ Départementale: "${aid.name}" (${aid.perimeter})`);
          }
          return true;
        }

        // 4. Inclure les aides mentionnant spécifiquement la ville ou le territoire
        if (territoire.length > 2 && perimeter.includes(territoire)) {
          console.log(`✅ Locale: "${aid.name}"`);
          return true;
        }

        // 5. Exclure les aides d'autres régions
        excludedCount++;
        if (excludedCount <= 3) {
          console.log(`❌ EXCLUE: "${aid.name}" (${aid.perimeter_scale} - ${aid.perimeter})`);
        }
        return false;
      });

      if (excludedCount > 3) {
        console.log(`❌ ... et ${excludedCount - 3} autres aides exclues`);
      }

      if (nationalCount > 3) {
        console.log(`✅ ... et ${nationalCount - 3} autres aides nationales`);
      }

      if (regionalCount > 3) {
        console.log(`✅ ... et ${regionalCount - 3} autres aides régionales`);
      }

      if (departmentalCount > 3) {
        console.log(`✅ ... et ${departmentalCount - 3} autres aides départementales`);
      }

      console.log(`📊 Résumé filtrage géographique: ${beforeGeoFilter} → ${filteredResults.length} résultats (${nationalCount} nationales, ${regionalCount} régionales, ${departmentalCount} départementales)`);

    } else {
      // Pas de territoire spécifié = pas de filtrage géographique
      console.log('📍 Pas de filtrage géographique');
    }

    // ÉTAPE 2 : Filtrer par pertinence des mots-clés si spécifiés
    // IMPORTANT : Les aides régionales/départementales/locales sont TOUJOURS gardées (elles sont rares et précieuses)
    // Seules les aides nationales sont filtrées par pertinence
    const searchText = req.query.text;
    if (searchText && searchText.trim()) {
      const initialCount = filteredResults.length;
      const keywords = searchText.toLowerCase().split(/\s+/).filter(k => k.length > 2);

      console.log(`🔍 Filtrage par pertinence des mots-clés: "${keywords.join('", "')}"`);

      filteredResults = filteredResults.filter(aid => {
        const perimeter = (aid.perimeter || '').toLowerCase();
        const perimeterScale = (aid.perimeter_scale || '').toLowerCase();

        // TOUJOURS garder les aides régionales, départementales et locales (pas de filtrage par pertinence)
        const isNational =
          perimeterScale === 'france' ||
          perimeterScale === 'pays' ||
          perimeter === 'france' ||
          (perimeter.includes('france') && !perimeter.includes('île'));

        if (!isNational) {
          // Aide régionale/départementale/locale -> TOUJOURS garder
          console.log(`✅ Garde (locale): "${aid.name}"`);
          return true;
        }

        // Pour les aides nationales, vérifier la pertinence des mots-clés
        const name = (aid.name || '').toLowerCase();
        const description = (aid.description || '').toLowerCase();

        const hasRelevantKeyword = keywords.some(keyword =>
          name.includes(keyword) || description.includes(keyword)
        );

        if (!hasRelevantKeyword && initialCount <= 10) {
          console.log(`❌ Non pertinent: "${aid.name}" (mots-clés manquants)`);
        }

        return hasRelevantKeyword;
      });

      console.log(`✅ Filtrage par pertinence: ${initialCount} → ${filteredResults.length} résultats`);
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
