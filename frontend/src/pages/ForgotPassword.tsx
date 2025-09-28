import { useState } from 'react'
import { api } from '../shared/api'

export default function ForgotPassword() {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await api.post('/auth/forgotPassword', { email })
      setMsg('Đã gửi mã về email. Vui lòng kiểm tra hộp thư.')
      setStep('verify')
    } catch (err: unknown) {
      setMsg((err as any)?.response?.data?.message || 'Không thể gửi mã')
    } finally {
      setLoading(false)
    }
  }

  const resetWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await api.post('/auth/resetPasswordWithCode', { email, code, newPassword })
      setMsg('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.')
    } catch (err: unknown) {
      setMsg((err as any)?.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Quên mật khẩu</h1>
        <p className="text-gray-600 mb-6">Nhập email để nhận mã xác thực và đặt lại mật khẩu.</p>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition disabled:opacity-50">{loading ? 'Đang gửi...' : 'Gửi mã'}</button>
          </form>
        ) : (
          <form onSubmit={resetWithCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác thực</label>
              <input value={code} onChange={e=>setCode(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập mã 6 số" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition disabled:opacity-50">{loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}</button>
          </form>
        )}

        {msg && <div className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-3">{msg}</div>}

        <div className="mt-6 text-sm text-gray-600">Trở về <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Đăng nhập</a></div>
      </div>
    </div>
  )
}
