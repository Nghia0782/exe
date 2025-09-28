import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useUser } from '../shared/UserContext'

type Tab = 'info' | 'security'

export default function Profile() {
  const { refresh, user } = useUser()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [profile, setProfile] = useState<{ name: string; email: string; phone?: string; isVerified?: boolean }>({ name: '', email: '' })
  const [kyc, setKyc] = useState<{ status: 'pending'|'approved'|'rejected'|'none'; reason?: string }>({ status: 'none' })
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
        setProfile({
          name: res.data?.name || res.data?.user?.name || '',
          email: res.data?.email || res.data?.user?.email || '',
          phone: res.data?.phone || res.data?.user?.phone || '',
          isVerified: res.data?.isVerified ?? res.data?.user?.isVerified,
        })
      } catch {
        // bỏ qua nếu backend chưa có /user/me
      }
    }
    fetchMe()
    const fetchKyc = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await api.get('/kyc/status', { headers: { Authorization: `Bearer ${token}` } })
        const st = res.data?.status as 'pending'|'approved'|'rejected'|undefined
        setKyc({ status: st || 'none', reason: res.data?.reason })
      } catch {
        setKyc(s=>s)
      }
    }
    fetchKyc()
  }, [])

  const onSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await api.patch('/users/me', { name: profile.name, phone: profile.phone }, { headers: { Authorization: `Bearer ${token}` } })
      setMsg('Đã lưu thông tin')
      await refresh()
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể lưu thông tin')
    } finally {
      setLoading(false)
    }
  }

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await api.post('/auth/changePassword', { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } })
      setMsg('Đổi mật khẩu thành công')
      setOldPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600">
                Hồ sơ cá nhân
              </span> 
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quản lý thông tin tài khoản và cài đặt bảo mật của bạn
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl h-max">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm">👤</span>
                Tài khoản
              </h2>
              <nav className="space-y-2">
                <button className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 ${
                  tab==='info'
                    ?'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-lg border border-blue-200' 
                    :'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`} onClick={()=>setTab('info')}>
                  <span className="text-lg">👤</span>
                  Thông tin cá nhân
                </button>
                <button className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 ${
                  tab==='security'
                    ?'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-lg border border-blue-200' 
                    :'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`} onClick={()=>setTab('security')}>
                  <span className="text-lg">🔒</span>
                  Bảo mật
                </button>
              </nav>
              
              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs">⚡</span>
                  Thao tác nhanh
                </h3>
                <div className="space-y-2">
                  <Link to="/orders" className="block w-full text-left px-4 py-3 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-blue-200">
                    <span className="text-lg mr-3">📦</span>
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/products" className="block w-full text-left px-4 py-3 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-blue-200">
                    <span className="text-lg mr-3">🛍️</span>
                    Xem sản phẩm
                  </Link>
                  {user?.roles?.includes('admin') ? (
                    <Link to="/dashboard" className="block w-full text-left px-4 py-3 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-blue-200">
                      <span className="text-lg mr-3">📊</span>
                      Dashboard
                    </Link>
                  ) : (
                    <Link to="/user-dashboard" className="block w-full text-left px-4 py-3 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-blue-200">
                      <span className="text-lg mr-3">🏠</span>
                      Trang cá nhân
                    </Link>
                  )}
                  <Link to="/checkout" className="block w-full text-left px-4 py-3 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-blue-200">
                    <span className="text-lg mr-3">🛒</span>
                    Giỏ hàng
                  </Link>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-2xl">
                {tab === 'info' ? (
                  <form onSubmit={onSaveInfo} className="space-y-8">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-lg">👤</span>
                      <h3 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h3>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">👤 Họ và tên</label>
                        <input 
                          value={profile.name} 
                          onChange={e=>setProfile(p=>({...p, name: e.target.value}))} 
                          className="w-full border border-blue-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                          placeholder="Nhập họ và tên của bạn"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">📧 Email</label>
                        <input 
                          value={profile.email} 
                          disabled 
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl px-4 py-4 text-gray-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">📱 Số điện thoại</label>
                        <input 
                          value={profile.phone||''} 
                          onChange={e=>setProfile(p=>({...p, phone: e.target.value}))} 
                          className="w-full border border-blue-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                        profile.isVerified
                          ?'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                          :'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                      }`}>
                        <span>{profile.isVerified ? '✅' : '⚠️'}</span>
                        {profile.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                      {!profile.isVerified && (
                        <button
                          type="button"
                          onClick={() => navigate('/verify')}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow hover:from-amber-600 hover:to-orange-600"
                        >
                          Xác minh ngay
                        </button>
                      )}
                    </div>

                    {/* KYC card */}
                    <div className="mt-6 p-5 rounded-2xl border "
                      style={{ borderColor: kyc.status==='approved' ? '#86efac' : kyc.status==='pending' ? '#fcd34d' : kyc.status==='rejected' ? '#fca5a5' : '#c7d2fe', background: 'rgba(255,255,255,0.8)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                            style={{ background: kyc.status==='approved' ? '#10b981' : kyc.status==='pending' ? '#f59e0b' : kyc.status==='rejected' ? '#ef4444' : '#6366f1' }}
                          >
                            🪪
                          </span>
                          <div>
                            <div className="font-semibold text-gray-900">Xác minh giấy tờ (eKYC)</div>
                            <div className="text-sm text-gray-600">
                              {kyc.status==='approved' && 'Đã được duyệt. Bạn có thể thuê sản phẩm.'}
                              {kyc.status==='pending' && 'Đang chờ duyệt. Thời gian xử lý 1-24 giờ.'}
                              {kyc.status==='rejected' && `Bị từ chối${kyc.reason ? `: ${kyc.reason}` : ''}. Vui lòng gửi lại.`}
                              {kyc.status==='none' && 'Bạn chưa gửi yêu cầu xác minh.'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {kyc.status!=='approved' && (
                            <button type="button" onClick={()=>navigate('/verify')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-700 hover:to-cyan-600">
                              {kyc.status==='pending' ? 'Xem trạng thái' : 'Xác minh ngay'}
                            </button>
                          )}
                          {kyc.status==='approved' && (
                            <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 font-semibold border border-green-200">Đã duyệt</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-300 disabled:opacity-50 hover:scale-105 transform shadow-lg hover:shadow-xl"
                    >
                      {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={onChangePassword} className="space-y-8">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-lg">🔒</span>
                      <h3 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">🔑 Mật khẩu hiện tại</label>
                        <input 
                          type="password" 
                          value={oldPassword} 
                          onChange={e=>setOldPassword(e.target.value)} 
                          className="w-full border border-blue-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">🔐 Mật khẩu mới</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={e=>setNewPassword(e.target.value)} 
                          className="w-full border border-blue-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                          placeholder="Nhập mật khẩu mới"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 hover:from-green-700 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-300 disabled:opacity-50 hover:scale-105 transform shadow-lg hover:shadow-xl"
                    >
                      {loading ? '⏳ Đang đổi...' : '🔒 Đổi mật khẩu'}
                    </button>
                  </form>
                )}
                
                {msg && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl">
                    <p className="text-blue-700 font-medium flex items-center gap-2">
                      <span>ℹ️</span>
                      {msg}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}


