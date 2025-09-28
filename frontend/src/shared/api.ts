import axios from 'axios'

// Prefer VITE_API_URL; fallback to window location when available; final fallback to localhost
function resolveBaseURL(): string {
  const env = (import.meta as any)?.env
  const viteUrl = env?.VITE_API_URL as string | undefined
  if (viteUrl && typeof viteUrl === 'string') {
    return viteUrl.replace(/\/$/, '') + '/api'
  }
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (origin) return origin.replace(/\/$/, '') + '/api'
  } catch {}
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
