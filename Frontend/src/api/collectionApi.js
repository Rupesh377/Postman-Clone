import api from './axiosInstance'

// Collections
export const getCollectionsApi = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}/collections`)

export const createCollectionApi = (workspaceId, data) =>
  api.post(`/api/workspaces/${workspaceId}/collections`, data)

export const getCollectionApi = (collectionId) =>
  api.get(`/api/collections/${collectionId}`)

export const updateCollectionApi = (collectionId, data) =>
  api.put(`/api/collections/${collectionId}`, data)

export const deleteCollectionApi = (collectionId) =>
  api.delete(`/api/collections/${collectionId}`)

// Folders
export const getFoldersApi = (collectionId) =>
  api.get(`/api/collections/${collectionId}/folders`)

export const createFolderApi = (collectionId, data) =>
  api.post(`/api/collections/${collectionId}/folders`, data)

export const updateFolderApi = (folderId, data) =>
  api.put(`/api/folders/${folderId}`, data)

export const deleteFolderApi = (folderId) =>
  api.delete(`/api/folders/${folderId}`)
