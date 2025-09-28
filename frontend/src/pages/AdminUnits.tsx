import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'

interface Product {
  _id: string
  title: string
  stock: number
  soldCount: number
}

interface UnitProduct {
  _id: string
  productId: string
  unitId: string
  productStatus: 'available' | 'rented'
  renterId?: string
}

export default function AdminUnits() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [units, setUnits] = useState<UnitProduct[]>([])
  const [unitCount, setUnitCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/products')
      if (import.meta.env.MODE === 'development') {
        console.debug('Products API Response:', res.data)
      }
      setProducts(res.data?.metadata || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setMessage('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (productId: string) => {
    try {
      setLoading(true)
      const res = await api.post('/order-products/byProductIds', {
        id: [productId]
      })
      setUnits(res.data?.data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
      setMessage('Không thể tải danh sách units')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    fetchUnits(product._id)
    setMessage('')
  }

  const createUnits = async () => {
    if (!selectedProduct || unitCount <= 0) {
      setMessage('Vui lòng chọn sản phẩm và nhập số lượng units')
      return
    }

    try {
      setLoading(true)
      const res = await api.post('/order-products/create-for-product', {
        productId: selectedProduct._id,
        count: unitCount
      })
      
      setMessage(`✅ ${res.data.message}`)
      // Refresh units list
      fetchUnits(selectedProduct._id)
      setUnitCount(1)
    } catch (error: any) {
      console.error('Error creating units:', error)
      setMessage(`❌ ${error.response?.data?.message || 'Không thể tạo units'}`)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableUnits = () => {
    return units.filter(unit => unit.productStatus === 'available').length
  }

  const getRentedUnits = () => {
    return units.filter(unit => unit.productStatus === 'rented').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
              Quản lý Units
            </span>
          </h1>
          <p className="text-gray-600">Tạo và quản lý units cho các sản phẩm</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            message.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : 
            message.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Products List */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Danh sách sản phẩm</h2>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📦</div>
                <p>Không có sản phẩm nào</p>
                <p className="text-sm mt-2">Vui lòng tạo sản phẩm trước</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedProduct?._id === product._id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-sm'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800">{product.title}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Stock: {product.stock || 0}</span>
                      <span className="mx-2">•</span>
                      <span>Đã bán: {product.soldCount || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">ID: {product._id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unit Management */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-2xl">
            {selectedProduct ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  Quản lý Units: {selectedProduct.title}
                </h2>
                
                {/* Unit Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="text-2xl font-bold text-green-600">{getAvailableUnits()}</div>
                    <div className="text-sm text-green-700">Units có sẵn</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="text-2xl font-bold text-red-600">{getRentedUnits()}</div>
                    <div className="text-sm text-red-700">Units đã thuê</div>
                  </div>
                </div>

                {/* Create Units Form */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tạo thêm units
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={unitCount}
                      onChange={(e) => setUnitCount(parseInt(e.target.value) || 1)}
                      className="flex-1 border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Số lượng units"
                    />
                    <button
                      onClick={createUnits}
                      disabled={loading || unitCount <= 0}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Đang tạo...' : 'Tạo Units'}
                    </button>
                  </div>
                </div>

                {/* Units List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Danh sách Units</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {units.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Chưa có units nào cho sản phẩm này
                      </div>
                    ) : (
                      units.map((unit) => (
                        <div
                          key={unit._id}
                          className={`p-3 rounded-xl border ${
                            unit.productStatus === 'available'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-800">{unit.unitId}</div>
                              <div className="text-sm text-gray-600">
                                Status: {unit.productStatus === 'available' ? 'Có sẵn' : 'Đã thuê'}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              unit.productStatus === 'available'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {unit.productStatus === 'available' ? 'Available' : 'Rented'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📦</div>
                <p>Chọn một sản phẩm để quản lý units</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
