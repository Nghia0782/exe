import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../shared/api'

type AdminStats = {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  pendingKyc: number
  activeUsers: number
  completedOrders: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number
}

type RecentActivity = {
  _id: string
  type: 'order' | 'user' | 'product' | 'kyc'
  action: string
  user?: string
  details: string
  timestamp: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    pendingKyc: 0,
    activeUsers: 0,
    completedOrders: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const fetchAdminData = async () => {
      try {
        setLoading(true)
        
        // Fetch comprehensive admin stats
        const statsRes = await api.get('/admin/comprehensive-stats')
        if (import.meta.env.MODE === 'development') {
          console.debug('Admin stats response:', statsRes.data)
        }
        setStats(statsRes.data?.data || statsRes.data || {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          pendingKyc: 0,
          activeUsers: 0,
          completedOrders: 0,
          monthlyRevenue: 0,
          weeklyRevenue: 0,
          dailyRevenue: 0
        })
        
        // Fetch recent activity
        const activityRes = await api.get('/admin/recent-activity')
        if (import.meta.env.MODE === 'development') {
          console.debug('Recent activity response:', activityRes.data)
        }
        setRecentActivity(activityRes.data?.data || activityRes.data || [])
        
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAdminData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="text-2xl text-white">⏳</span>
            </div>
            <p className="text-xl font-semibold text-gray-700">Đang tải dữ liệu admin...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            🏢 Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Tổng quan hệ thống và quản lý toàn diện
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Hoạt động: {stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <Link 
              to="/admin/users" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-3"
            >
              Xem chi tiết →
            </Link>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">Đang hoạt động</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
            <Link 
              to="/admin/products" 
              className="inline-flex items-center text-sm text-green-600 hover:text-green-800 mt-3"
            >
              Xem chi tiết →
            </Link>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Chờ xử lý: {stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <Link 
              to="/admin/orders" 
              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 mt-3"
            >
              Xem chi tiết →
            </Link>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Hôm nay: {formatCurrency(stats.dailyRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <Link 
              to="/admin/revenue" 
              className="inline-flex items-center text-sm text-orange-600 hover:text-orange-800 mt-3"
            >
              Xem chi tiết →
            </Link>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pending KYC */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">KYC chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingKyc}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🆔</span>
              </div>
            </div>
            <Link 
              to="/admin/kyc" 
              className="inline-flex items-center text-sm text-yellow-600 hover:text-yellow-800 mt-2"
            >
              Xem chi tiết →
            </Link>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hoàn thành</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu tuần</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.weeklyRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Management Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Product Management */}
          <Link 
            to="/admin/products" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quản lý sản phẩm</h3>
                <p className="text-sm text-gray-600">CRUD sản phẩm, danh mục, giá</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Tổng: {stats.totalProducts} sản phẩm
            </div>
          </Link>

          {/* User Management */}
          <Link 
            to="/admin/users" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quản lý người dùng</h3>
                <p className="text-sm text-gray-600">Quản lý tài khoản, vai trò</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Tổng: {stats.totalUsers} người dùng
            </div>
          </Link>

          {/* Order Management */}
          <Link 
            to="/admin/orders" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quản lý đơn hàng</h3>
                <p className="text-sm text-gray-600">Theo dõi, xử lý đơn hàng</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Chờ xử lý: {stats.pendingOrders} đơn
            </div>
          </Link>

          {/* Revenue Management */}
          <Link 
            to="/admin/revenue" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quản lý doanh thu</h3>
                <p className="text-sm text-gray-600">Báo cáo tài chính, thống kê</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Tổng: {formatCurrency(stats.totalRevenue)}
            </div>
          </Link>

          {/* KYC Management */}
          <Link 
            to="/admin/kyc" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🆔</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quản lý KYC</h3>
                <p className="text-sm text-gray-600">Duyệt xác minh danh tính</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Chờ duyệt: {stats.pendingKyc} hồ sơ
            </div>
          </Link>

          {/* Analytics */}
          <Link 
            to="/admin/analytics" 
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phân tích dữ liệu</h3>
                <p className="text-sm text-gray-600">Biểu đồ, thống kê chi tiết</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Báo cáo tổng hợp
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs">📈</span>
            Hoạt động gần đây
          </h3>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((activity) => (
                <div key={activity._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.type === 'order' ? 'bg-purple-100 text-purple-600' :
                    activity.type === 'user' ? 'bg-green-100 text-green-600' :
                    activity.type === 'product' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {activity.type === 'order' ? '📋' :
                     activity.type === 'user' ? '👤' :
                     activity.type === 'product' ? '📦' : '🆔'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📭</span>
              <p>Chưa có hoạt động nào gần đây</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
