import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../shared/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { useToast } from '../../shared/ToastContext'

type Order = {
  _id: string
  customerId: {
    _id: string
    name: string
    email: string
  }
  products: Array<{
    productId: {
      _id: string
      title: string
      price: number
    }
    quantity: number
    startDate: string
    endDate: string
    totalPrice: number
  }>
  status: string
  totalPrice: number
  paymentStatus: string
  createdAt: string
  updatedAt: string
  startDate: string
  endDate: string
  duration: number
}

type OrderStats = {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  todayRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const { notify } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        
        // Fetch all orders for admin
        const ordersRes = await api.get('/admin/orders')
        if (import.meta.env.MODE === 'development') {
          console.debug('Orders response:', ordersRes.data)
        }
        setOrders(ordersRes.data?.data || ordersRes.data || [])
        
        // Fetch order stats
        const statsRes = await api.get('/admin/orders/stats')
        if (import.meta.env.MODE === 'development') {
          console.debug('Order stats response:', statsRes.data)
        }
        setStats(statsRes.data?.data || statsRes.data || {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          weeklyRevenue: 0,
          monthlyRevenue: 0
        })
        
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_confirmation': { className: 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs', text: 'Chờ xác nhận' },
      'pending_payment': { className: 'px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs', text: 'Chờ thanh toán' },
      'confirmed': { className: 'px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs', text: 'Đã xác nhận' },
      'in_progress': { className: 'px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs', text: 'Đang thực hiện' },
      'completed': { className: 'px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs', text: 'Hoàn thành' },
      'cancelled': { className: 'px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs', text: 'Đã hủy' },
      'refunded': { className: 'px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs', text: 'Đã hoàn tiền' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { className: 'px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs', text: status }
    
    return (
      <span className={config.className}>
        {config.text}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const paymentConfig = {
      'pending': { className: 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs', text: 'Chờ thanh toán' },
      'paid': { className: 'px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs', text: 'Đã thanh toán' },
      'failed': { className: 'px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs', text: 'Thanh toán thất bại' },
      'refunded': { className: 'px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs', text: 'Đã hoàn tiền' }
    }
    
    const config = paymentConfig[paymentStatus as keyof typeof paymentConfig] || { className: 'px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs', text: paymentStatus }
    
    return (
      <span className={config.className}>
        {config.text}
      </span>
    )
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: newStatus })
      
      if (response.data?.success) {
        // Update local state
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        ))
        
        notify(`Đã cập nhật trạng thái đơn hàng thành: ${newStatus}`, 'success')
      } else {
        throw new Error(response.data?.message || 'Cập nhật thất bại')
      }
    } catch (error: unknown) {
      console.error('Error updating order status:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || 'Lỗi không xác định'
      notify(`Có lỗi xảy ra khi cập nhật trạng thái: ${errorMessage}`, 'error')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPayment = filterPayment === 'all' || order.paymentStatus === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
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
            <p className="text-xl font-semibold text-gray-700">Đang tải danh sách đơn hàng...</p>
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
                📋 Quản lý đơn hàng
              </h1>
              <p className="text-lg text-gray-600">
                Theo dõi và xử lý tất cả đơn hàng trong hệ thống
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xử lý</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Hôm nay: {formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <Input
                type="text"
                placeholder="Mã đơn hàng, tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending_confirmation">Chờ xác nhận</SelectItem>
                  <SelectItem value="pending_payment">Chờ thanh toán</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thanh toán</label>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="failed">Thanh toán thất bại</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách đơn hàng ({filteredOrders.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
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
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerId.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products.length} sản phẩm
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.products.slice(0, 2).map(p => p.productId.title).join(', ')}
                        {order.products.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Xác nhận
                        </Button>
                        <Button 
                          onClick={() => handleStatusUpdate(order._id, 'completed')}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Hoàn thành
                        </Button>
                        <Button 
                          onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Hủy
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📋</span>
              <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}