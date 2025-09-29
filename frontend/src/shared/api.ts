import axios from 'axios'

// Prefer VITE_API_URL; fallback directly to localhost backend in dev
function resolveBaseURL(): string {
  const env = (import.meta as any)?.env
  const viteUrl = env?.VITE_API_URL as string | undefined
  if (viteUrl && typeof viteUrl === 'string') {
    return viteUrl.replace(/\/$/, '') + '/api'
  }
  return 'http://localhost:5000/api'
}

export const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
