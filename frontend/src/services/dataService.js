import api from './api';

/**
 * Service for Player/Ranking management
 */
export const playerService = {
  getAll: () => api.get('/api/players'),
  getRanking: () => api.get('/api/ranking'),
  getById: (id) => api.get(`/api/players/${id}`),
  create: (data) => api.post('/api/players', data),
  update: (id, data) => api.put(`/api/players/${id}`, data),
  delete: (id) => api.delete(`/api/players/${id}`),
};

/**
 * Service for Match results management
 */
export const matchService = {
  getResults: (page = 1, playerId = '') =>
    api.get(`/api/results?page=${page}${playerId ? `&playerId=${playerId}` : ''}`),
  getById: (id) => api.get(`/api/matches/${id}`),
  create: (data) => api.post('/api/matches', data),
  update: (id, data) => api.put(`/api/matches/${id}`, data),
  delete: (id) => api.delete(`/api/matches/${id}`),
};

/**
 * Service for Tournament (Opens) management
 */
export const openService = {
  getAll: () => api.get('/api/opens'),
  getById: (id) => api.get(`/api/opens/${id}`),
  getMatches: (openId) => api.get(`/api/opens/${openId}/matches`),
  create: (data) => api.post('/api/opens', data),
  update: (id, data) => api.put(`/api/opens/${id}`, data),
  delete: (id) => api.delete(`/api/opens/${id}`),
};

/**
 * Service for Static Content (About page) management
 */
export const contentService = {
  getAll: () => api.get('/api/content'),
  getById: (id) => api.get(`/api/content/${id}`),
  create: (data) => api.post('/api/content', data),
  update: (id, data) => api.put(`/api/content/${id}`, data),
  delete: (id) => api.delete(`/api/content/${id}`),
};

/**
 * Service for Authentication
 */
export const authService = {
  login: (credentials) => api.post('/login', credentials),
  signup: (userData) => api.post('/signup', userData),
  logout: () => api.post('/logout'),
  checkStatus: () => api.get('/api/auth/status'),
};

export default {
  players: playerService,
  matches: matchService,
  opens: openService,
  content: contentService,
  auth: authService,
};
