import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select'
import ProductCard from '../components/ProductCard'
import { ProductCardSkeleton, CategoryCardSkeleton } from '../components/ui/Skeleton'

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)



export default function App() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState<Array<{ 
    _id: string
    title: string
    price: number
    images?: string[]
    brand?: string
    location?: string
    soldCount?: number
    isHotProduct?: boolean
    isNewProduct?: boolean
    discount?: number
  }>>([])
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [homeLocation, setHomeLocation] = useState('')
  const [homeSort, setHomeSort] = useState('newest')
  const categoriesRef = useRef<HTMLDivElement | null>(null)

  // carousel
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const scrollCarousel = (dir: 'left'|'right') => {
    const el = carouselRef.current
    if (!el) return
    const amount = Math.min(600, el.clientWidth * 0.9)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  // Particles positions (được cố định 1 lần để tránh nhấp nháy)
  const particlesRef = useRef<Array<{ left: string; top: string; delay: string; duration: string }>>([])
  if (particlesRef.current.length === 0) {
    particlesRef.current = Array.from({ length: 18 }).map(() => {
      const left = `${Math.round(Math.random() * 100)}%`
      const top = `${Math.round(Math.random() * 100)}%`
      const delay = `${Math.round(Math.random() * 500) / 100}s`
      const duration = `${2 + Math.round(Math.random() * 300) / 100}s`
      return { left, top, delay, duration }
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch categories
        const categoriesRes = await api.get('/category')
        setCategories(categoriesRes.data?.data || [])
        
        // Fetch featured products
        const productsRes = await api.get('/product/search', { 
          params: { 
            sort: 'newest', 
            limit: 6,
            ...(selectedCategory && { category: selectedCategory })
          } 
        })
        setFeatured(productsRes.data?.metadata || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setFeatured([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCategory])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (selectedCategory) params.set('category', selectedCategory)
    if (homeLocation) params.set('location', homeLocation)
    if (homeSort) params.set('sort', homeSort)
    navigate(params.toString() ? `/products?${params.toString()}` : '/products')
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[calc(100vh-72px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 will-change-[background] transform-gpu">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl animate-fade-in" />
            <div className="absolute -bottom-16 right-8 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl animate-float" />
          </div>
          
          {/* Floating Particles */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            {particlesRef.current.map((p, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-fade-in"
                style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration }}
              />
            ))}
          </div>

          <div className="container text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-8 animate-fade-in">
                <span className="text-white drop-shadow-2xl animate-slide-in-left">Thuê đồ công nghệ</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 drop-shadow-xl animate-slide-in-right">
                  Nhanh chóng & Tin cậy
                </span>
              </h1>
              
               <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-lg animate-fade-in-up">
                 <span className="text-white font-bold bg-white/15 px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 inline-block backdrop-blur-sm border border-white/20">Mọi thiết bị bạn cần</span>, ngay trong tầm tay. Trải nghiệm thuê thiết bị công nghệ <span className="text-white font-bold bg-white/15 px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 inline-block backdrop-blur-sm border border-white/20">an toàn</span>, <span className="text-white font-bold bg-white/15 px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 inline-block backdrop-blur-sm border border-white/20">tiện lợi</span> và <span className="text-white font-bold bg-white/15 px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 inline-block backdrop-blur-sm border border-white/20">tiết kiệm chi phí</span>.
              </p>

              {/* Search + Filters */}
              <form onSubmit={onSubmit} className="mx-auto max-w-4xl mb-12 grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white/20 backdrop-blur-lg p-4 rounded-3xl border border-white/30 shadow-2xl animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                <div className="sm:col-span-2 flex items-center gap-2 bg-white/90 rounded-xl px-3 py-2">
                  <span className="text-blue-500">
                    <SearchIcon />
                  </span>
                  <Input
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    placeholder="Tìm kiếm thiết bị..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0"
                  />
                </div>
                <Select value={homeLocation || undefined} onValueChange={(v: string)=>setHomeLocation(v)}>
                  <SelectTrigger className="bg-white/90 rounded-xl text-gray-800 font-medium">
                    <SelectValue placeholder="📍 Tất cả địa điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hồ Chí Minh">Hồ Chí Minh</SelectItem>
                    <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                    <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={homeSort || undefined} onValueChange={(v: string)=>setHomeSort(v)}>
                  <SelectTrigger className="bg-white/90 rounded-xl text-gray-800 font-medium">
                    <SelectValue placeholder="🔽 Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform hover:shadow-pink-500/25">
                  <span className="flex items-center gap-2">
                    <span>Tìm kiếm</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </span>
                </Button>
              </form>


              {/* Enhanced Category Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
                {[
                  { name: 'Máy ảnh', icon: '📷', desc: 'Chuyên nghiệp', count: '50+', color: 'from-red-500/25 to-orange-500/25', borderColor: 'border-red-500/40' },
                  { name: 'Laptop', icon: '💻', desc: 'Hiệu năng cao', count: '80+', color: 'from-blue-500/25 to-cyan-500/25', borderColor: 'border-blue-500/40' },
                  { name: 'Máy chiếu', icon: '📽️', desc: 'Chất lượng HD', count: '30+', color: 'from-green-500/25 to-emerald-500/25', borderColor: 'border-green-500/40' },
                  { name: 'Điện thoại', icon: '📱', desc: 'Tiện lợi', count: '60+', color: 'from-purple-500/25 to-pink-500/25', borderColor: 'border-purple-500/40' },
                  { name: 'Âm thanh', icon: '🎵', desc: 'Chất lượng cao', count: '40+', color: 'from-indigo-500/25 to-violet-500/25', borderColor: 'border-indigo-500/40' },
                  { name: 'Gaming', icon: '🎮', desc: 'Trải nghiệm tuyệt vời', count: '25+', color: 'from-yellow-500/25 to-amber-500/25', borderColor: 'border-yellow-500/40' }
                ].map((category, index) => (
                  <div 
                    key={index}
                    className={`group p-4 rounded-2xl bg-gradient-to-br ${category.color} backdrop-blur-sm border ${category.borderColor} hover:scale-105 transition-transform duration-300 cursor-pointer text-center shadow-lg hover:shadow-xl`}
                    onClick={() => {
                      const categoryName = category.name.toLowerCase()
                      setSelectedCategory(categoryName)
                      navigate(`/products?category=${encodeURIComponent(categoryName)}`)
                    }}
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                     <h3 className="text-white font-bold text-sm mb-1 drop-shadow text-center">{category.name}</h3>
                     <p className="text-white/80 text-xs mb-1 font-medium text-center">{category.desc}</p>
                     <p className="text-white text-xs font-semibold bg-white/15 px-2 py-1 rounded-full text-center backdrop-blur-sm border border-white/20">{category.count} sản phẩm</p>
                  </div>
                ))}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{animationDelay: '1.2s'}}>
                <button
                  type="button"
                  onClick={() => categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-bold text-lg transition-colors duration-300 hover:bg-white/15"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🛍️</span>
                    Thuê ngay
                  </span>
                </button>
                <Link to="/seller/products" className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold text-lg transition-transform duration-300 hover:scale-105">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📤</span>
                    Đăng cho thuê
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Rentiva */}
        <section className="py-24 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-yellow-200/30 to-orange-200/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-pink-200/30 to-purple-200/30 blur-3xl animate-bounce" style={{animationDuration: '6s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-200/20 to-blue-200/20 blur-3xl animate-spin" style={{animationDuration: '30s'}} />
          </div>
          
          <div className="container relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'}}>
                Vì sao chọn Rentiva
              </h2>
               <p className="text-gray-700 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
                 <span className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">An toàn hơn</span>, <span className="text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">nhanh hơn</span> và <span className="text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">tiết kiệm hơn</span> cho nhu cầu thuê thiết bị của bạn.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              {[
                { 
                  title: 'An toàn & tin cậy', 
                  desc: 'Xác minh người dùng, bảo vệ giao dịch và đánh giá minh bạch.',
                  icon: '🛡️',
                  bgColor: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm',
                  borderColor: 'border-blue-300/60',
                  iconBg: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500'
                },
                { 
                  title: 'Nhanh chóng', 
                  desc: 'Tìm kiếm, đặt thuê và nhắn tin trực tiếp với chủ thiết bị.',
                  icon: '⚡',
                  bgColor: 'bg-gradient-to-br from-orange-50/80 to-yellow-50/80 backdrop-blur-sm',
                  borderColor: 'border-orange-300/60',
                  iconBg: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500'
                },
                { 
                  title: 'Tiết kiệm', 
                  desc: 'Giá cạnh tranh, đa dạng thiết bị và linh hoạt thời gian thuê.',
                  icon: '💰',
                  bgColor: 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm',
                  borderColor: 'border-green-300/60',
                  iconBg: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
                },
              ].map((item, idx) => (
                <div key={idx} className={`group p-8 text-center rounded-3xl border ${item.bgColor} ${item.borderColor} shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 transform hover-lift`} style={{animationDelay: `${idx * 0.2}s`}}>
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${item.iconBg} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                   <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">{item.title}</h3>
                   <p className="text-gray-600 leading-relaxed text-lg font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories - Large Glassmorphism Cards */}
        <section ref={categoriesRef} className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-orange-900 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 blur-3xl animate-bounce" style={{animationDuration: '6s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-yellow-500/5 to-orange-500/5 blur-3xl animate-spin" style={{animationDuration: '25s'}} />
            <div className="absolute top-3/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-emerald-500/8 to-teal-500/8 blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          </div>
          
          <div className="container relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255, 255, 255, 0.4)'}}>
                Danh mục phổ biến
              </h2>
               <p className="text-white/90 text-xl max-w-3xl mx-auto font-medium">
                 Khám phá các loại thiết bị được <span className="text-white font-semibold bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">yêu thích nhất</span> với <span className="text-white font-semibold bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">giá cả cạnh tranh</span>
              </p>
            </div>
            
            {/* Asymmetric Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              {categories.slice(0, 6).map((category, index) => {
                const iconMap: { [key: string]: string } = {
                  'Laptop': '💻',
                  'Máy ảnh': '📷',
                  'Điện thoại': '📱',
                  'Âm thanh': '🎵',
                  'Gaming': '🎮',
                  'Phụ kiện': '🔌',
                  'Máy chiếu': '📽️',
                  'Thiết bị văn phòng': '🖥️'
                }
                const cardData = [
                  { desc: 'Hiệu năng cao', count: '80+ sản phẩm', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30' },
                  { desc: 'Chuyên nghiệp', count: '50+ sản phẩm', color: 'from-orange-500/20 to-red-500/20', borderColor: 'border-orange-500/30' },
                  { desc: 'Tiện lợi', count: '60+ sản phẩm', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/30' },
                  { desc: 'Chất lượng cao', count: '40+ sản phẩm', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/30' },
                  { desc: 'Trải nghiệm tuyệt vời', count: '30+ sản phẩm', color: 'from-pink-500/20 to-rose-500/20', borderColor: 'border-pink-500/30' },
                  { desc: 'Đa dạng', count: '70+ sản phẩm', color: 'from-indigo-500/20 to-blue-500/20', borderColor: 'border-indigo-500/30' }
                ]
                const data = cardData[index] || cardData[0]
                
                return (
                  <div
                    key={category._id}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                    className={`group p-8 rounded-3xl bg-gradient-to-br ${data.color} backdrop-blur-sm border ${data.borderColor} hover:scale-110 hover:-translate-y-3 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover-lift`}
                    style={{ 
                      gridRow: index === 0 ? 'span 2' : 'span 1',
                      minHeight: index === 0 ? '400px' : '200px'
                    }}
                  >
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      {iconMap[category.name] || '📦'}
                    </div>
                     <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg text-center">{category.name}</h3>
                     <p className="text-white/80 text-lg mb-4 font-medium text-center">{data.desc}</p>
                     <p className="text-white text-sm font-semibold bg-white/20 px-3 py-1 rounded-full text-center backdrop-blur-sm border border-white/30">{data.count}</p>
                    </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-200/30 to-cyan-200/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-purple-200/30 to-pink-200/30 blur-3xl animate-bounce" style={{animationDuration: '6s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-200/20 to-teal-200/20 blur-3xl animate-spin" style={{animationDuration: '30s'}} />
          </div>
          
          <div className="container relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'}}>
                Sản phẩm nổi bật
              </h2>
               <p className="text-gray-700 text-xl max-w-3xl mx-auto mb-8 font-medium">
                 Những thiết bị được <span className="text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">đánh giá cao nhất</span> với <span className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">giá cả cạnh tranh</span>
              </p>
              <Link to="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-lg hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
                Xem tất cả sản phẩm
              </Link>
            </div>
            
            {loading && (
              <div className="relative">
                <div className="grid grid-flow-col auto-cols-[85%] md:auto-cols-[45%] lg:auto-cols-[32%] gap-6">
                  {Array.from({length: 6}).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            )}
            
            {!loading && featured.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có sản phẩm nào</h3>
                 <p className="text-gray-600 font-medium">Hãy quay lại sau để xem các <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full border border-blue-200">sản phẩm mới nhất</span></p>
              </div>
            )}
            
            {/* Carousel controls */}
            <div className="relative">
              <button type="button" onClick={()=>scrollCarousel('left')} className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow hover:shadow-lg items-center justify-center border border-gray-200">‹</button>
              <button type="button" onClick={()=>scrollCarousel('right')} className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow hover:shadow-lg items-center justify-center border border-gray-200">›</button>
              <div ref={carouselRef} className="snap-x snap-mandatory overflow-x-auto no-scrollbar pb-2">
                <div className="grid grid-flow-col auto-cols-[85%] md:auto-cols-[45%] lg:auto-cols-[32%] gap-6">
                  {featured.map((p, index) => (
                    <ProductCard
                      key={p._id}
                      id={p._id}
                      title={p.title}
                      price={p.price}
                      imageUrl={p.images?.[0]}
                      brand={p.brand}
                      location={p.location}
                      soldCount={p.soldCount}
                      rating={4.8}
                      isNewProduct={p.isNewProduct}
                      isHotProduct={p.isHotProduct}
                      discount={p.discount}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics / Trust Indicators */}
        <section className="py-20 bg-gradient-to-br from-orange-50 via-pink-50 to-cyan-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-yellow-200/20 to-orange-200/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-pink-200/20 to-purple-200/20 blur-3xl animate-bounce" style={{animationDuration: '6s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-200/15 to-blue-200/15 blur-3xl animate-spin" style={{animationDuration: '30s'}} />
          </div>
          
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'}}>
                Thống kê ấn tượng
              </h2>
               <p className="text-gray-700 text-lg font-medium">Những con số chứng minh <span className="text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full border border-orange-200">sự tin tưởng</span> của <span className="text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">cộng đồng</span></p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[{
                label: 'Người dùng tin tưởng', value: '120K+', emoji: '🤝', color: 'from-orange-500 to-red-500', textColor: 'from-orange-600 to-red-600'
              },{
                label: 'Thiết bị đang cho thuê', value: '8.5K+', emoji: '📦', color: 'from-purple-500 to-pink-500', textColor: 'from-purple-600 to-pink-600'
              },{
                label: 'Giao dịch an toàn', value: '99.98%', emoji: '🛡️', color: 'from-emerald-500 to-cyan-500', textColor: 'from-emerald-600 to-cyan-600'
              }].map((s, i)=> (
                <div key={i} className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-3xl mb-6 bg-gradient-to-r ${s.color} group-hover:scale-110 transition-transform duration-300`}>
                    {s.emoji}
                  </div>
                  <div className={`text-5xl font-extrabold bg-gradient-to-r ${s.textColor} bg-clip-text text-transparent mb-2`}>{s.value}</div>
                   <div className="text-gray-700 font-semibold text-lg">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}