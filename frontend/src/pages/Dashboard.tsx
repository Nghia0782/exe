import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'

type Stats = {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

type RecentOrder = {
  _id: string
  code?: string
  status: string
  totalPrice?: number
  createdAt?: string
  customer?: {
    name: string
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch stats from backend
        try {
          const statsRes = await api.get('/admin/stats')
          if (import.meta.env.MODE === 'development') {
            console.debug('Admin stats response:', statsRes.data)
          }
          setStats(statsRes.data?.data || {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0
          })
        } catch (statsError) {
          console.error('Could not fetch stats:', statsError)
          setStats({
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0
          })
        }
        
        // Fetch recent orders from backend
        try {
          const ordersRes = await api.get('/orders')
          if (import.meta.env.MODE === 'development') {
            console.debug('Orders response:', ordersRes.data)
          }
          const ordersData = ordersRes.data?.data || ordersRes.data || []
          setRecentOrders(ordersData)
        } catch (ordersError) {
          console.error('Could not fetch orders:', ordersError)
          setRecentOrders([])
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setRecentOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600">
                  Dashboard
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Tổng quan hoạt động và quản lý tài khoản của bạn
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/products" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl">
                🛍️ Xem sản phẩm
              </Link>
              <Link to="/orders" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl">
                📦 Đơn hàng
              </Link>
              <Link to="/profile" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl">
                👤 Hồ sơ
              </Link>
              <Link to="/checkout" className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl">
                🛒 Thanh toán
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">📦 Tổng sản phẩm</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{stats.totalProducts}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">📋 Tổng đơn hàng</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">{stats.totalOrders}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">💰 Doanh thu</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{stats.totalRevenue.toLocaleString()} ₫</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">⏳ Đơn chờ xử lý</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{stats.pendingOrders}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm">📋</span>
                  Đơn hàng gần đây
                </h2>
                <Link to="/orders" className="text-blue-600 hover:text-blue-700 text-sm font-semibold bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all duration-300">
                  Xem tất cả →
                </Link>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <span className="text-white">⏳</span>
                  </div>
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div key={order._id} className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          #{order.code || order._id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>👤</span>
                          {order.customer?.name || 'Khách hàng'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {order.totalPrice ? order.totalPrice.toLocaleString() + ' ₫' : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-gray-600 text-lg">Chưa có đơn hàng nào</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">⚡</span>
                Thao tác nhanh
              </h2>
              
              <div className="space-y-6">
                <Link to="/products" className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 border border-blue-100 hover:shadow-lg group">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">➕</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Thêm sản phẩm mới</p>
                    <p className="text-sm text-gray-600">Đăng thiết bị cho thuê</p>
                  </div>
                </Link>

                <Link to="/orders" className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-100 hover:shadow-lg group">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Quản lý đơn hàng</p>
                    <p className="text-sm text-gray-600">Xem và xử lý đơn hàng</p>
                  </div>
                </Link>

                <Link to="/profile" className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100 hover:shadow-lg group">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Cài đặt tài khoản</p>
                    <p className="text-sm text-gray-600">Thông tin cá nhân và bảo mật</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
