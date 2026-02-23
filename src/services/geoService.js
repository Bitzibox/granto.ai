/**
 * Service de géolocalisation des communes
 * Identifie le département et la région d'une commune
 */

const axios = require('axios');

// Cache pour éviter les requêtes répétées
const communeCache = new Map();

// Mapping région -> départements
const REGIONS = {
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  'Bretagne': ['22', '29', '35', '56'],
  'Normandie': ['14', '27', '50', '61', '76'],
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
  'Corse': ['2A', '2B']
};

/**
 * Identifie le département et la région d'une commune
 * @param {string} communeName - Nom de la commune
 * @returns {Promise<{departement: string, region: string, codePostal: string}>}
 */
async function identifierCommune(communeName) {
  // Vérifier le cache
  const cached = communeCache.get(communeName.toLowerCase());
  if (cached) {
    return cached;
  }

  try {
    // API Geo du gouvernement français
    const response = await axios.get(`https://geo.api.gouv.fr/communes`, {
      params: {
        nom: communeName,
        fields: 'nom,code,codeDepartement,codeRegion,codesPostaux,region,departement',
        format: 'json',
        limit: 1
      }
    });

    if (response.data && response.data.length > 0) {
      const commune = response.data[0];

      const result = {
        nom: commune.nom,
        code: commune.code,
        departement: commune.codeDepartement,
        codePostal: commune.codesPostaux?.[0] || '',
        region: trouverNomRegion(commune.codeDepartement)
      };

      // Mettre en cache
      communeCache.set(communeName.toLowerCase(), result);

      console.log(`📍 Commune identifiée: ${result.nom} (${result.departement} - ${result.region})`);

      return result;
    }

    throw new Error(`Commune "${communeName}" non trouvée`);
  } catch (error) {
    console.error(`Erreur identification commune ${communeName}:`, error.message);

    // Fallback: essayer d'extraire le département du nom si format "Ville (72)"
    const deptMatch = communeName.match(/\((\d{2}[AB]?)\)/);
    if (deptMatch) {
      const dept = deptMatch[1];
      return {
        nom: communeName.replace(/\s*\(\d{2}[AB]?\)\s*/, ''),
        departement: dept,
        region: trouverNomRegion(dept),
        codePostal: dept + '000'
      };
    }

    throw error;
  }
}

/**
 * Trouve le nom de la région à partir du code département
 */
function trouverNomRegion(codeDept) {
  for (const [region, depts] of Object.entries(REGIONS)) {
    if (depts.includes(codeDept)) {
      return region;
    }
  }
  return 'France';
}

/**
 * Vérifie si une aide est éligible géographiquement pour une commune
 * @param {string} perimeter - Périmètre de l'aide (ex: "Sarthe (72)", "France")
 * @param {string} departement - Code département de la commune (ex: "72")
 * @param {string} region - Nom de la région (ex: "Pays de la Loire")
 * @returns {boolean}
 */
function estEligibleGeographiquement(perimeter, departement, region) {
  if (!perimeter) return false;

  const p = perimeter.toLowerCase();

  // Aide nationale
  if (p.includes('france') && !p.includes('île-de-france') && !p.includes('outre-mer')) {
    return true;
  }

  // Aide régionale
  if (region && p.includes(region.toLowerCase())) {
    return true;
  }

  // Aide départementale (chercher le code ou le nom)
  if (p.includes(departement.toLowerCase()) || p.includes(`(${departement})`)) {
    return true;
  }

  // Noms spécifiques de départements
  const nomsSpeciaux = {
    '72': ['sarthe'],
    '44': ['loire-atlantique', 'loire atlantique'],
    '49': ['maine-et-loire', 'maine et loire'],
    '53': ['mayenne'],
    '85': ['vendée', 'vendee']
  };

  if (nomsSpeciaux[departement]) {
    for (const nom of nomsSpeciaux[departement]) {
      if (p.includes(nom)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  identifierCommune,
  estEligibleGeographiquement,
  REGIONS
};
