import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'

type OrderDetail = {
  _id: string
  code?: string
  status: string
  totalPrice?: number
  createdAt?: string
  items?: Array<{
    product: {
      _id: string
      title: string
      images?: string[]
      price: number
    }
    quantity: number
    rentalDays: number
  }>
  customer?: {
    name: string
    email: string
    phone?: string
  }
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusText: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const res = await api.get(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        setOrder(res.data?.metadata || res.data?.order || res.data)
      } catch (error) {
        console.error('Error fetching order:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-8">
            <div className="text-center py-12 text-gray-600">Đang tải...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
              <p className="text-gray-600 mb-4">Đơn hàng này không tồn tại hoặc bạn không có quyền xem.</p>
              <Link to="/orders" className="text-blue-600 hover:text-blue-700 font-semibold">← Quay lại danh sách đơn hàng</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusText[order.status] || order.status}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="ml-2 font-semibold">{order.code || order._id.slice(-8)}</span>
              </div>
              <div>
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="ml-2">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="ml-2 font-bold text-lg text-blue-600">{order.totalPrice ? order.totalPrice.toLocaleString() + ' ₫' : '-'}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {order.customer && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Họ tên:</span>
                  <span className="ml-2 font-semibold">{order.customer.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{order.customer.email}</span>
                </div>
                {order.customer.phone && (
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="ml-2">{order.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đã thuê</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-blue-100">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                      <div className="text-sm text-gray-600">
                        <span>Số lượng: {item.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>Thời gian thuê: {item.rentalDays} ngày</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {(item.product.price * item.quantity * item.rentalDays).toLocaleString()} ₫
                      </div>
                      <div className="text-sm text-gray-600">{item.product.price.toLocaleString()} ₫/ngày</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Link to="/orders" className="px-5 py-3 rounded-2xl border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition-all">
              ← Quay lại danh sách
            </Link>
            {order.status === 'pending' && (
              <button className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all">
                Hủy đơn hàng
              </button>
            )}
            {order.status === 'approved' && (
              <button className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 transition-all">
                Thanh toán ngay
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
