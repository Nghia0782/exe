import { useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { api } from '../shared/api'
import { useUser } from '../shared/UserContext'
import { useToast } from '../shared/ToastContext'

export default function Login() {
  const { refresh } = useUser()
  const { notify } = useToast()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpMsg, setOtpMsg] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showLoginPwd, setShowLoginPwd] = useState(false)
  const [showRegisterPwd, setShowRegisterPwd] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const passwordStrength = useMemo(() => {
    const pwd = registerPassword
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    return Math.min(score, 4)
  }, [registerPassword])

  const formatVietnamPhone = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)} ${digits.slice(9)}`
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    setErrors({})
    try {
      if (activeTab === 'login') {
        const fieldErrors: { [k: string]: string } = {}
        if (!usernameOrEmail) fieldErrors.usernameOrEmail = 'Vui lòng nhập Email/SĐT'
        if (!password) fieldErrors.password = 'Vui lòng nhập Mật khẩu'
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length) return
      const res = await api.post('/auth/login', { usernameOrEmail, password })
        const user = res.data?.user
        const requiresOtp = res.data?.requiresOtp === true || user?.isVerified === false
        if (requiresOtp) {
          setIsOtpStep(true)
          setActiveTab('register')
          if (usernameOrEmail.includes('@')) setEmail(usernameOrEmail)
          setOtpMsg('Tài khoản của bạn chưa được xác minh. Vui lòng nhập mã OTP để hoàn tất.')
          return
        }
      const token = res.data?.token
      if (token) {
        localStorage.setItem('token', token)
        await refresh()
      }
      setMsg('Đăng nhập thành công')
      notify('Đăng nhập thành công', 'success')
        const redirectTo = (location.state as { from?: string })?.from || sessionStorage.getItem('post_login_redirect') || '/'
        sessionStorage.removeItem('post_login_redirect')
        navigate(redirectTo, { replace: true })
      } else {
        const pwd = registerPassword
        const strong = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)
        const fieldErrors: { [k: string]: string } = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!fullName) fieldErrors.fullName = 'Vui lòng nhập Họ và tên'
        if (!email) fieldErrors.email = 'Vui lòng nhập Email'
        else if (!emailRegex.test(email)) fieldErrors.email = 'Email không hợp lệ'
        if (!phone) fieldErrors.phone = 'Vui lòng nhập SĐT'
        if (!pwd) fieldErrors.registerPassword = 'Vui lòng nhập Mật khẩu'
        if (pwd && !strong) fieldErrors.registerPassword = '≥8 ký tự, có chữ hoa, số và ký tự đặc biệt'
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length) return
        // Backend expects: { username, password, email, phoneNumber, address }
        await api.post('/auth/register', {
          username: fullName,
          password: registerPassword,
          email,
          phoneNumber: phone.replace(/\s/g, ''),
          address: ''
        })
        setMsg('Đăng ký thành công! Mã OTP đã được gửi tới email/SĐT của bạn.')
        setIsOtpStep(true)
      }
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (activeTab === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại'))
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = () => {
    const fallback = window.location.pathname + window.location.search
    const from = (location.state as { from?: string })?.from || fallback
    sessionStorage.setItem('post_login_redirect', from)
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  const onVerifyOtp = async () => {
    try {
      setOtpMsg('')
      setOtpLoading(true)
      if (!otpCode) {
        setOtpMsg('Vui lòng nhập mã OTP')
        return
      }
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode })
      const ok = res.data?.success !== false
      setOtpMsg(ok ? 'Xác minh thành công. Đang đăng nhập...' : (res.data?.message || 'Xác minh thất bại'))
      if (ok) notify('Xác minh OTP thành công', 'success')
      if (ok) {
        try {
          // Ưu tiên đăng nhập bằng thông tin hiện có
          let loginEmailOrPhone = usernameOrEmail
          let loginPassword = password
          // Trường hợp người dùng vừa đăng ký
          if ((!loginEmailOrPhone || !loginPassword) && email && registerPassword) {
            loginEmailOrPhone = email
            loginPassword = registerPassword
          }
          if (loginEmailOrPhone && loginPassword) {
            const loginRes = await api.post('/auth/login', { usernameOrEmail: loginEmailOrPhone, password: loginPassword })
            const token = loginRes.data?.token
            if (token) {
              localStorage.setItem('token', token)
              await refresh()
              const redirectTo = (location.state as { from?: string })?.from || sessionStorage.getItem('post_login_redirect') || '/'
              sessionStorage.removeItem('post_login_redirect')
              notify('Đăng nhập tự động thành công', 'success')
              navigate(redirectTo, { replace: true })
              return
            }
          }
          // Fallback: quay về tab đăng nhập nếu không có đủ thông tin để auto login
          setActiveTab('login')
          setIsOtpStep(false)
        } catch {
          // Nếu auto login lỗi, quay về tab đăng nhập
          setActiveTab('login')
          setIsOtpStep(false)
          setMsg('OTP hợp lệ. Vui lòng đăng nhập lại.')
        }
      }
    } catch (err: unknown) {
      setOtpMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Xác minh thất bại')
    } finally {
      setOtpLoading(false)
    }
  }

  const onResendOtp = async () => {
    try {
      setOtpMsg('')
      setResendLoading(true)
      await api.post('/auth/resend-otp', { email })
      setOtpMsg('Đã gửi lại mã OTP.')
    } catch (err: unknown) {
      setOtpMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gửi lại OTP thất bại')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 overflow-hidden">
      {/* Enhanced decorative blobs with animations */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-400/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-cyan-400/30 blur-3xl animate-bounce" style={{animationDuration: '3s'}} />
        <div className="absolute -right-24 top-1/3 w-96 h-96 rounded-full bg-sky-400/30 blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-400/20 blur-3xl animate-spin" style={{animationDuration: '20s'}} />
      </div>
      <div className="w-full max-w-5xl">
        {/* gradient border wrapper */}
        <div className="p-[1.2rem] rounded-[2rem] bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400 shadow-[0_20px_60px_-20px_rgba(30,64,175,0.45)] max-w-[1000px] mx-auto hover:shadow-[0_25px_80px_-20px_rgba(30,64,175,0.6)] transition-all duration-500">
          <div className="grid md:grid-cols-2 bg-white/95 backdrop-blur rounded-3xl border border-white/60 shadow-2xl overflow-hidden hover:bg-white/98 transition-all duration-300">
            <div className="hidden md:block p-10 lg:p-12 bg-gradient-to-br from-sky-50 to-white">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-sky-600 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">Let's Get Started</h1>
            <p className="text-gray-600 max-w-md leading-relaxed mb-6">
              Nền tảng cho thuê thiết bị công nghệ an toàn – nhanh chóng – minh bạch.
            </p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">✓</span>
                <span><b>Thanh toán đảm bảo</b> bằng ví ký quỹ – hoàn tiền nếu giao dịch thất bại</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">✓</span>
                <span><b>Bảo hiểm hư hỏng</b> tùy chọn cho sản phẩm giá trị cao</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">✓</span>
                <span><b>Hỗ trợ 24/7</b> qua chat và hotline; xác minh người dùng nhiều lớp</span>
              </li>
            </ul>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">★★★★★</span>
                <span className="text-sm text-gray-600">4.9/5 từ 2,5k+ lượt đánh giá</span>
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-500">Đối tác: <span className="font-semibold text-gray-700">VNPay</span>, <span className="font-semibold text-gray-700">MoMo</span>, <span className="font-semibold text-gray-700">ZaloPay</span></div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 bg-white/90 relative flex justify-center">
              <div className="w-full max-w-md">
            <div className="mb-6 inline-flex rounded-full bg-white p-1 w-full border border-sky-100 shadow-inner hover:shadow-md transition-all duration-300">
              <button onClick={() => setActiveTab('login')} className={`${activeTab === 'login' ? 'bg-gradient-to-r from-sky-500 via-cyan-500 to-fuchsia-500 text-white shadow-lg transform scale-105' : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'} flex-1 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out`}>Sign in</button>
              <button onClick={() => setActiveTab('register')} className={`${activeTab === 'register' ? 'bg-gradient-to-r from-sky-500 via-cyan-500 to-fuchsia-500 text-white shadow-lg transform scale-105' : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'} flex-1 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out`}>Sign up</button>
            </div>

            {/* Enhanced Promo banner */}
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white px-4 py-3 shadow-lg flex items-center justify-between hover:shadow-xl transition-all duration-300 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 px-2 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide animate-bounce">Hot</span>
                <p className="text-sm font-semibold">Ưu đãi 20% cho đơn thuê đầu tiên hôm nay</p>
              </div>
              <span className="text-xs font-bold bg-white/20 rounded-md px-2 py-1 hover:bg-white/30 transition-colors">Mã: RENT20</span>
            </div>

            {/* Enhanced Trust & benefits chips */}
            <div className="mb-6 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-sky-100 bg-sky-50 text-sky-700 text-xs font-medium px-3 py-2 flex items-center gap-2 hover:bg-sky-100 hover:border-sky-200 transition-all duration-300 cursor-pointer">
                <span className="animate-pulse">🛡️</span> <span>Thanh toán an toàn</span>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-2 flex items-center gap-2 hover:bg-emerald-100 hover:border-emerald-200 transition-all duration-300 cursor-pointer">
                <span className="animate-bounce">✅</span> <span>Tài khoản xác minh</span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-2 flex items-center gap-2 hover:bg-amber-100 hover:border-amber-200 transition-all duration-300 cursor-pointer">
                <span className="animate-pulse">⚡</span> <span>Thuê nhanh 5 phút</span>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-2 flex items-center gap-2 hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-300 cursor-pointer">
                <span className="animate-bounce">📦</span> <span>Đặt cọc linh hoạt</span>
              </div>
            </div>

            {!isOtpStep ? (
              <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6">
                <div>
                  {activeTab === 'login' ? (
                    <>
                      <label className="block text-sm font-semibold text-sky-700 mb-2">Email hoặc Số điện thoại</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-sky-400">✉️</span>
                        <input type="text" className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 pl-10 pr-4 shadow-sm transition ${errors.usernameOrEmail ? 'border-red-400' : ''}`} placeholder="Nhập email hoặc số điện thoại" value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} />
                      </div>
                      {errors.usernameOrEmail && <p className="mt-1 text-xs text-red-500">{errors.usernameOrEmail}</p>}

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-sky-700 mb-2">Mật khẩu</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-sky-400">🔒</span>
                          <input type={showLoginPwd ? 'text' : 'password'} className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 pl-10 pr-10 shadow-sm transition ${errors.password ? 'border-red-400' : ''}`} placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} />
                          <button type="button" onClick={()=>setShowLoginPwd(v=>!v)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">{showLoginPwd ? '🙈' : '👁️'}</button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-gray-700 gap-4">
                        <label className="flex items-center">
                          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" />
                          <span className="ml-2 text-sm">Ghi nhớ đăng nhập</span>
                        </label>
                        <Link to="/forgot-password" className="text-sm text-sky-600 hover:text-sky-700">Quên mật khẩu?</Link>
                      </div>

                      <button type="submit" disabled={loading} className="mt-4 w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-fuchsia-500 hover:from-sky-500 hover:via-cyan-400 hover:to-fuchsia-400 text-white py-3.5 rounded-2xl font-bold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transform">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>

                      <p className="mt-3 text-xs text-gray-600 text-center">Chưa có tài khoản? <button type="button" onClick={() => setActiveTab('register')} className="text-sky-600 hover:text-sky-700 font-semibold">Tạo tài khoản để cho thuê/thuê ngay</button></p>
                      
                      {/* Quick Access Buttons */}
                      <div className="mt-4 space-y-2">
                        <Link to="/products" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          🛍️ Xem sản phẩm ngay
                        </Link>
                        <Link to="/dashboard" className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          📊 Dashboard quản lý
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-semibold text-sky-700 mb-2">Họ và tên</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-sky-400">👤</span>
                        <input type="text" className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 pl-10 pr-4 shadow-sm transition ${errors.fullName ? 'border-red-400' : ''}`} placeholder="Nhập họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} />
                      </div>
                      {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-sky-700 mb-2">Địa chỉ Email</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-sky-400">✉️</span>
                          <input type="email" className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 pl-10 pr-4 shadow-sm transition ${errors.email ? 'border-red-400' : ''}`} placeholder="Nhập địa chỉ email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-sky-700 mb-2">Số điện thoại</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-sky-400">📱</span>
                          <input type="tel" className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 pl-10 pr-4 shadow-sm transition ${errors.phone ? 'border-red-400' : ''}`} placeholder="Nhập số điện thoại" value={phone} onChange={e => setPhone(formatVietnamPhone(e.target.value))} />
                        </div>
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-800 mb-2">Mật khẩu</label>
                        <div className="relative">
                          <input type={showRegisterPwd ? 'text' : 'password'} className={`w-full bg-white text-gray-900 placeholder-slate-400 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 py-3 px-4 pr-12 shadow-sm transition ${errors.registerPassword ? 'border-red-400' : ''}`} placeholder="Tạo mật khẩu mạnh" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} />
                          <button type="button" onClick={()=>setShowRegisterPwd(v=>!v)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">{showRegisterPwd ? '🙈' : '👁️'}</button>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`${passwordStrength === 0 ? 'w-0' : passwordStrength === 1 ? 'w-1/4 bg-red-500' : passwordStrength === 2 ? 'w-2/4 bg-orange-400' : passwordStrength === 3 ? 'w-3/4 bg-yellow-400' : 'w-full bg-green-500'} h-full transition-all`} />
                        </div>
                        {errors.registerPassword && <p className="mt-1 text-xs text-red-500">{errors.registerPassword}</p>}
                      </div>

                      <label className="mt-6 flex items-start text-gray-700">
                        <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded mt-1" />
                        <span className="ml-2 text-sm">Tôi đồng ý với <Link to="/terms" className="text-sky-600 hover:text-sky-700 underline">Điều khoản Dịch vụ</Link> và <Link to="/privacy" className="text-sky-600 hover:text-sky-700 underline">Chính sách Bảo mật</Link></span>
                      </label>

                      <button type="submit" disabled={loading || !agreeTerms} className="mt-4 w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-fuchsia-500 hover:via-cyan-400 text-white py-3.5 rounded-2xl font-bold tracking-wide transition-all shadow-lg hover:shadow-xl disabled:opacity-50">{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>

                      <p className="mt-3 text-sm text-gray-600 text-center">Đã có tài khoản? <button type="button" onClick={() => setActiveTab('login')} className="text-sky-600 hover:text-sky-700 font-semibold">Sign in</button></p>
                      
                      {/* Quick Access Buttons for Register */}
                      <div className="mt-4 space-y-2">
                        <Link to="/products" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          🛍️ Xem sản phẩm ngay
                        </Link>
                        <Link to="/dashboard" className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          📊 Dashboard quản lý
                        </Link>
                      </div>
                    </>
                  )}

                  {msg && (
                    <div className={`mt-3 text-sm p-3 rounded-xl ${msg.includes('thành công') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>
                  )}
                </div>

              <div className="mt-6">
                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-sky-100" />
                  <span className="px-3 text-sky-600 text-xs">Hoặc tiếp tục với</span>
                  <div className="flex-1 h-px bg-sky-100" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={onGoogle} type="button" className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-white text-[#4285F4] border border-sky-100 shadow-sm hover:bg-sky-50 text-sm font-semibold">
                    <span>G</span><span className="hidden sm:inline">Google</span>
                  </button>
                  <button type="button" className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-[#1877F2] text-white shadow-sm hover:brightness-110 text-sm font-semibold">
                    <span>f</span><span className="hidden sm:inline">Facebook</span>
                  </button>
                  <button type="button" className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-black text-white shadow-sm hover:brightness-110 text-sm font-semibold">
                    <span></span><span className="hidden sm:inline">Apple</span>
                  </button>
                </div>
              </div>
      </form>
            ) : (
              <div className="space-y-6">
                <h3 className="text-gray-900 text-xl font-bold">Xác minh OTP</h3>
                <input className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 py-3 px-4" placeholder="Nhập mã OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                {otpMsg && (
                  <div className={`text-sm p-3 rounded-xl ${otpMsg.includes('thành công') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>{otpMsg}</div>
                )}
                <div className="flex gap-3">
                  <button onClick={onVerifyOtp} disabled={otpLoading} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">Xác minh</button>
                  <button onClick={onResendOtp} disabled={resendLoading} className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-sky-50 disabled:opacity-50">{resendLoading ? 'Đang gửi...' : 'Gửi lại mã'}</button>
                </div>
                <p className="text-sm text-gray-600 text-center">Sai email? <button type="button" onClick={() => setIsOtpStep(false)} className="text-sky-600 hover:text-sky-700 font-semibold">Quay lại đăng ký</button></p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
