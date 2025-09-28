import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

type UserInfo = {
  name: string | null
  email?: string | null
  roles?: string[]
}

type UserContextType = {
  user: UserInfo | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    
    // Basic token validation (JWT should have 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('Invalid token format, clearing token')
      localStorage.removeItem('token')
      setUser(null)
      setLoading(false)
      return
    }
    
    
    try {
      setLoading(true)
      const res = await api.get('/users/me')
      const data = res.data || {}
      
      // Priority order: fullname -> name -> email -> fallback
      let userName = 'Người dùng'
      if (data.fullname) {
        userName = data.fullname
      } else if (data.name) {
        userName = data.name
      } else if (data.email) {
        // Extract name from email if no name field
        const emailName = data.email.split('@')[0]
        userName = emailName.charAt(0).toUpperCase() + emailName.slice(1)
      }
      
      const userData = { name: userName, email: data.email || null, roles: data.roles || [] }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.warn('Could not fetch user data:', error)
      
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setLoading(false)
          return
        } catch {
          console.warn('Invalid stored user data, clearing')
          localStorage.removeItem('user')
        }
      }
      
      // If no stored user and API fails, try to decode token
      try {
        const tokenParts = token.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        
        let userName = 'Người dùng'
        if (payload.fullname) {
          userName = payload.fullname
        } else if (payload.name) {
          userName = payload.name
        } else if (payload.email) {
          const emailName = payload.email.split('@')[0]
          userName = emailName.charAt(0).toUpperCase() + emailName.slice(1)
        }
        
        const userData = { 
          name: userName, 
          email: payload.email || null, 
          roles: payload.roles || ['user'] 
        }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      } catch {
        console.warn('Could not decode token, clearing everything')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  useEffect(() => {
    refresh()
  }, [refresh])

  // Watchdog: tránh kẹt loading nếu request treo (dev network)
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 4000)
    return () => clearTimeout(t)
  }, [loading])

  const value = useMemo<UserContextType>(() => ({ user, loading, refresh, logout }), [user, loading, refresh])
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}


