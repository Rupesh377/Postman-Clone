import axios from 'axios'

const BASE_URL = '/api/v1/auth'

export const loginApi = (email, password) =>
  axios.post(`${BASE_URL}/login`, { email, password })

export const registerApi = (name, email, password) =>
  axios.post(`${BASE_URL}/register`, { name, email, password })

export const forgotPasswordApi = (email) =>
  axios.post(`${BASE_URL}/forgot-password`, { email })

export const resetPasswordApi = (token, newPassword) =>
  axios.post(`${BASE_URL}/reset-password`, { token, newPassword })

export const logoutApi = (accessToken) =>
  axios.post(`${BASE_URL}/logout`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

export const getGoogleOAuthUrl = () =>
  `${BACKEND_URL}/oauth2/authorization/google`

export const getGithubOAuthUrl = () =>
  `${BACKEND_URL}/oauth2/authorization/github`
