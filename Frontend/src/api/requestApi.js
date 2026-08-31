import api from './axiosInstance'

const BASE = '/api/v1'

export const createRequestApi = (collectionId, data) =>
  api.post(`${BASE}/collections/${collectionId}/requests`, data)

export const getRequestsByCollectionApi = (collectionId) =>
  api.get(`${BASE}/collections/${collectionId}/requests`)

export const getRequestsByFolderApi = (folderId) =>
  api.get(`${BASE}/folders/${folderId}/requests`)

export const getRequestApi = (requestId) =>
  api.get(`${BASE}/requests/${requestId}`)

export const updateRequestApi = (requestId, data) =>
  api.put(`${BASE}/requests/${requestId}`, data)

export const deleteRequestApi = (requestId) =>
  api.delete(`${BASE}/requests/${requestId}`)
