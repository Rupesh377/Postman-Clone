import { createContext, useContext, useState, useCallback } from 'react'
import {
  getCollectionsApi,
  getFoldersApi,
  createCollectionApi,
  deleteCollectionApi,
  createFolderApi,
  deleteFolderApi,
} from '../api/collectionApi'
import {
  getRequestsByCollectionApi,
  getRequestsByFolderApi,
} from '../api/requestApi'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ workspaceId, children }) {
  const [collections, setCollections] = useState([])
  // folders: { [collectionId]: FolderResponseDTO[] }
  const [folders, setFolders] = useState({})
  // requests: { col_<collectionId>: [], fold_<folderId>: [] }
  const [requests, setRequests] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCollections = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCollectionsApi(workspaceId)
      setCollections(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const loadFolders = useCallback(async (collectionId) => {
    try {
      const res = await getFoldersApi(collectionId)
      setFolders((prev) => ({ ...prev, [collectionId]: res.data }))
    } catch {
      setFolders((prev) => ({ ...prev, [collectionId]: [] }))
    }
  }, [])

  const loadRequestsForCollection = useCallback(async (collectionId) => {
    try {
      const res = await getRequestsByCollectionApi(collectionId)
      setRequests((prev) => ({ ...prev, [`col_${collectionId}`]: res.data }))
    } catch {
      setRequests((prev) => ({ ...prev, [`col_${collectionId}`]: [] }))
    }
  }, [])

  const loadRequestsForFolder = useCallback(async (folderId) => {
    try {
      const res = await getRequestsByFolderApi(folderId)
      setRequests((prev) => ({ ...prev, [`fold_${folderId}`]: res.data }))
    } catch {
      setRequests((prev) => ({ ...prev, [`fold_${folderId}`]: [] }))
    }
  }, [])

  const addCollection = useCallback(async (data) => {
    const res = await createCollectionApi(workspaceId, data)
    setCollections((prev) => [...prev, res.data])
    return res.data
  }, [workspaceId])

  const removeCollection = useCallback(async (collectionId) => {
    await deleteCollectionApi(collectionId)
    setCollections((prev) => prev.filter((c) => c.id !== collectionId))
  }, [])

  const addFolder = useCallback(async (collectionId, data) => {
    const res = await createFolderApi(collectionId, data)
    setFolders((prev) => ({
      ...prev,
      [collectionId]: [...(prev[collectionId] || []), res.data],
    }))
    return res.data
  }, [])

  const removeFolder = useCallback(async (collectionId, folderId) => {
    await deleteFolderApi(folderId)
    setFolders((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).filter((f) => f.id !== folderId),
    }))
  }, [])

  const addRequestToStore = useCallback((collectionId, request) => {
    const key = `col_${collectionId}`
    setRequests((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), request],
    }))
  }, [])

  const updateRequestInStore = useCallback((collectionId, folderId, updated) => {
    const key = folderId ? `fold_${folderId}` : `col_${collectionId}`
    setRequests((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((r) => (r.id === updated.id ? updated : r)),
    }))
  }, [])

  const removeRequestFromStore = useCallback((collectionId, folderId, requestId) => {
    const key = folderId ? `fold_${folderId}` : `col_${collectionId}`
    setRequests((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((r) => r.id !== requestId),
    }))
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        collections,
        folders,
        requests,
        loading,
        error,
        loadCollections,
        loadFolders,
        loadRequestsForCollection,
        loadRequestsForFolder,
        addCollection,
        removeCollection,
        addFolder,
        removeFolder,
        addRequestToStore,
        updateRequestInStore,
        removeRequestFromStore,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
