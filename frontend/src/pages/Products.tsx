import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'

type Product = {
  _id: string
  title: string
  price: number
  images?: string[]
  location?: string
}

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/product/search', { 
          params: { 
            q, 
            location, 
            sort, 
            category, 
            minPrice, 
            maxPrice, 
            page, 
            limit: 12 
          } 
        })
        setItems(res.data?.metadata || [])
        setTotal(res.data?.total || 0)
      } catch (e: unknown) {
        setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không tải được danh sách sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [q, location, sort, category, minPrice, maxPrice, page])

  const pages = useMemo(() => Math.max(1, Math.ceil(total / 12)), [total])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600">
              Thiết bị công nghệ
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá hàng nghìn thiết bị công nghệ chất lượng cao với giá thuê hợp lý
          </p>
        </div>

        {/* Filter bar */}
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar filters */}
          <aside className="hidden md:block bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl h-fit">
            <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm">🔍</span>
              Bộ lọc tìm kiếm
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">🔍 Từ khóa</label>
                <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} placeholder="Tìm sản phẩm..." className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm transition-all duration-300" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">📍 Địa điểm</label>
                <select value={location} onChange={e=>{ setLocation(e.target.value); setPage(1) }} className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm transition-all duration-300">
                  <option value="">Tất cả địa điểm</option>
                  <option>Hồ Chí Minh</option>
                  <option>Đà Nẵng</option>
                  <option>Hà Nội</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">📂 Danh mục</label>
                <select value={category} onChange={e=>{ setCategory(e.target.value); setPage(1) }} className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm transition-all duration-300">
                  <option value="">Tất cả danh mục</option>
                  <option value="camera">📷 Máy ảnh</option>
                  <option value="laptop">💻 Laptop</option>
                  <option value="phone">📱 Điện thoại</option>
                  <option value="audio">🎵 Âm thanh</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">💰 Khoảng giá (₫/ngày)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={minPrice} onChange={e=>{ setMinPrice(e.target.value); setPage(1) }} placeholder="Tối thiểu" className="border border-blue-200 rounded-2xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm transition-all duration-300" />
                  <input value={maxPrice} onChange={e=>{ setMaxPrice(e.target.value); setPage(1) }} placeholder="Tối đa" className="border border-blue-200 rounded-2xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm transition-all duration-300" />
                </div>
              </div>
            </div>
        </aside>

          {/* Content */}
          <div>
            {/* Top bar on mobile */}
            <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-4 shadow-xl mb-6 flex gap-3">
              <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} placeholder="🔍 Tìm sản phẩm..." className="flex-1 border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/50 backdrop-blur-sm" />
              <select value={sort} onChange={e=>{ setSort(e.target.value); setPage(1) }} className="border border-blue-200 rounded-2xl px-4 py-3 shadow-sm bg-white/50 backdrop-blur-sm">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>

            {/* Sort and count */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-gray-900">{total}</div>
                <div className="text-gray-600">sản phẩm được tìm thấy</div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-600 font-medium">Sắp xếp:</span>
                <select value={sort} onChange={e=>{ setSort(e.target.value); setPage(1) }} className="border border-blue-200 rounded-2xl px-4 py-2 shadow-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                  <option value="newest">🆕 Mới nhất</option>
                  <option value="price_asc">💰 Giá tăng dần</option>
                  <option value="price_desc">💸 Giá giảm dần</option>
                  <option value="name_asc">🔤 Tên A-Z</option>
                  <option value="name_desc">🔤 Tên Z-A</option>
                </select>
              </div>
            </div>
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-lg animate-pulse">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-4"></div>
                    <div className="h-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg mb-2"></div>
                    <div className="h-6 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
            {!loading && !error && items.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-600">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}
            {error && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {!loading && !error && items.map(p => (
                <Link key={p._id} to={`/products/${p._id}`} className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/90">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 relative overflow-hidden">
                    {p.images?.[0] && (
                      <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-blue-600 shadow-lg">
                      🔥 Hot
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-semibold line-clamp-2 text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{p.title}</div>
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent mb-2">
                      {p.price.toLocaleString()} ₫/ngày
                    </div>
                    {p.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>📍</span>
                        <span>{p.location}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button 
                  disabled={page === 1} 
                  onClick={()=>setPage(p=>Math.max(1,p-1))} 
                  className="px-6 py-3 rounded-2xl border border-blue-200 text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                >
                  ← Trước
                </button>
                {Array.from({ length: pages }).slice(0, 5).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={()=>setPage(i+1)} 
                    className={`px-4 py-3 rounded-2xl border font-medium transition-all duration-300 ${
                      page === i+1 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-blue-600 shadow-lg' 
                        : 'border-blue-200 text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50'
                    }`}
                  >
                    {i+1}
                  </button>
                ))}
                <button 
                  disabled={page === pages} 
                  onClick={()=>setPage(p=>Math.min(pages,p+1))} 
                  className="px-6 py-3 rounded-2xl border border-blue-200 text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
