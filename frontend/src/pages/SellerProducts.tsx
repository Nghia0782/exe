import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'

type Product = {
  _id: string
  title: string
  price: number
  images?: string[]
  status: 'active' | 'inactive' | 'pending'
  createdAt?: string
  views?: number
  orders?: number
}

export default function SellerProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const res = await api.get('/product/my-products', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        setProducts(res.data?.metadata || res.data?.products || [])
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(p => 
    filter === 'all' || p.status === filter
  )

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-amber-100 text-amber-800',
  }

  const statusText: Record<string, string> = {
    active: 'Đang hoạt động',
    inactive: 'Tạm dừng',
    pending: 'Chờ duyệt',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600">
                    Quản lý sản phẩm
                  </span>
                </h1>
                <p className="text-gray-600 text-lg">Quản lý tất cả sản phẩm bạn đang cho thuê</p>
              </div>
              <Link 
                to="/products/new" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl"
              >
                ➕ Thêm sản phẩm mới
              </Link>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Tổng sản phẩm</p>
                    <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{products.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Đang hoạt động</p>
                    <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      {products.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Chờ duyệt</p>
                    <p className="text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                      {products.filter(p => p.status === 'pending').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Tổng lượt xem</p>
                    <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      {products.reduce((sum, p) => sum + (p.views || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">👁️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
              {[
                { key: 'all', label: 'Tất cả', count: products.length },
                { key: 'active', label: 'Đang hoạt động', count: products.filter(p => p.status === 'active').length },
                { key: 'pending', label: 'Chờ duyệt', count: products.filter(p => p.status === 'pending').length },
                { key: 'inactive', label: 'Tạm dừng', count: products.filter(p => p.status === 'inactive').length },
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                    filter === filterOption.key
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có sản phẩm nào</h3>
              <p className="text-gray-600 mb-6">Hãy thêm sản phẩm đầu tiên để bắt đầu cho thuê</p>
              <Link 
                to="/products/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl"
              >
                ➕ Thêm sản phẩm mới
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product._id} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} className="w-full h-full object-cover" alt={product.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[product.status]}`}>
                        {statusText[product.status]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent mb-4">
                      {product.price.toLocaleString()} ₫/ngày
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👁️</span>
                        <span>{product.views || 0} lượt xem</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📋</span>
                        <span>{product.orders || 0} đơn hàng</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        to={`/products/${product._id}/edit`}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-medium text-center transition-all duration-300 hover:scale-105 transform"
                      >
                        ✏️ Chỉnh sửa
                      </Link>
                      <button className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                        📊 Thống kê
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
