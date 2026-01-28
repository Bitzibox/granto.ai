// Utiliser l'IP du serveur au lieu de localhost
const API_BASE_URL = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:3001/api`
  : '/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  // Si la réponse est 204 No Content, ne pas parser le JSON
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const collectivitesAPI = {
  getAll: () => fetchAPI('/collectivites'),
  getById: (id) => fetchAPI(`/collectivites/${id}`),
  create: (data) => fetchAPI('/collectivites', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/collectivites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/collectivites/${id}`, {
    method: 'DELETE',
  }),
};

export const projetsAPI = {
  getAll: () => fetchAPI('/projets'),
  getById: (id) => fetchAPI(`/projets/${id}`),
  create: (data) => fetchAPI('/projets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/projets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/projets/${id}`, {
    method: 'DELETE',
  }),
};

export const dispositifsAPI = {
  getAll: () => fetchAPI('/dispositifs'),
  getById: (id) => fetchAPI(`/dispositifs/${id}`),
};

export const dossiersAPI = {
  getAll: () => fetchAPI('/dossiers'),
};
