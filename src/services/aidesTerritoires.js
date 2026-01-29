const axios = require('axios');

const API_BASE_URL = 'https://aides-territoires.beta.gouv.fr/api';
const API_KEY = process.env.AIDES_TERRITOIRES_API_KEY;

let bearerToken = null;
let isAuthenticated = false;

const authenticate = async () => {
  if (!API_KEY) {
    console.log('⚠️ Pas de clé API configurée');
    return null;
  }

  if (isAuthenticated && bearerToken) {
    console.log('✅ Utilisation du token existant');
    return bearerToken;
  }

  try {
    console.log('🔐 Connexion à l\'API Aides-Territoires...');
    
    // Étape 1: Se connecter avec X-AUTH-TOKEN pour obtenir le Bearer token
    const response = await axios.post(`${API_BASE_URL}/connexion/`, {}, {
      headers: { 
        'X-AUTH-TOKEN': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    // Le bearer token est retourné dans la réponse
    bearerToken = response.data.token || response.data.access_token || response.data.bearer;
    
    if (!bearerToken) {
      console.error('❌ Pas de token dans la réponse:', response.data);
      throw new Error('Token non reçu');
    }
    
    isAuthenticated = true;
    console.log('✅ Authentification réussie, Bearer token obtenu');
    return bearerToken;
  } catch (error) {
    console.error('❌ Erreur authentification:', error.response?.status, error.message);
    if (error.response?.data) {
      console.error('Détails:', error.response.data);
    }
    throw error;
  }
};

const searchAids = async (params = {}) => {
  try {
    // S'assurer qu'on est authentifié
    if (!bearerToken || !isAuthenticated) {
      await authenticate();
    }

    const apiParams = {
      page: params.page || 1,
      page_size: params.pageSize || 200 // Augmenté pour avoir plus de résultats
    };

    // Ajouter la recherche textuelle si présente
    if (params.text) {
      apiParams.text = params.text;
    }

    // Filtrer par type d'aide si spécifié
    if (params.aid_types && params.aid_types !== 'all') {
      apiParams.aid_types = params.aid_types;
    }

    // Filtrer par audience cible (communes, EPCI, etc.)
    if (params.targeted_audiences) {
      apiParams.targeted_audiences = params.targeted_audiences;
    }

    // Filtrer par catégorie thématique
    if (params.categories && params.categories !== 'all') {
      apiParams.categories = params.categories;
    }

    // Filtrer par périmètre géographique (code INSEE ou nom)
    if (params.perimeter) {
      apiParams.perimeter = params.perimeter;
    }

    console.log('🔍 Recherche avec Bearer token, params:', apiParams);

    const response = await axios.get(`${API_BASE_URL}/aids/`, {
      params: apiParams,
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    return response.data;
  } catch (error) {
    // Si erreur 401, réessayer avec une nouvelle authentification
    if (error.response?.status === 401) {
      console.log('🔄 Token expiré, réauthentification...');
      isAuthenticated = false;
      bearerToken = null;
      await authenticate();

      // Réessayer la requête
      const response = await axios.get(`${API_BASE_URL}/aids/`, {
        params: apiParams,
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      });
      return response.data;
    }

    console.error('❌ Erreur recherche aides:', error.response?.status, error.message);
    throw error;
  }
};

const getAidDetails = async (slug) => {
  try {
    if (!bearerToken || !isAuthenticated) {
      await authenticate();
    }

    const response = await axios.get(`${API_BASE_URL}/aids/${slug}/`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur détails aide:', error.response?.status, error.message);
    throw error;
  }
};

module.exports = {
  authenticate,
  searchAids,
  getAidDetails
};
