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
  const apiParams = {
    page: params.page || 1,
    page_size: params.pageSize || 200
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

  // Construire les headers (l'API publique fonctionne sans authentification)
  const headers = {};
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  try {
    // Tenter l'authentification si une clé API est configurée
    if (API_KEY && (!bearerToken || !isAuthenticated)) {
      try {
        await authenticate();
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
      } catch (authError) {
        console.warn('⚠️ Authentification échouée, requête sans token:', authError.message);
      }
    }

    console.log('🔍 Recherche aides, params:', apiParams, bearerToken ? '(avec token)' : '(sans token)');

    const response = await axios.get(`${API_BASE_URL}/aids/`, {
      params: apiParams,
      headers
    });

    return response.data;
  } catch (error) {
    // Si erreur 401, réessayer SANS le header Authorization
    if (error.response?.status === 401) {
      console.log('🔄 Erreur 401, réessai sans authentification...');
      isAuthenticated = false;
      bearerToken = null;

      const response = await axios.get(`${API_BASE_URL}/aids/`, {
        params: apiParams
      });
      return response.data;
    }

    console.error('❌ Erreur recherche aides:', error.response?.status, error.message);
    throw error;
  }
};

const getAidDetails = async (slug) => {
  const headers = {};

  // Tenter l'authentification si une clé API est configurée
  if (API_KEY && (!bearerToken || !isAuthenticated)) {
    try {
      await authenticate();
    } catch (authError) {
      console.warn('⚠️ Authentification échouée pour détails aide:', authError.message);
    }
  }

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/aids/${slug}/`, { headers });
    return response.data;
  } catch (error) {
    // Si 401, réessayer sans token
    if (error.response?.status === 401 && bearerToken) {
      console.log('🔄 Erreur 401 détails aide, réessai sans token...');
      isAuthenticated = false;
      bearerToken = null;
      const response = await axios.get(`${API_BASE_URL}/aids/${slug}/`);
      return response.data;
    }
    console.error('❌ Erreur détails aide:', error.response?.status, error.message);
    throw error;
  }
};

module.exports = {
  authenticate,
  searchAids,
  getAidDetails
};
