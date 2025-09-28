import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function About() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    satisfaction: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Animate stats
    const animateStats = () => {
      const targets = { users: 50000, products: 10000, orders: 25000, satisfaction: 98 }
      const duration = 2000
      const steps = 60
      const stepDuration = duration / steps
      
      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps
        
        setStats({
          users: Math.floor(targets.users * progress),
          products: Math.floor(targets.products * progress),
          orders: Math.floor(targets.orders * progress),
          satisfaction: Math.floor(targets.satisfaction * progress)
        })
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setStats(targets)
        }
      }, stepDuration)
    }
    
    const timer = setTimeout(animateStats, 500)
    return () => clearTimeout(timer)
  }, [])

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ'
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Vui lòng nhập nội dung tin nhắn'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
        </div>
        
        <div className="container text-center relative z-10">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Về chúng tôi
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-8">
              Nền tảng cho thuê thiết bị công nghệ hàng đầu Việt Nam, kết nối người cần thuê với người cho thuê một cách an toàn và tiện lợi.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-sm font-semibold">🏆 Top 1 Việt Nam</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-sm font-semibold">🛡️ 100% An toàn</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                <span className="text-sm font-semibold">⚡ 24/7 Hỗ trợ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: stats.users, suffix: '+', label: 'Người dùng', icon: '👥' },
              { number: stats.products, suffix: '+', label: 'Sản phẩm', icon: '📱' },
              { number: stats.orders, suffix: '+', label: 'Đơn hàng', icon: '📦' },
              { number: stats.satisfaction, suffix: '%', label: 'Hài lòng', icon: '⭐' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-6">
                🎯
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Chúng tôi cam kết mang đến trải nghiệm cho thuê thiết bị công nghệ an toàn, minh bạch và tiết kiệm chi phí cho mọi người dùng Việt Nam.
              </p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-6">
                👁️
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Trở thành nền tảng cho thuê thiết bị công nghệ số 1 Đông Nam Á, tạo ra một cộng đồng chia sẻ thiết bị bền vững và thân thiện.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-gray-600 text-xl">Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🛡️',
                title: 'An toàn & Tin cậy',
                desc: 'Xác minh người dùng, bảo vệ giao dịch và đảm bảo chất lượng thiết bị.'
              },
              {
                icon: '⚡',
                title: 'Nhanh chóng & Tiện lợi',
                desc: 'Quy trình đơn giản, tìm kiếm thông minh và hỗ trợ 24/7.'
              },
              {
                icon: '🤝',
                title: 'Minh bạch & Công bằng',
                desc: 'Giá cả rõ ràng, đánh giá chân thực và giải quyết tranh chấp công bằng.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Hành trình phát triển</h2>
            <p className="text-gray-600 text-xl">Những cột mốc quan trọng trong quá trình xây dựng nền tảng</p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            
            <div className="space-y-12">
              {[
                {
                  year: '2020',
                  title: 'Khởi tạo ý tưởng',
                  desc: 'Nhận thấy nhu cầu cho thuê thiết bị công nghệ ngày càng tăng, chúng tôi bắt đầu nghiên cứu và phát triển ý tưởng.',
                  icon: '💡',
                  side: 'left'
                },
                {
                  year: '2021',
                  title: 'Ra mắt MVP',
                  desc: 'Phiên bản đầu tiên của nền tảng được ra mắt với 100 sản phẩm và 500 người dùng đầu tiên.',
                  icon: '🚀',
                  side: 'right'
                },
                {
                  year: '2022',
                  title: 'Mở rộng quy mô',
                  desc: 'Đạt 10,000 người dùng và 1,000 sản phẩm. Ra mắt tính năng thanh toán trực tuyến và bảo hiểm.',
                  icon: '📈',
                  side: 'left'
                },
                {
                  year: '2023',
                  title: 'Công nghệ AI',
                  desc: 'Tích hợp AI để gợi ý sản phẩm thông minh và chatbot hỗ trợ khách hàng 24/7.',
                  icon: '🤖',
                  side: 'right'
                },
                {
                  year: '2024',
                  title: 'Lãnh đạo thị trường',
                  desc: 'Trở thành nền tảng cho thuê thiết bị công nghệ số 1 Việt Nam với 50,000+ người dùng.',
                  icon: '🏆',
                  side: 'left'
                }
              ].map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${milestone.side === 'left' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${milestone.side === 'left' ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl">
                          {milestone.icon}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{milestone.year}</div>
                          <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{milestone.desc}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Đội ngũ của chúng tôi</h2>
            <p className="text-gray-600 text-xl">Những con người tài năng đang xây dựng tương lai của nền tảng</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Nguyễn Minh Tuấn',
                role: 'CEO & Founder',
                desc: '15 năm kinh nghiệm trong lĩnh vực công nghệ và thương mại điện tử. Từng là CTO tại các startup thành công.',
                avatar: '👨‍💼',
                skills: ['Leadership', 'Strategy', 'Business Development']
              },
              {
                name: 'Trần Thị Lan Anh',
                role: 'CTO',
                desc: 'Chuyên gia về AI/ML và hệ thống phân tán, từng làm việc tại Google và Microsoft. Thạc sĩ Khoa học Máy tính.',
                avatar: '👩‍💻',
                skills: ['AI/ML', 'Cloud Architecture', 'System Design']
              },
              {
                name: 'Lê Văn Đức',
                role: 'Head of Product',
                desc: 'Chuyên gia UX/UI với hơn 10 năm kinh nghiệm thiết kế sản phẩm người dùng. Từng làm việc tại Facebook và Grab.',
                avatar: '👨‍🎨',
                skills: ['UX/UI Design', 'Product Strategy', 'User Research']
              }
            ].map((member, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl text-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  {member.avatar}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-600 leading-relaxed mb-6">{member.desc}</p>
                
                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {member.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Khách hàng nói gì về chúng tôi</h2>
            <p className="text-gray-600 text-xl">Những phản hồi chân thực từ cộng đồng người dùng</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Nguyễn Thị Mai',
                role: 'Sinh viên Đại học Bách Khoa',
                content: 'Nền tảng này đã giúp tôi tiết kiệm rất nhiều chi phí khi cần laptop cho dự án. Dịch vụ hỗ trợ rất tốt và thiết bị luôn đảm bảo chất lượng.',
                rating: 5,
                avatar: '👩‍🎓'
              },
              {
                name: 'Trần Văn Nam',
                role: 'Freelancer',
                content: 'Tôi thường xuyên thuê camera và thiết bị âm thanh cho các dự án. Quy trình đơn giản, giá cả hợp lý và đội ngũ hỗ trợ rất chuyên nghiệp.',
                rating: 5,
                avatar: '👨‍💼'
              },
              {
                name: 'Lê Thị Hương',
                role: 'Doanh nhân',
                content: 'Công ty tôi đã sử dụng dịch vụ cho thuê thiết bị văn phòng trong 2 năm qua. Rất hài lòng với chất lượng dịch vụ và sự tin cậy của nền tảng.',
                rating: 5,
                avatar: '👩‍💼'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                
                <p className="text-gray-600 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
            <p className="text-gray-600 text-xl">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                      📧
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <p className="text-gray-600">support@rentiva.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                      📱
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Hotline</p>
                      <p className="text-gray-600">+84 123 456 789</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                      📍
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Địa chỉ</p>
                      <p className="text-gray-600">123 Nguyễn Huệ, Q1, TP.HCM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white">
                      🕒
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Giờ làm việc</p>
                      <p className="text-gray-600">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Theo dõi chúng tôi</h3>
                <div className="flex gap-4">
                  {[
                    { icon: '📘', name: 'Facebook', color: 'from-blue-500 to-blue-600' },
                    { icon: '📷', name: 'Instagram', color: 'from-pink-500 to-purple-500' },
                    { icon: '🐦', name: 'Twitter', color: 'from-sky-500 to-blue-500' },
                    { icon: '💼', name: 'LinkedIn', color: 'from-blue-600 to-blue-700' }
                  ].map((social, index) => (
                    <a
                      key={index}
                      href="#"
                      className={`w-12 h-12 bg-gradient-to-r ${social.color} rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform duration-300`}
                      title={social.name}
                    >
                      <span className="text-lg">{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn</h3>
              
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-2xl text-green-700 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <span className="font-medium">Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                        formErrors.name 
                          ? 'border-red-300 focus:ring-red-400' 
                          : 'border-blue-200 focus:ring-blue-400'
                      }`}
                      placeholder="Nhập họ và tên"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                        formErrors.email 
                          ? 'border-red-300 focus:ring-red-400' 
                          : 'border-blue-200 focus:ring-blue-400'
                      }`}
                      placeholder="Nhập email"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ đề</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full border border-blue-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur-sm transition-all duration-300"
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="support">Hỗ trợ kỹ thuật</option>
                    <option value="feedback">Góp ý sản phẩm</option>
                    <option value="business">Hợp tác kinh doanh</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm transition-all duration-300 resize-none ${
                      formErrors.message 
                        ? 'border-red-300 focus:ring-red-400' 
                        : 'border-blue-200 focus:ring-blue-400'
                    }`}
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                  {formErrors.message && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      {formErrors.message}
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold rounded-2xl px-6 py-4 transition-all duration-300 transform shadow-lg hover:shadow-xl ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 hover:scale-105'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang gửi...</span>
                    </div>
                  ) : (
                    'Gửi tin nhắn'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
