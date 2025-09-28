import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../shared/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { useToast } from '../../shared/ToastContext'

type Deposit = {
  _id: string
  orderId: {
    _id: string
    totalPrice: number
  }
  customerId: {
    _id: string
    name: string
    email: string
  }
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  paidAt?: string
  refundedAt?: string
  expiresAt: string
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const { notify } = useToast()

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        setLoading(true)
        const response = await api.get('/deposits/admin/stats')
        // TODO: Implement get all deposits endpoint
        setDeposits([])
      } catch (error) {
        console.error('Error fetching deposits:', error)
        setDeposits([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchDeposits()
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { className: 'bg-yellow-100 text-yellow-800', text: 'Chờ thanh toán' },
      'paid': { className: 'bg-green-100 text-green-800', text: 'Đã thanh toán' },
      'refunded': { className: 'bg-blue-100 text-blue-800', text: 'Đã hoàn tiền' },
      'forfeited': { className: 'bg-red-100 text-red-800', text: 'Tịch thu cọc' },
      'cancelled': { className: 'bg-gray-100 text-gray-800', text: 'Đã hủy' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending']
    return <Badge className={config.className}>{config.text}</Badge>
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      'vnpay': { className: 'bg-blue-100 text-blue-800', text: 'VNPay' },
      'momo': { className: 'bg-pink-100 text-pink-800', text: 'MoMo' },
      'bank_transfer': { className: 'bg-green-100 text-green-800', text: 'Chuyển khoản' },
      'cash': { className: 'bg-gray-100 text-gray-800', text: 'Tiền mặt' }
    }
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig['vnpay']
    return <Badge className={config.className}>{config.text}</Badge>
  }

  const handleRefund = async (depositId: string) => {
    try {
      const reason = prompt('Lý do hoàn tiền:')
      if (!reason) return

      const response = await api.post(`/deposits/${depositId}/refund`, { reason })
      
      if (response.data.success) {
        notify('Hoàn tiền cọc thành công!', 'success')
        // Refresh deposits
        window.location.reload()
      } else {
        throw new Error(response.data.message || 'Hoàn tiền thất bại')
      }
    } catch (error: any) {
      console.error('Error refunding deposit:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra'
      notify(`Lỗi: ${errorMessage}`, 'error')
    }
  }

  const handleForfeit = async (depositId: string) => {
    try {
      const reason = prompt('Lý do tịch thu cọc:')
      if (!reason) return

      const response = await api.post(`/deposits/${depositId}/forfeit`, { reason })
      
      if (response.data.success) {
        notify('Tịch thu cọc thành công!', 'success')
        // Refresh deposits
        window.location.reload()
      } else {
        throw new Error(response.data.message || 'Tịch thu thất bại')
      }
    } catch (error: any) {
      console.error('Error forfeiting deposit:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra'
      notify(`Lỗi: ${errorMessage}`, 'error')
    }
  }

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.customerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.customerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit._id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || deposit.status === filterStatus
    const matchesPayment = filterPayment === 'all' || deposit.paymentMethod === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-4 animate-spin">
              <span className="text-2xl text-white">⏳</span>
            </div>
            <p className="text-xl font-semibold text-gray-700">Đang tải danh sách đặt cọc...</p>
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
                💰 Quản lý đặt cọc
              </h1>
              <p className="text-lg text-gray-600">
                Theo dõi và xử lý tất cả giao dịch đặt cọc trong hệ thống
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
                <p className="text-sm text-gray-600">Tổng đặt cọc</p>
                <p className="text-3xl font-bold text-blue-600">{deposits.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã thanh toán</p>
                <p className="text-3xl font-bold text-green-600">
                  {deposits.filter(d => d.status === 'paid').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ thanh toán</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {deposits.filter(d => d.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng tiền cọc</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💎</span>
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
                placeholder="Mã đặt cọc, tên khách hàng..."
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
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  <SelectItem value="forfeited">Tịch thu cọc</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức</label>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương thức</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách đặt cọc ({filteredDeposits.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="py-4 px-6">MÃ ĐẶT CỌC</th>
                  <th className="py-4 px-6">KHÁCH HÀNG</th>
                  <th className="py-4 px-6">ĐƠN HÀNG</th>
                  <th className="py-4 px-6">SỐ TIỀN</th>
                  <th className="py-4 px-6">TRẠNG THÁI</th>
                  <th className="py-4 px-6">PHƯƠNG THỨC</th>
                  <th className="py-4 px-6">NGÀY TẠO</th>
                  <th className="py-4 px-6">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeposits.map(deposit => (
                  <tr key={deposit._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      #{deposit._id.slice(-8)}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{deposit.customerId.name}</div>
                        <div className="text-gray-500 text-xs">{deposit.customerId.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">#{deposit.orderId._id.slice(-8)}</div>
                        <div className="text-gray-500 text-xs">{formatCurrency(deposit.orderId.totalPrice)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {formatCurrency(deposit.amount)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(deposit.status)}
                    </td>
                    <td className="py-4 px-6">
                      {getPaymentMethodBadge(deposit.paymentMethod)}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {formatDate(deposit.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        {deposit.status === 'paid' && (
                          <>
                            <Button 
                              onClick={() => handleRefund(deposit._id)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Hoàn tiền
                            </Button>
                            <Button 
                              onClick={() => handleForfeit(deposit._id)}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Tịch thu
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDeposits.length === 0 && (
                  <tr>
                    <td className="py-12 text-center text-gray-600" colSpan={8}>
                      Không tìm thấy đặt cọc nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
