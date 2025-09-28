import { Navigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '../shared/UserContext'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useUser()

  // Nếu không có token thì chuyển hướng ngay, tránh kẹt spinner
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) {
    return <Navigate to={fallbackPath} replace />
  }

  // Grace fallback: sau 2s nếu vẫn loading, dùng localStorage hoặc decode token tạm thời
  const [graceReady, setGraceReady] = useState(false)
  const onceRef = useRef(false)
  useEffect(() => {
    if (onceRef.current) return
    onceRef.current = true
    const t = window.setTimeout(() => setGraceReady(true), 2000)
    return () => window.clearTimeout(t)
  }, [])

  if (loading) {
    if (graceReady) {
      try {
        const stored = localStorage.getItem('user')
        let tempRoles: string[] = []
        if (stored) {
          tempRoles = JSON.parse(stored)?.roles || []
        } else if (token && token.split('.').length === 3) {
          const payload = JSON.parse(atob(token.split('.')[1] || ''))
          tempRoles = payload?.roles || []
        }
        const ok = requiredRoles.length === 0 || requiredRoles.some(r => tempRoles.includes(r))
        if (ok) return <>{children}</>
      } catch {}
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <span className="text-2xl text-white">⏳</span>
          </div>
          <p className="text-xl font-semibold text-gray-700">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.roles?.includes(role))
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600 mb-6">Bạn cần quyền admin để truy cập trang này.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-300"
            >
              Quay lại
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
