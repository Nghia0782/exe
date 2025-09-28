import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'

type KycItem = {
  _id: string
  userId: string
  fullName: string
  idNumber: string
  idType: string
  frontImageUrl?: string
  backImageUrl?: string
  selfieImageUrl?: string
  status: 'pending'|'approved'|'rejected'
  reason?: string
  createdAt?: string
}

export default function AdminKyc() {
  const [items, setItems] = useState<KycItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchList = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const res = await api.get('/kyc/admin/list', { headers: { Authorization: `Bearer ${token}` } })
      setItems(res.data?.items || [])
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const updateStatus = async (id: string, status: 'approved'|'rejected') => {
    const reason = status === 'rejected' ? prompt('Nhập lý do từ chối:') || '' : ''
    if (status === 'rejected' && !reason) {
      alert('Vui lòng nhập lý do từ chối')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await api.post('/kyc/admin/update', { id, status, reason }, { headers: { Authorization: `Bearer ${token}` } })
      alert(status === 'approved' ? 'Đã duyệt hồ sơ thành công!' : 'Đã từ chối hồ sơ!')
      await fetchList()
    } catch {
      alert('Cập nhật thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">Duyệt hồ sơ KYC</h1>
            <p className="text-gray-600 mt-2">Xem và duyệt các yêu cầu xác minh CCCD/CMND của người dùng</p>
          </div>
          <button onClick={fetchList} className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 hover:bg-blue-50 flex items-center gap-2">
            <span>🔄</span>
            Làm mới
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                <div className="text-sm text-gray-600">Tổng hồ sơ</div>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{items.filter(i => i.status === 'pending').length}</div>
                <div className="text-sm text-gray-600">Chờ duyệt</div>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{items.filter(i => i.status === 'approved').length}</div>
                <div className="text-sm text-gray-600">Đã duyệt</div>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">❌</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{items.filter(i => i.status === 'rejected').length}</div>
                <div className="text-sm text-gray-600">Đã từ chối</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(loading ? Array.from({length:6}).map((_,i)=>({ _id: String(i), fullName:'', idNumber:'', idType:'', status:'pending' as const, frontImageUrl: '', backImageUrl: '', selfieImageUrl: '', reason: '' })) : items).map(item => (
            <div key={item._id} className="bg-white/90 border border-white/60 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-900">{item.fullName || '—'}</div>
                  <div className="text-xs text-gray-500">{item.idType?.toUpperCase()} • {item.idNumber || '—'}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status==='approved'?'bg-green-100 text-green-700':item.status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{item.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { url: item.frontImageUrl, label: 'Mặt trước' },
                  { url: item.backImageUrl, label: 'Mặt sau' },
                  { url: item.selfieImageUrl, label: 'Ảnh selfie' }
                ].map((img, idx) => (
                  <div key={idx} className="text-center">
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-1">
                      {img.url ? (
                        <img 
                          src={img.url} 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(img.url, '_blank')}
                          title="Click để xem ảnh lớn"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{img.label}</div>
                  </div>
                ))}
              </div>
              {item.reason && <div className="text-xs text-gray-600 mb-3">Lý do: {item.reason}</div>}
              <div className="flex items-center gap-3">
                <button 
                  onClick={()=>updateStatus(item._id,'approved')} 
                  className="flex-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2"
                  disabled={item.status !== 'pending'}
                >
                  <span>✅</span>
                  Duyệt
                </button>
                <button 
                  onClick={()=>updateStatus(item._id,'rejected')} 
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
                  disabled={item.status !== 'pending'}
                >
                  <span>❌</span>
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}


