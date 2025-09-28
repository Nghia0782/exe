import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ users: number; products: number; orders: number; kycPending: number }>({ users: 0, products: 0, orders: 0, kycPending: 0 })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        
        const [u, p, o, k] = await Promise.all([
          api.get('/users/count', { headers }).catch(() => ({ data: { count: 0 } })),
          api.get('/product/count', { headers }).catch(() => ({ data: { count: 0 } })),
          api.get('/orders/count', { headers }).catch(() => ({ data: { count: 0 } })),
          api.get('/kyc/admin/list', { headers }).catch(() => ({ data: { items: [] } }))
        ])
        setStats({ 
          users: u.data?.count || 0, 
          products: p.data?.count || 0, 
          orders: o.data?.count || 0, 
          kycPending: (k.data?.items || []).filter((i: { status: string })=>i.status==='pending').length 
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  const cards = [
    { title: 'Người dùng', value: stats.users, to: '/admin/users', color: 'from-blue-500 to-cyan-500' },
    { title: 'Sản phẩm', value: stats.products, to: '/admin/products', color: 'from-purple-500 to-pink-500' },
    { title: 'Đơn hàng', value: stats.orders, to: '/admin/orders', color: 'from-emerald-500 to-teal-500' },
    { title: 'KYC chờ duyệt', value: stats.kycPending, to: '/admin/kyc', color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white">Admin Dashboard</h1>
          <p className="text-white/70">Quản trị người dùng, sản phẩm, đơn hàng và KYC</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="rounded-3xl p-6 bg-white/10 border border-white/10 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-8 bg-white/20 rounded mb-4"></div>
                <div className="h-4 bg-white/20 rounded"></div>
              </div>
            ))
          ) : (
            cards.map((c, i)=> (
              <Link key={i} to={c.to} className={`group rounded-3xl p-6 bg-gradient-to-br ${c.color} text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all`}> 
                <div className="text-sm opacity-90">{c.title}</div>
                <div className="text-4xl font-extrabold mt-2">{c.value}</div>
                <div className="mt-6 text-white/90 group-hover:underline">Xem chi tiết →</div>
              </Link>
            ))
          )}
        </div>
        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white/10 border border-white/10 p-6 text-white">
            <div className="font-bold mb-3">Hoạt động gần đây</div>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Admin đăng nhập</li>
              <li>• 2 đơn hàng mới</li>
              <li>• 1 hồ sơ KYC gửi lên</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white/10 border border-white/10 p-6 text-white">
            <div className="font-bold mb-3">Ghi chú</div>
            <p className="text-white/80 text-sm">Bạn có thể vào mục KYC để phê duyệt hồ sơ người dùng.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}


