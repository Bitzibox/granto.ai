import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const collectivitesAPI = {
  getAll: () => api.get('/collectivites'),
  getById: (id) => api.get(`/collectivites/${id}`),
  create: (data) => api.post('/collectivites', data),
  update: (id, data) => api.put(`/collectivites/${id}`, data),
  delete: (id) => api.delete(`/collectivites/${id}`),
};

export const projetsAPI = {
  getAll: () => api.get('/projets'),
  getById: (id) => api.get(`/projets/${id}`),
  create: (data) => api.post('/projets', data),
  update: (id, data) => api.put(`/projets/${id}`, data),
  delete: (id) => api.delete(`/projets/${id}`),
};

export const dispositifsAPI = {
  getAll: () => api.get('/dispositifs'),
  getById: (id) => api.get(`/dispositifs/${id}`),
  create: (data) => api.post('/dispositifs', data),
  update: (id, data) => api.put(`/dispositifs/${id}`, data),
  delete: (id) => api.delete(`/dispositifs/${id}`),
};

export const dossiersAPI = {
  getAll: () => api.get('/dossiers'),
  getById: (id) => api.get(`/dossiers/${id}`),
  create: (data) => api.post('/dossiers', data),
  update: (id, data) => api.put(`/dossiers/${id}`, data),
  delete: (id) => api.delete(`/dossiers/${id}`),
};

export default api;
