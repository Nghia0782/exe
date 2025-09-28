import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userParam = params.get('user')

    try {
      if (token) localStorage.setItem('token', token)
      if (userParam) {
        const parsed = JSON.parse(decodeURIComponent(userParam))
        localStorage.setItem('user', JSON.stringify(parsed))
      }
    } catch {}

    const redirectTo = sessionStorage.getItem('post_login_redirect') || '/'
    sessionStorage.removeItem('post_login_redirect')
    navigate(redirectTo, { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-gray-700">Đang đăng nhập, vui lòng đợi...</div>
    </div>
  )
}


