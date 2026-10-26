import api from './axiosInstance'

const BASE = '/api/ai'

export const generateBodyApi      = (description) =>
  api.post(`${BASE}/ask`, { description })

export const suggestHeadersApi    = (url, method, requestBody, existingHeaders) =>
  api.post(`${BASE}/suggest-headers`, { url, method, requestBody, existingHeaders })

export const explainResponseApi   = (statusCode, responseBody, responseHeaders) =>
  api.post(`${BASE}/explain-response`, { statusCode, responseBody, responseHeaders })

export const generateDocsApi      = (url, method, requestHeaders, requestBody, responseStatusCode, responseBody) =>
  api.post(`${BASE}/generate-docs`, { url, method, requestHeaders, requestBody, responseStatusCode, responseBody })

export const generateTestsApi     = (url, method, requestBody, expectedStatusCode, sampleResponseBody) =>
  api.post(`${BASE}/generate-tests`, { url, method, requestBody, expectedStatusCode, sampleResponseBody })

export const runTestsApi           = (requestId, assertions, environmentId) => {
  const query = environmentId ? `?environmentId=${encodeURIComponent(environmentId)}` : ''
  return api.post(`${BASE}/run-tests/${requestId}${query}`, { assertions })
}

export const generateAndRunTestsApi = (requestId, data, environmentId) => {
  const query = environmentId ? `?environmentId=${encodeURIComponent(environmentId)}` : ''
  return api.post(`${BASE}/generate-and-run-tests/${requestId}${query}`, data)
}

