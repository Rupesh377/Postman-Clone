import api from './axiosInstance'

const BASE = '/api/history'

export const getHistoryApi   = (page = 0, size = 20) =>
  api.get(`${BASE}?page=${page}&size=${size}&sort=executedAt,desc`)

export const deleteHistoryItemApi = (id) => api.delete(`${BASE}/${id}`)

export const clearHistoryApi = () => api.delete(BASE)
