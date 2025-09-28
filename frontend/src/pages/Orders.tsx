import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DepositCard from '../components/DepositCard'
import DepositModal from '../components/DepositModal'

type Order = {
  _id: string
  code?: string
  status: string
  totalPrice?: number
  depositAmount?: number
  depositStatus?: string
  depositRequired?: boolean
  createdAt?: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await api.get('/orders', { headers: { Authorization: `Bearer ${token}` } })
      setOrders(res.data?.metadata || res.data?.orders || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDepositClick = (orderId: string) => {
    const order = orders.find(o => o._id === orderId)
    if (order) {
      setSelectedOrder(order)
      setIsDepositModalOpen(true)
    }
  }

  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false)
    setSelectedOrder(null)
    // Refresh orders after deposit
    fetchOrders()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Đơn hàng của tôi</h1>
              <p className="text-gray-600">Quản lý tất cả đơn hàng đã tạo</p>
            </div>
            <div className="flex gap-3">
              <Link to="/products" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl">
                🛍️ Mua thêm
              </Link>
              <Link to="/dashboard" className="px-5 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-2xl font-semibold transition-all duration-300 hover:bg-blue-50">
                📊 Dashboard
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 animate-spin" />
              <div className="text-gray-600">Đang tải...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <DepositCard
                  key={order._id}
                  order={order}
                  onDepositClick={handleDepositClick}
                />
              ))}
              {orders.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đơn hàng</h3>
                  <p className="text-gray-600 font-medium">Hãy đặt hàng để xem danh sách đơn hàng của bạn</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={handleCloseDepositModal}
        order={selectedOrder}
      />
      
      <Footer />
    </div>
  )
}


