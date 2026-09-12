import api from './axiosInstance'

const BASE = '/api/environments'

// ── Environments ──────────────────────────────────────────────────────────────

/** List all environments owned by the authenticated user */
export const getMyEnvironmentsApi = () => api.get(BASE)

/** Create a new environment  (body: { name }) */
export const createEnvironmentApi = (data) => api.post(BASE, data)

/** Get a single environment with its variables */
export const getEnvironmentApi = (environmentId) => api.get(`${BASE}/${environmentId}`)

/** Delete an environment */
export const deleteEnvironmentApi = (environmentId) => api.delete(`${BASE}/${environmentId}`)

// ── Variables ─────────────────────────────────────────────────────────────────

/** Add a variable to an environment  (body: { variableKey, variableValue }) */
export const addVariableApi = (environmentId, data) =>
  api.post(`${BASE}/${environmentId}/variables`, data)

/** Update a variable  (body: { variableKey, variableValue }) */
export const updateVariableApi = (environmentId, variableId, data) =>
  api.put(`${BASE}/${environmentId}/variables/${variableId}`, data)

/** Delete a variable */
export const deleteVariableApi = (environmentId, variableId) =>
  api.delete(`${BASE}/${environmentId}/variables/${variableId}`)

// ── Execution ─────────────────────────────────────────────────────────────────

/**
 * Run a saved request through the backend execution engine.
 * Resolves {{variable}} tokens from the chosen environment, avoids CORS, and persists the run.
 * Returns ApiExecutionResponseDTO: { statusCode, headers, body, responseTime }
 */
export const executeRequestApi = (requestId, environmentId) =>
  api.post(`/api/v1/api-requests/${requestId}/execute?environmentId=${environmentId}`)

/**
 * Fetch past execution history for a saved request.
 * Returns List<ApiExecutionResponseDTO>
 */
export const getExecutionHistoryApi = (requestId) =>
  api.get(`/api/v1/api-requests/${requestId}/history`)
