import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../shared/UserContext'
import { api } from '../shared/api'
import Header from '../components/Header'
import Footer from '../components/Footer'

type Product = {
  _id: string
  title: string
  price: number
  images?: string[]
  details?: string
  brand?: string
  category?: string
  condition?: string
  location?: string
  specifications?: Record<string, string>
  rating?: number
  reviewCount?: number
  availability?: boolean
  depositAmount?: number
  depositPolicy?: {
    unverified: number
    verified: number
    premium: number
  }
}

type DepositPolicy = {
  productId: string
  productName: string
  productPrice: number
  userKycStatus: 'unverified' | 'verified' | 'premium'
  depositPolicy: {
    unverified: number
    verified: number
    premium: number
  }
  currentDepositPercentage: number
  currentDepositAmount: number
  isDepositRequired: boolean
  policyDescription: string
}

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const navigate = useNavigate()
  const [data, setData] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [depositPolicy, setDepositPolicy] = useState<DepositPolicy | null>(null)
  const [activeImg, setActiveImg] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  // must be declared before any early returns so hooks are consistent
  const numDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const s = new Date(startDate)
    const e = new Date(endDate)
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [startDate, endDate])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/product/${id}`)
        setData(res.data?.metadata)
      } catch (e: unknown) {
        setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không tải được chi tiết sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

         // Fetch deposit policy when product data is loaded
         useEffect(() => {
           const fetchDepositPolicy = async () => {
             if (!id || !user) return
             
             try {
               const response = await api.get(`/deposit-policy/product/${id}`)
               if (response.data.success) {
                 setDepositPolicy(response.data.data)
               }
             } catch (error: unknown) {
               console.error('Error fetching deposit policy:', error)
             }
           }

           fetchDepositPolicy()
         }, [id, user])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <span className="text-2xl text-white">⏳</span>
          </div>
          <p className="text-xl font-semibold text-gray-700">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
      <Footer />
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Có lỗi xảy ra</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
      <Footer />
    </div>
  )
  
  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔍</span>
          </div>
          <p className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm</p>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-blue-600 transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-gray-500 hover:text-blue-600 transition-colors">Thiết bị</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{data.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-video bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer"
                 onClick={() => setIsFullscreen(true)}>
              {data.images?.[activeImg] && (
                <img 
                  src={data.images[activeImg]} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isZoomed ? 'scale-150' : 'group-hover:scale-105'
                  }`}
                  onDoubleClick={() => setIsZoomed(!isZoomed)}
                />
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-blue-600 shadow-lg">
                🔥 Hot Deal
              </div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-green-600 shadow-lg">
                -20% Tuần đầu
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsZoomed(!isZoomed)
                  }}
                  className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
                >
                  <span className="text-lg">🔍</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsFullscreen(true)
                  }}
                  className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
                >
                  <span className="text-lg">⛶</span>
                </button>
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-5 gap-3 mt-6">
              {(data.images || []).slice(0,5).map((img, i) => (
                <button 
                  key={i} 
                  onClick={()=>setActiveImg(i)} 
                  className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    activeImg===i
                      ?'border-blue-500 shadow-lg scale-105' 
                      :'border-white/60 hover:border-blue-300 hover:scale-105'
                  } bg-white/80 backdrop-blur-sm relative`}
                >
                  <img src={img} className="w-full h-20 object-cover" />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                      Chính
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Image counter */}
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                {activeImg + 1} / {data.images?.length || 1} ảnh
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{data.title}</h1>
                {data.brand && (
                  <p className="text-lg text-gray-600 mb-2">Thương hiệu: <span className="font-semibold text-blue-600">{data.brand}</span></p>
                )}
                {data.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span>📍</span> {data.location}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="px-4 py-2 text-sm rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold border border-green-200">
                  ✅ Đã xác minh
                </span>
                {data.availability !== false && (
                  <span className="px-4 py-2 text-sm rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-semibold border border-blue-200">
                    🟢 Có sẵn
                  </span>
                )}
              </div>
            </div>
            
            {/* Rating */}
            {data.rating && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < Math.floor(data.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">{data.rating}</span>
                <span className="text-gray-500">({data.reviewCount || 0} đánh giá)</span>
              </div>
            )}
            
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent mb-6">
              {data.price.toLocaleString()} ₫/ngày
            </div>

            {/* Deposit Policy Information */}
            {depositPolicy && (
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                  <span className="text-lg font-semibold text-blue-800">Chính sách đặt cọc</span>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed mb-3">
                  {depositPolicy.policyDescription}
                </p>
                {depositPolicy.isDepositRequired && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200">
                    <span className="text-sm text-blue-600 font-medium">Tiền cọc ({depositPolicy.currentDepositPercentage}%):</span>
                    <span className="text-lg font-bold text-orange-600">
                      {depositPolicy.currentDepositAmount.toLocaleString()} ₫
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs">📅</span>
                Chọn thời gian thuê
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Từ ngày</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e=>setStartDate(e.target.value)} 
                    className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Đến ngày</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e=>setEndDate(e.target.value)} 
                    className="w-full border border-blue-200 rounded-2xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300" 
                  />
                </div>
              </div>
              {numDays > 0 && (
                <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Số ngày thuê:</span>
                    <span className="text-xl font-bold text-blue-600">{numDays} ngày</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-700 font-medium">Giá gốc:</span>
                    <span className="text-lg text-gray-500 line-through">
                      {(numDays * data.price).toLocaleString()} ₫
                    </span>
                  </div>
                  
                  {numDays >= 7 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-green-600 font-medium">Giảm giá tuần đầu (-20%):</span>
                      <span className="text-green-600 font-bold">
                        -{Math.floor(numDays * data.price * 0.2).toLocaleString()} ₫
                      </span>
                    </div>
                  )}
                  

                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Tổng tiền:</span>
                      <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        {numDays >= 7 
                          ? Math.floor(numDays * data.price * 0.8).toLocaleString()
                          : (numDays * data.price).toLocaleString()
                        } ₫
                      </span>
                    </div>
                    {numDays >= 7 && (
                      <p className="text-sm text-green-600 mt-1 text-right">
                        Tiết kiệm {Math.floor(numDays * data.price * 0.2).toLocaleString()} ₫
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs">📝</span>
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 rounded-2xl p-4 border border-gray-200">
                {data.details || 'Chưa có mô tả chi tiết về sản phẩm này.'}
              </p>
            </div>

            {/* Specifications */}
            {data.specifications && Object.keys(data.specifications).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">⚙️</span>
                  Thông số kỹ thuật
                </h3>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-gray-600 font-medium">{key}:</span>
                        <span className="text-gray-900 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={async () => {
                  if (!user?.name) {
                    navigate('/login')
                    return
                  }
                  try {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      window.alert('Vui lòng đăng nhập để thuê sản phẩm.')
                      navigate('/login')
                      return
                    }
                    
                    const res = await api.get('/kyc/status', { headers: { Authorization: `Bearer ${token}` } })
                    console.log('KYC Status Response:', res.data)
                    
                    const kycStatus = res.data?.status || res.data?.kycStatus
                    
                    if (kycStatus === 'approved' || kycStatus === 'verified') {
                      const search = new URLSearchParams()
                      if (id) search.set('productId', id)
                      if (startDate) search.set('start', startDate)
                      if (endDate) search.set('end', endDate)
                      navigate(`/checkout?${search.toString()}`)
                    } else if (kycStatus === 'pending' || kycStatus === 'processing') {
                      window.alert('Hồ sơ KYC đang chờ duyệt. Vui lòng đợi admin phê duyệt trước khi thuê.')
                      navigate('/verify-identity')
                    } else {
                      window.alert('Bạn cần xác minh giấy tờ (eKYC) trước khi thuê. Chuyển đến trang xác minh.')
                      navigate('/verify-identity')
                    }
                  } catch (error) {
                    console.error('KYC Check Error:', error)
                    // Fallback: nếu không kiểm tra được KYC, cho phép tiếp tục với cảnh báo
                    const shouldContinue = window.confirm(
                      'Không thể kiểm tra trạng thái KYC. Bạn có muốn tiếp tục thuê sản phẩm không?\n\n' +
                      'Lưu ý: Nếu chưa xác minh KYC, đơn hàng có thể bị từ chối.'
                    )
                    
                    if (shouldContinue) {
                      const search = new URLSearchParams()
                      if (id) search.set('productId', id)
                      if (startDate) search.set('start', startDate)
                      if (endDate) search.set('end', endDate)
                      navigate(`/checkout?${search.toString()}`)
                    }
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
              >
                🛒 Đặt thuê ngay
              </button>
              <button className="px-6 py-4 rounded-2xl border border-blue-200 text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50 transition-all duration-300 hover:scale-105 transform">
                ❤️ Lưu
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="text-2xl mb-2">🛡️</div>
                <div className="text-sm font-semibold text-green-700">Bảo hiểm hư hỏng</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-semibold text-blue-700">KYC người dùng</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div className="text-2xl mb-2">💳</div>
                <div className="text-sm font-semibold text-purple-700">Thanh toán an toàn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600">
                Đánh giá & Bình luận
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Nhận xét từ những người dùng đã thuê sản phẩm này</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-2xl mb-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
                  {data.rating || 4.8}
                </div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-2xl ${i < Math.floor(data.rating || 4.8) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">({data.reviewCount || 24} đánh giá)</p>
              </div>
              
              <div className="md:col-span-2">
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{star}⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                          style={{ width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 8 : star === 2 ? 2 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {star === 5 ? 17 : star === 4 ? 5 : star === 3 ? 2 : star === 2 ? 0 : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sample Reviews */}
            <div className="space-y-6">
              {[
                {
                  name: 'Nguyễn Văn A',
                  rating: 5,
                  date: '2 ngày trước',
                  comment: 'Sản phẩm rất tốt, chất lượng như mô tả. Giao hàng nhanh, đóng gói cẩn thận. Sẽ thuê lại lần sau!'
                },
                {
                  name: 'Trần Thị B',
                  rating: 4,
                  date: '1 tuần trước',
                  comment: 'Thiết bị hoạt động ổn định, giá cả hợp lý. Chỉ có một chút trầy xước nhỏ nhưng không ảnh hưởng đến sử dụng.'
                },
                {
                  name: 'Lê Văn C',
                  rating: 5,
                  date: '2 tuần trước',
                  comment: 'Tuyệt vời! Đúng như hình ảnh, chất lượng cao. Dịch vụ hỗ trợ rất tốt, giải đáp mọi thắc mắc nhanh chóng.'
                }
              ].map((review, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600">
                Sản phẩm tương tự
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Khám phá thêm những thiết bị khác có thể bạn quan tâm</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <Link key={i} to="/products" className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/90">
                <div className="aspect-video bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 relative overflow-hidden">
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-blue-600 shadow-lg">
                    🔥 Hot
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    Thiết bị liên quan {i}
                  </div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
                    350.000 ₫/ngày
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
            >
              🛍️ Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Gallery Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => setIsFullscreen(false)}>
          <div className="relative max-w-6xl max-h-full">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30 transition-colors z-10"
            >
              <span className="text-2xl">✕</span>
            </button>
            
            <div className="relative">
              {data.images?.[activeImg] && (
                <img 
                  src={data.images[activeImg]} 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                />
              )}
              
              {/* Navigation arrows */}
              {data.images && data.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImg(prev => prev > 0 ? prev - 1 : data.images!.length - 1)
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30 transition-colors"
                  >
                    <span className="text-2xl">‹</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImg(prev => prev < data.images!.length - 1 ? prev + 1 : 0)
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30 transition-colors"
                  >
                    <span className="text-2xl">›</span>
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails in fullscreen */}
            {data.images && data.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {data.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImg(i)
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-white' : 'border-white/30'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  )
}