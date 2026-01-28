// Utiliser le proxy Next.js au lieu d'appeler directement localhost:3001
const API_BASE_URL = '/api';

// Helper function
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'API Error');
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
}

// Collectivités API
export const collectivitesAPI = {
  getAll: () => fetchAPI('/collectivites'),
  getById: (id: string) => fetchAPI(`/collectivites/${id}`),
  create: (data: any) => fetchAPI('/collectivites', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/collectivites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/collectivites/${id}`, { method: 'DELETE' }),
};

// Projets API
export const projetsAPI = {
  getAll: () => fetchAPI('/projets'),
  getById: (id: string) => fetchAPI(`/projets/${id}`),
  create: (data: any) => fetchAPI('/projets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/projets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/projets/${id}`, { method: 'DELETE' }),
};

// Dispositifs API
export const dispositifsAPI = {
  getAll: () => fetchAPI('/dispositifs'),
  getById: (id: string) => fetchAPI(`/dispositifs/${id}`),
  create: (data: any) => fetchAPI('/dispositifs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/dispositifs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/dispositifs/${id}`, { method: 'DELETE' }),
};

// Dossiers API
export const dossiersAPI = {
  getAll: () => fetchAPI('/dossiers'),
  getById: (id: string) => fetchAPI(`/dossiers/${id}`),
  getByProjet: (projetId: string) => fetchAPI(`/dossiers/projet/${projetId}`),
  create: (data: any) => fetchAPI('/dossiers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/dossiers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/dossiers/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/dossiers/stats/overview'),
};
