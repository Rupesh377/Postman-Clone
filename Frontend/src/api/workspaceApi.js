import api from './axiosInstance'

const BASE = '/api/workspaces'

export const getMyWorkspacesApi = () =>
  api.get(BASE)

export const createWorkspaceApi = (data) =>
  api.post(BASE, data)

export const getWorkspaceApi = (id) =>
  api.get(`${BASE}/${id}`)

export const updateWorkspaceApi = (id, data) =>
  api.put(`${BASE}/${id}`, data)

export const deleteWorkspaceApi = (id) =>
  api.delete(`${BASE}/${id}`)

// Members
export const getMembersApi = (workspaceId) =>
  api.get(`${BASE}/${workspaceId}/members`)

export const inviteMemberApi = (workspaceId, data) =>
  api.post(`${BASE}/${workspaceId}/members`, data)

export const updateMemberRoleApi = (workspaceId, memberId, role) =>
  api.put(`${BASE}/${workspaceId}/members/${memberId}?role=${role}`)

export const removeMemberApi = (workspaceId, memberId) =>
  api.delete(`${BASE}/${workspaceId}/members/${memberId}`)
