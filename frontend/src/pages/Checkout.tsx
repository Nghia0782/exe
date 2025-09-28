import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { api } from '../shared/api'
import { useUser } from '../shared/UserContext'

export default function Checkout() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { user } = useUser()
  const params = new URLSearchParams(search)
  const productId = params.get('productId') || ''
  const start = params.get('start') || ''
  const end = params.get('end') || ''

  const [product, setProduct] = useState<{ title: string; price: number; images?: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'verified' | 'rejected'>('none')
  const numDays = useMemo(() => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    
    // Validate dates
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      console.warn('Invalid dates:', { start, end })
      return 0
    }
    
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [start, end])

  useEffect(() => {
    if (!productId) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/product/${productId}`)
        setProduct(res.data?.metadata)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [productId])

  // Kiểm tra KYC status
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        // Force refresh từ backend với cache-busting
        const timestamp = Date.now()
        const res = await api.get(`/kyc/status?t=${timestamp}`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          } 
        })
        if (import.meta.env.MODE === 'development') {
          console.debug('KYC Status API Response (Force Refresh):', res.data)
        }
        const status = res.data?.status || res.data?.kycStatus || 'none'
        if (import.meta.env.MODE === 'development') {
          console.debug('Parsed KYC Status (Force Refresh):', status)
        }
        setKycStatus(status)
      } catch (error) {
        console.warn('Could not fetch KYC status:', error)
        setKycStatus('none')
      }
    }
    
    if (user?.name) {
      checkKycStatus()
    }
  }, [user])

  const onCreateOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.alert('Vui lòng đăng nhập để đặt thuê.')
        navigate('/login')
        return
      }

      // Validate required data
      if (!productId) {
        window.alert('Không tìm thấy sản phẩm. Vui lòng thử lại.')
        navigate('/products')
        return
      }
      
      if (!start || !end) {
        window.alert('Vui lòng chọn ngày bắt đầu và kết thúc thuê.')
        navigate(`/products/${productId}`)
        return
      }
      
      if (numDays <= 0) {
        window.alert('Số ngày thuê phải lớn hơn 0. Vui lòng chọn lại ngày.')
        navigate(`/products/${productId}`)
        return
      }
      
      if (!product || !product.price) {
        window.alert('Không thể lấy thông tin giá sản phẩm. Vui lòng thử lại.')
        return
      }

      const payload = { 
        products: [productId], 
        startDate: start, 
        endDate: end,
        duration: numDays,
        totalPrice: product.price * numDays
      }
      
      if (import.meta.env.MODE === 'development') {
        console.debug('Order payload:', payload)
      }
      
      // Kiểm tra KYC status từ backend trước khi tạo order
      try {
        if (import.meta.env.MODE === 'development') {
          console.debug('Double-checking KYC status with backend before order creation...')
        }
        const timestamp = Date.now()
        const kycRes = await api.get(`/kyc/status?t=${timestamp}`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          } 
        })
        if (import.meta.env.MODE === 'development') {
          console.debug('Backend KYC Status (Pre-order):', kycRes.data)
        }
        const backendKycStatus = kycRes.data?.status || kycRes.data?.kycStatus || 'none'
        if (import.meta.env.MODE === 'development') {
          console.debug('Backend KYC Status (Pre-order):', backendKycStatus)
        }
        
        // Sync frontend với backend
        setKycStatus(backendKycStatus)
        
        if (backendKycStatus === 'none' || backendKycStatus === 'rejected') {
          if (import.meta.env.MODE === 'development') {
            console.debug('Backend confirms KYC not approved, redirecting to verify')
          }
          window.alert('Tài khoản chưa được xác minh KYC. Vui lòng xác minh trước khi đặt thuê.')
          navigate('/verify-identity')
          return
        }
        
        if (backendKycStatus === 'pending') {
          if (import.meta.env.MODE === 'development') {
            console.debug('Backend confirms KYC pending, asking user to continue')
          }
          const shouldContinue = window.confirm(
            'Hồ sơ KYC đang chờ duyệt. Bạn có muốn tiếp tục đặt thuê không?\n\n' +
            'Lưu ý: Đơn hàng có thể bị từ chối nếu KYC chưa được duyệt.'
          )
          if (!shouldContinue) return
        }
        
        if (import.meta.env.MODE === 'development') {
          console.debug('Backend confirms KYC approved, proceeding with order creation')
        }
        
      } catch (kycError) {
        console.error('Backend KYC check failed:', kycError)
        const error = kycError as { response?: { status?: number; data?: { message?: string } } }
        if (import.meta.env.MODE === 'development') {
          console.debug('Backend KYC Error details:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.response?.data?.message
        })
        }
        
        // Nếu backend trả về 403 hoặc message KYC, chuyển đến verify
        if (error?.response?.status === 403 || 
            error?.response?.data?.message?.toLowerCase().includes('kyc') ||
            error?.response?.data?.message?.toLowerCase().includes('verify')) {
          if (import.meta.env.MODE === 'development') {
            console.debug('Backend requires KYC, redirecting to verify')
          }
          setKycStatus('none')
          window.alert('Tài khoản cần xác minh KYC trước khi đặt thuê. Chuyển đến trang xác minh.')
          navigate('/verify-identity')
          return
        }
        
        // Nếu không phải lỗi KYC, hỏi user có muốn tiếp tục không
        const shouldContinue = window.confirm(
          'Không thể kiểm tra trạng thái KYC từ backend. Bạn có muốn tiếp tục đặt thuê không?\n\n' +
          'Lưu ý: Nếu chưa xác minh KYC, đơn hàng có thể bị từ chối.'
        )
        if (!shouldContinue) return
      }

      // Kiểm tra đơn hàng với backend
      try {
        if (import.meta.env.MODE === 'development') {
          console.debug('Checking order with backend...')
        }
        await api.post('/orders/check', payload, { headers: { Authorization: `Bearer ${token}` } })
        if (import.meta.env.MODE === 'development') {
          console.debug('Order check passed')
        }
      } catch (checkError) {
        console.error('Order check failed:', checkError)
        const error = checkError as { response?: { status?: number; data?: { message?: string } } }
        const msg = error?.response?.data?.message
        const status = error?.response?.status
        
        if (import.meta.env.MODE === 'development') {
          console.debug('Order Check Error details:', {
          status: status,
          message: msg,
          data: error?.response?.data
        })
        }
        
        // Nếu backend yêu cầu KYC, chuyển đến verify
        if (status === 403 || 
            msg?.toLowerCase().includes('kyc') || 
            msg?.toLowerCase().includes('verify') ||
            msg?.toLowerCase().includes('identity')) {
          if (import.meta.env.MODE === 'development') {
            console.debug('Backend order check requires KYC - syncing frontend status')
          }
          // Sync KYC status từ backend về frontend
          setKycStatus('none')
          window.alert('Tài khoản cần xác minh KYC trước khi đặt thuê. Chuyển đến trang xác minh.')
          navigate('/verify-identity')
          return
        }
        
        // Nếu không phải lỗi KYC, hỏi user có muốn tiếp tục không
        const shouldContinue = window.confirm(
          'Không thể kiểm tra đơn hàng. Bạn có muốn tiếp tục không?\n\n' +
          'Lưu ý: Đơn hàng có thể không hợp lệ.'
        )
        if (!shouldContinue) return
      }
      
      // Tạo đơn hàng
      try {
        if (import.meta.env.MODE === 'development') {
          console.debug('Creating order with backend...')
        }
        const created = await api.post('/orders', payload, { headers: { Authorization: `Bearer ${token}` } })
        if (import.meta.env.MODE === 'development') {
          console.debug('Order created successfully:', created.data)
        }
        window.alert('Đặt thuê thành công!')
        navigate(`/orders/${created.data?.id || ''}`)
      } catch (orderError) {
        console.error('Order creation failed:', orderError)
        const error = orderError as { response?: { status?: number; data?: { message?: string } } }
        const msg = error?.response?.data?.message
        const status = error?.response?.status
        
        if (import.meta.env.MODE === 'development') {
          console.debug('Order Error details:', {
          status: status,
          message: msg,
          data: error?.response?.data
        })
        }
        
        // Xử lý lỗi KYC từ backend
        if (status === 403 || 
            msg?.toLowerCase().includes('kyc') || 
            msg?.toLowerCase().includes('verify') ||
            msg?.toLowerCase().includes('identity')) {
          if (import.meta.env.MODE === 'development') {
            console.debug('Backend order creation requires KYC - syncing frontend status')
          }
          // Sync KYC status từ backend về frontend
          setKycStatus('none')
          window.alert('Tài khoản cần xác minh KYC trước khi đặt thuê. Chuyển đến trang xác minh.')
          navigate('/verify-identity')
          return
        }
        
        // Xử lý các lỗi khác
        window.alert(msg || 'Không thể tạo đơn hàng. Vui lòng thử lại.')
      }
    } catch (e: unknown) {
      console.error('Order creation error:', e)
      const error = e as { response?: { status?: number; data?: { message?: string } } }
      const msg = error?.response?.data?.message
      const status = error?.response?.status
      
      if (import.meta.env.MODE === 'development') {
        console.debug('Final Error details:', {
        status: status,
        message: msg,
        data: error?.response?.data
      })
      }
      
      // Xử lý lỗi từ backend
      if (status === 403 || 
          msg?.toLowerCase().includes('kyc') || 
          msg?.toLowerCase().includes('verify') ||
          msg?.toLowerCase().includes('identity')) {
        if (import.meta.env.MODE === 'development') {
          console.debug('Final error requires KYC - syncing frontend status')
        }
        // Sync KYC status từ backend về frontend
        setKycStatus('none')
        window.alert('Tài khoản cần xác minh KYC trước khi đặt thuê. Chuyển đến trang xác minh.')
        navigate('/verify-identity')
      } else {
        window.alert(msg || 'Không thể tạo đơn hàng. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Xác nhận đặt thuê</h1>
        
        {/* KYC Status Banner */}
        {user?.name && (
          <div className={`mb-6 rounded-2xl p-4 border ${
            (kycStatus === 'approved' || kycStatus === 'verified') 
              ? 'bg-green-50 border-green-200' 
              : kycStatus === 'pending' 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${
                  (kycStatus === 'approved' || kycStatus === 'verified') ? 'text-green-600' : 
                  kycStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(kycStatus === 'approved' || kycStatus === 'verified') ? '✅' : kycStatus === 'pending' ? '⏳' : '❌'}
                </span>
                <div>
                  <p className={`font-semibold ${
                    (kycStatus === 'approved' || kycStatus === 'verified') ? 'text-green-800' : 
                    kycStatus === 'pending' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {(kycStatus === 'approved' || kycStatus === 'verified') ? 'Tài khoản đã xác minh' : 
                     kycStatus === 'pending' ? 'Đang chờ xác minh' : 
                     'Cần xác minh tài khoản'}
                  </p>
                  <p className={`text-sm ${
                    (kycStatus === 'approved' || kycStatus === 'verified') ? 'text-green-600' : 
                    kycStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(kycStatus === 'approved' || kycStatus === 'verified') ? 'Bạn có thể đặt thuê sản phẩm' : 
                     kycStatus === 'pending' ? 'Có thể đặt thuê nhưng đơn hàng có thể bị từ chối' : 
                     'Vui lòng xác minh danh tính trước khi đặt thuê'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {kycStatus} | Debug: Mở Console để xem chi tiết
                  </p>
                </div>
              </div>
          <button 
            onClick={async () => {
              try {
                const token = localStorage.getItem('token')
                if (!token) return
                
                // Force refresh từ backend với cache-busting
                const timestamp = Date.now()
                const res = await api.get(`/kyc/status?t=${timestamp}`, { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  } 
                })
                console.log('Manual KYC Refresh (Force):', res.data)
                const status = res.data?.status || res.data?.kycStatus || 'none'
                setKycStatus(status)
                window.alert(`KYC Status refreshed from backend: ${status}`)
              } catch (error) {
                console.error('Manual KYC refresh failed:', error)
                window.alert('Không thể refresh KYC status từ backend')
              }
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            🔄 Force Refresh
          </button>
            </div>
          </div>
        )}
        
        {loading && <div>Đang tải...</div>}
        {product && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-2xl">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-32 h-24 rounded-2xl overflow-hidden bg-gray-100">
                {product.images?.[0] && (
                  <img src={product.images[0]} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{product.title}</div>
                <div className="text-gray-700">{product.price.toLocaleString()} ₫/ngày</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-sm text-gray-600">Từ ngày</div>
                <div className="font-semibold text-gray-900">{start || '-'}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-sm text-gray-600">Đến ngày</div>
                <div className="font-semibold text-gray-900">{end || '-'}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                <div className="text-sm text-gray-600">Số ngày</div>
                <div className="font-semibold text-gray-900">{numDays}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200">
              <div className="text-gray-700">Tổng tiền</div>
              <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {(numDays * (product.price || 0)).toLocaleString()} ₫
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button 
                onClick={onCreateOrder} 
                disabled={kycStatus === 'none' || kycStatus === 'rejected'}
                className={`flex-1 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 ${
                  (kycStatus === 'approved' || kycStatus === 'verified' || kycStatus === 'pending')
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {(kycStatus === 'approved' || kycStatus === 'verified') ? 'Xác nhận đặt thuê' : 
                 kycStatus === 'pending' ? 'Đặt thuê (có thể bị từ chối)' : 
                 'Cần xác minh KYC'}
              </button>
              <button onClick={()=>navigate(-1)} className="px-6 py-4 rounded-2xl border border-blue-200 text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50">
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}