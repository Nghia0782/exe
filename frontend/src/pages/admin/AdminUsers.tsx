import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../shared/api'

type User = {
  _id: string
  name: string
  email: string
  phone?: string
  roles: string[]
  isActive: boolean
  identityVerification?: {
    status: string
    verifiedAt?: string
  }
  createdAt: string
  updatedAt: string
  walletBalance?: number
  avatar?: string
}

type UserStats = {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  adminUsers: number
  newUsersToday: number
  newUsersThisWeek: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        
        // Fetch users
        const usersRes = await api.get('/admin/users')
        if (import.meta.env.MODE === 'development') {
          console.debug('Users response:', usersRes.data)
        }
        setUsers(usersRes.data?.data || usersRes.data || [])
        
        // Fetch user stats
        const statsRes = await api.get('/admin/users/stats')
        if (import.meta.env.MODE === 'development') {
          console.debug('User stats response:', statsRes.data)
        }
        setStats(statsRes.data?.data || statsRes.data || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
          adminUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0
        })
        
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Không hoạt động</span>
    }
    
    if (user.identityVerification?.status === 'verified') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Đã xác minh</span>
    }
    
    if (user.identityVerification?.status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Chờ xác minh</span>
    }
    
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Chưa xác minh</span>
  }

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Admin</span>
    }
    if (roles.includes('owner')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Chủ sở hữu</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Người thuê</span>
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole)
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive) ||
                         (filterStatus === 'verified' && user.identityVerification?.status === 'verified') ||
                         (filterStatus === 'pending' && user.identityVerification?.status === 'pending')
    
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="text-2xl text-white">⏳</span>
            </div>
            <p className="text-xl font-semibold text-gray-700">Đang tải danh sách người dùng...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                👥 Quản lý người dùng
              </h1>
              <p className="text-lg text-gray-600">
                Quản lý tài khoản, vai trò và trạng thái người dùng
              </p>
            </div>
            <Link 
              to="/admin" 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng người dùng</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg border border-green-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Hoạt động</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg border border-purple-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Đã xác minh</p>
              <p className="text-2xl font-bold text-purple-600">{stats.verifiedUsers}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Admin</p>
              <p className="text-2xl font-bold text-orange-600">{stats.adminUsers}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg border border-indigo-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Hôm nay</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.newUsersToday}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg border border-pink-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tuần này</p>
              <p className="text-2xl font-bold text-pink-600">{stats.newUsersThisWeek}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="owner">Chủ sở hữu</option>
                <option value="renter">Người thuê</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="verified">Đã xác minh</option>
                <option value="pending">Chờ xác minh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách người dùng ({filteredUsers.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ví tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Chưa có tên'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-gray-400">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.roles)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(user.walletBalance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Xem
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Sửa
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Khóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-gray-500">Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}