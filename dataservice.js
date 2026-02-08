import api from "./api";

export const playerService = {
  getAll: () => api.get("/api/players"),
  getRanking: () => api.get("/api/ranking"),
  getKtpFinalRank: () => api.get("/api/ktp-final-rank"), // New view endpoint
  create: (data) => api.post("/api/players", data),
  update: (id, data) => api.put(`/api/players/${id}`, data),
  delete: (id) => api.delete(`/api/players/${id}`),
};

export const matchService = {
  // Now correctly handles both page and optional playerId
  getResults: (page = 1, playerId = "") => {
    const url = `/api/results?page=${page}${playerId ? `&playerId=${playerId}` : ""}`;
    return api.get(url);
  },

  getById: (id) => api.get(`/api/matches/${id}`),
  create: (data) => api.post("/api/matches", data),
  update: (id, data) => api.put(`/api/matches/${id}`, data),
  delete: (id) => api.delete(`/api/matches/${id}`),
};

export const openService = {
  getAll: () => api.get("/api/opens"),
  getMatches: (openId) => api.get(`/api/opens/${openId}/matches`),
  create: (data) => api.post("/api/opens", data),
  delete: (id) => api.delete(`/api/opens/${id}`),
};

export const contentService = {
  getAll: () => api.get("/api/content"),
  update: (id, data) => api.put(`/api/content/${id}`, data),
};
