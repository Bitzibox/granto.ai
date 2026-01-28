const axios = require('axios');

const API_BASE_URL = 'https://aides-territoires.beta.gouv.fr/api';
const API_KEY = process.env.AIDES_TERRITOIRES_API_KEY;

let authToken = null;

const authenticate = async () => {
  if (!API_KEY) {
    console.log('⚠️ Pas de clé API');
    return null;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/aids/`, {
      params: { page_size: 1 },
      headers: { 'Authorization': `Token ${API_KEY}` }
    });
    authToken = API_KEY;
    console.log('✅ Authentification Aides-Territoires réussie');
    return authToken;
  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    throw error;
  }
};

const searchAids = async (params = {}) => {
  try {
    const apiParams = {
      text: params.text || '',
      page: params.page || 1,
      page_size: params.pageSize || 50
    };

    const headers = authToken ? { 'Authorization': `Token ${authToken}` } : {};
    
    const response = await axios.get(`${API_BASE_URL}/aids/`, {
      params: apiParams,
      headers
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erreur recherche aides:', error.message);
    throw error;
  }
};

const getAidDetails = async (slug) => {
  try {
    const headers = authToken ? { 'Authorization': `Token ${authToken}` } : {};
    const response = await axios.get(`${API_BASE_URL}/aids/${slug}/`, { headers });
    return response.data;
  } catch (error) {
    console.error('❌ Erreur détails aide:', error.message);
    throw error;
  }
};

module.exports = {
  authenticate,
  searchAids,
  getAidDetails
};
