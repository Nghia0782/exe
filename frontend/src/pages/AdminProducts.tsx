import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'

interface Product {
  _id: string
  title: string
  description: string
  price: number
  category: string
  location: string
  stock: number
  soldCount: number
  images: string[]
  status: string
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  title: string
  description: string
  price: number
  category: string
  location: string
  stock: number
  images: string[]
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    category: '',
    location: '',
    stock: 0,
    images: []
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/product')
      if (import.meta.env.MODE === 'development') {
        console.debug('Products API Response:', res.data)
      }
      
      // Handle different response formats
      let productsData = []
      if (res.data?.metadata) {
        productsData = res.data.metadata
      } else if (res.data?.data) {
        productsData = res.data.data
      } else if (Array.isArray(res.data)) {
        productsData = res.data
      }
      
      setProducts(productsData)
      setMessage('')
    } catch (error: unknown) {
      console.error('Error fetching products:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Không thể tải danh sách sản phẩm'
      setMessage(`❌ ${errorMessage}`)
      
      // Set empty products array to prevent undefined errors
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setLoading(true)
      const uploaded: string[] = []
      for (const file of files) {
        const form = new FormData()
        form.append('my_file', file)
        const res = await api.post('/cloudinary', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        const url = res.data?.secure_url || res.data?.url
        if (url) uploaded.push(url)
      }
      if (uploaded.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploaded] }))
        setMessage(`✅ Đã tải lên ${uploaded.length} ảnh`)
      }
    } catch (err) {
      console.error('Upload images failed:', err)
      setMessage('❌ Tải ảnh lên thất bại. Hãy kiểm tra quyền đăng nhập/KYC.')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      category: '',
      location: '',
      stock: 0,
      images: []
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      location: product.location,
      stock: product.stock,
      images: product.images || []
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || formData.price <= 0) {
      setMessage('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setLoading(true)
      
      if (editingProduct) {
        // Update existing product
        const res = await api.put(`/product/${editingProduct._id}`, formData)
        if (import.meta.env.MODE === 'development') {
          console.debug('Update product response:', res.data)
        }
        setMessage('✅ Cập nhật sản phẩm thành công!')
      } else {
        // Create new product
        const res = await api.post('/product', formData)
        if (import.meta.env.MODE === 'development') {
          console.debug('Create product response:', res.data)
        }
        setMessage('✅ Tạo sản phẩm thành công!')
      }
      
      resetForm()
      fetchProducts()
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Không thể lưu sản phẩm'
      setMessage(`❌ ${errorMessage}`)
      
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string, productTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productTitle}"?`)) {
      return
    }

    try {
      setLoading(true)
      const res = await api.delete(`/product/${productId}`)
      if (import.meta.env.MODE === 'development') {
        console.debug('Delete product response:', res.data)
      }
      setMessage('✅ Xóa sản phẩm thành công!')
      fetchProducts()
    } catch (error: unknown) {
      console.error('Error deleting product:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Không thể xóa sản phẩm'
      setMessage(`❌ ${errorMessage}`)
      
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | string | object) => {
    const numPrice = typeof price === 'number' ? price : 
                    typeof price === 'string' ? parseFloat(price) : 
                    typeof price === 'object' && price !== null ? (price as { value?: number }).value || 0 : 0
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numPrice)
  }

  const formatDate = (dateString: string | object) => {
    if (typeof dateString === 'object' && dateString !== null) {
      const dateObj = dateString as { $date?: string; toString?: () => string }
      dateString = dateObj.$date || dateObj.toString?.() || ''
    }
    try {
      return new Date(dateString as string).toLocaleDateString('vi-VN')
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
              Quản lý Sản phẩm
            </span>
          </h1>
          <p className="text-gray-600">Tạo, chỉnh sửa và quản lý sản phẩm trong hệ thống</p>
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

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ➕ Thêm sản phẩm
            </button>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-2xl font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Tổng: {products.length} sản phẩm
          </div>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giá thuê (VND) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Nhập giá thuê"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    placeholder="Nhập mô tả sản phẩm"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Danh mục
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      <option value="">Chọn danh mục</option>
                      <option value="laptop">Laptop</option>
                      <option value="phone">Điện thoại</option>
                      <option value="camera">Máy ảnh</option>
                      <option value="audio">Âm thanh</option>
                      <option value="gaming">Gaming</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Nhập địa điểm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Nhập số lượng"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/80 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Tạo sản phẩm')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-2xl">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p>Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p>Chưa có sản phẩm nào</p>
              <p className="text-sm mt-2">Hãy thêm sản phẩm đầu tiên</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Hình ảnh</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Tên sản phẩm</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Giá</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Danh mục</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Stock</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Đã bán</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Ngày tạo</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-800">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            📷
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <div className="font-semibold text-gray-800">{String(product.title || '')}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {String(product.description || '')}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {typeof product.category === 'object' ? (product.category as { name?: string })?.name || 'Chưa phân loại' : product.category || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-gray-800">
                          {Number(product.stock) || 0}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-orange-600">
                          {Number(product.soldCount) || 0}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-600">
                        {product.createdAt ? formatDate(product.createdAt) : 'N/A'}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.title)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
