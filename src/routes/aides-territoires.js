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

    const params = {
      text: req.query.text || ''
    };

    console.log('Paramètres envoyés à l API:', params);

    const data = await searchAids(params);

    console.log(`✅ ${data.count} résultats bruts de l API`);

    let filteredResults = data.results || [];

    if (req.query.perimeter) {
      const perimeterQuery = req.query.perimeter.toLowerCase().trim();
      const includeRegional = req.query.includeRegional !== 'false';
      
      console.log(`🔍 Filtrage pour: "${perimeterQuery}" (regional: ${includeRegional})`);

      const targetRegion = DEPT_TO_REGION[perimeterQuery];

      filteredResults = filteredResults.filter(aid => {
        const perimeter = (aid.perimeter || '').toLowerCase();
        const perimeterCode = (aid.perimeter_code || '').toLowerCase();
        const region = (aid.region || '').toLowerCase();

        if (perimeter === 'france') {
          return true;
        }

        const exactMatch = 
          perimeter.includes(perimeterQuery) || 
          perimeterCode === perimeterQuery;
        
        if (exactMatch) {
          return true;
        }

        const isOtherDepartment = PAYS_LOIRE_DEPTS.some(dept => {
          if (dept === perimeterQuery) return false;
          return perimeter.includes(dept) || perimeterCode === dept;
        });
        
        if (isOtherDepartment) {
          return false;
        }

        if (includeRegional && targetRegion) {
          const isRegionalAid = 
            region.includes(targetRegion) || 
            perimeter.includes(targetRegion);
          
          if (isRegionalAid) {
            return true;
          }
        }

        return false;
      });

      console.log(`✅ ${filteredResults.length} résultats après filtrage`);
      
      const uniquePerimeters = [...new Set(filteredResults.map(a => a.perimeter))];
      console.log(`📍 Périmètres finaux: ${uniquePerimeters.join(', ')}`);
    }

    // Nettoyer le HTML des descriptions
    const cleanedResults = filteredResults.map(aid => ({
      ...aid,
      description: aid.description ? striptags(aid.description).trim() : '',
      eligibility: aid.eligibility ? striptags(aid.eligibility).trim() : ''
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
