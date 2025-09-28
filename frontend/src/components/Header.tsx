import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '../shared/UserContext'
import { Input } from './ui/input'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { user, logout, refresh } = useUser()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Giỏ hàng mặc định trống; chỉ hiển thị khi người dùng thêm sản phẩm
  const cartItems: Array<{ id: string|number; name: string; price: number; days: number; image?: string }> = []
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.days), 0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    // Chống rung: dùng hysteresis + requestAnimationFrame
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY || 0
        // Hysteresis: cần >20px mới bật, <5px mới tắt để tránh nhấp nháy
        setHasScrolled((prev) => (prev ? y > 5 : y > 20))
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header className={`sticky top-0 z-20 transition-all duration-300 border-b min-h-[72px] [backface-visibility:hidden] will-change-[background,transform,filter] transform-gpu ${hasScrolled ? 'bg-white/95 backdrop-blur-md border-gray-200 shadow-lg' : 'bg-gradient-to-b from-slate-900/70 to-transparent backdrop-blur-sm border-transparent'}`}>
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              R
            </div>
            <span className={`text-2xl font-bold transition-colors duration-300 ${hasScrolled ? 'text-gray-900' : 'text-white'}`}>
              Rentiva
            </span>
          </Link>
          
          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`transition-colors font-medium ${hasScrolled ? (location.pathname==='/' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600') : (location.pathname==='/' ? 'text-white' : 'text-white/80 hover:text-white')}`}>
              Trang chủ
            </Link>
            <Link to="/products" className={`transition-colors font-medium ${hasScrolled ? (location.pathname.startsWith('/products') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600') : (location.pathname.startsWith('/products') ? 'text-white' : 'text-white/80 hover:text-white')}`}>
              Thiết bị
            </Link>
            <Link to="/about" className={`transition-colors font-medium ${hasScrolled ? (location.pathname.startsWith('/about') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600') : (location.pathname.startsWith('/about') ? 'text-white' : 'text-white/80 hover:text-white')}`}>
              Về chúng tôi
            </Link>
            {user?.roles?.includes('admin') && (
              <Link to="/admin" className={`transition-colors font-semibold ${hasScrolled ? (location.pathname.startsWith('/admin') ? 'text-yellow-600' : 'text-yellow-700 hover:text-yellow-600') : 'text-yellow-200 hover:text-white'}`}>
                Admin
              </Link>
            )}
          </nav>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar - Only show on desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thiết bị..."
                  className={`w-64 transition-all duration-300 ${hasScrolled ? 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60'}`}
                />
                <button type="submit" className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${hasScrolled ? 'text-gray-500 hover:text-gray-700' : 'text-white/60 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              </div>
            </form>
            
            {/* Cart */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform relative ${hasScrolled ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                </svg>
                Giỏ hàng
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
              
              {/* Cart Dropdown */}
              {isCartOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Giỏ hàng</h3>
                      <button  
                        onClick={() => setIsCartOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                          </svg>
                        </div>
                        <p>Giỏ hàng trống</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {cartItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs">📦</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-600">{item.days} ngày × {item.price.toLocaleString()} ₫</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 text-sm">{(item.price * item.days).toLocaleString()} ₫</p>
                                <button className="text-red-500 hover:text-red-700 text-xs">Xóa</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-900">Tổng cộng:</span>
                            <span className="font-bold text-lg text-blue-600">{cartTotal.toLocaleString()} ₫</span>
                          </div>
                          <Link 
                            to="/checkout" 
                            onClick={() => setIsCartOpen(false)}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-xl py-3 text-center transition-all duration-300 hover:scale-105 transform"
                          >
                            Thanh toán
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Auth Buttons */}
            {!user?.name ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={`px-4 py-2 transition-colors font-medium ${hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(v => !v)} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold">
                    {user.name?.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 max-w-[160px] truncate">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                    <Link to="/profile" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">👤 Hồ sơ</Link>
                    <Link to="/orders" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">🧾 Đơn hàng</Link>
                    {user?.roles?.includes('admin') ? (
                      <>
                        <Link to="/dashboard" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">📊 Dashboard</Link>
                        <Link to="/admin" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">🛠️ Admin</Link>
                        <Link to="/admin/orders" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">📋 Quản lý Đơn hàng</Link>
                        <Link to="/admin/deposits" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">💰 Quản lý Đặt cọc</Link>
                        <Link to="/admin/products" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">🛍️ Quản lý Sản phẩm</Link>
                        <Link to="/admin/units" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">📦 Quản lý Units</Link>
                      </>
                    ) : (
                      <Link to="/user-dashboard" onClick={()=>setIsUserMenuOpen(false)} className="block px-4 py-3 hover:bg-blue-50">🏠 Trang cá nhân</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600">🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile menu button - Only show on mobile */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
            >
              <svg className={`w-6 h-6 ${hasScrolled ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link>
              <Link to="/products" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Thiết bị</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Về chúng tôi</Link>
              {user?.roles?.includes('admin') && (
                <Link to="/admin" className="text-gray-700 hover:text-yellow-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Admin</Link>
              )}
              <Link to="/checkout" className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Giỏ hàng</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}


