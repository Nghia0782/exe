// Conversation State Machine để quản lý luồng hội thoại
export class ConversationStateMachine {
  constructor() {
    this.states = {
      GREETING: 'greeting',
      PRODUCT_INQUIRY: 'product_inquiry',
      ORDER_CHECK: 'order_check',
      PAYMENT_GUIDE: 'payment_guide',
      SPECIFIC_PRODUCT: 'specific_product',
      FOLLOW_UP: 'follow_up',
      WAITING_RESPONSE: 'waiting_response',
      END: 'end'
    }
    
    this.currentState = this.states.GREETING
    this.context = {
      lastProductCategory: null,
      lastProductId: null,
      lastOrderId: null,
      userPreferences: {},
      conversationHistory: [],
      pendingActions: []
    }
  }

  // Xác định trạng thái tiếp theo dựa trên message
  determineNextState(message, userData = {}) {
    const msg = message.toLowerCase().trim()
    
    // Cập nhật lịch sử hội thoại
    this.context.conversationHistory.push({
      message: msg,
      timestamp: new Date(),
      state: this.currentState
    })

    // Giới hạn lịch sử để tránh memory leak
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10)
    }

    // Logic chuyển trạng thái
    switch (this.currentState) {
      case this.states.GREETING:
        if (this.isProductInquiry(msg)) {
          this.currentState = this.states.PRODUCT_INQUIRY
          this.context.lastProductCategory = this.extractProductCategory(msg)
        } else if (this.isOrderCheck(msg)) {
          this.currentState = this.states.ORDER_CHECK
          this.context.lastOrderId = this.extractOrderId(msg)
        } else if (this.isPaymentGuide(msg)) {
          this.currentState = this.states.PAYMENT_GUIDE
        } else {
          this.currentState = this.states.FOLLOW_UP
        }
        break

      case this.states.PRODUCT_INQUIRY:
        if (this.isSpecificProduct(msg)) {
          this.currentState = this.states.SPECIFIC_PRODUCT
          this.context.lastProductId = this.extractProductId(msg)
        } else if (this.isProductInquiry(msg)) {
          this.context.lastProductCategory = this.extractProductCategory(msg)
        } else {
          this.currentState = this.states.FOLLOW_UP
        }
        break

      case this.states.SPECIFIC_PRODUCT:
        if (this.isRentalRequest(msg)) {
          this.currentState = this.states.WAITING_RESPONSE
          this.context.pendingActions.push('rental_process')
        } else {
          this.currentState = this.states.FOLLOW_UP
        }
        break

      default:
        if (this.isProductInquiry(msg)) {
          this.currentState = this.states.PRODUCT_INQUIRY
          this.context.lastProductCategory = this.extractProductCategory(msg)
        } else if (this.isOrderCheck(msg)) {
          this.currentState = this.states.ORDER_CHECK
          this.context.lastOrderId = this.extractOrderId(msg)
        } else {
          this.currentState = this.states.FOLLOW_UP
        }
    }

    return this.currentState
  }

  // Kiểm tra loại message
  isProductInquiry(msg) {
    const productKeywords = ['tư vấn', 'máy ảnh', 'laptop', 'điện thoại', 'camera', 'lens', 'microphone', 'headphone', 'speaker', 'tablet', 'ipad', 'macbook', 'dell', 'asus', 'hp']
    return productKeywords.some(keyword => msg.includes(keyword))
  }

  isOrderCheck(msg) {
    return msg.includes('đơn') || msg.includes('order') || /[a-f0-9]{24}/i.test(msg)
  }

  isPaymentGuide(msg) {
    return msg.includes('thanh toán') || msg.includes('vnpay') || msg.includes('chuyển khoản') || msg.includes('payment')
  }

  isSpecificProduct(msg) {
    const brands = ['canon', 'sony', 'nikon', 'fujifilm', 'panasonic', 'apple', 'samsung', 'dell', 'hp', 'asus']
    return brands.some(brand => msg.includes(brand))
  }

  isRentalRequest(msg) {
    return msg.includes('thuê') || msg.includes('rent') || msg.includes('muốn') || msg.includes('cần')
  }

  // Trích xuất thông tin từ message
  extractProductCategory(msg) {
    const categories = {
      'máy ảnh': 'camera',
      'camera': 'camera',
      'laptop': 'laptop',
      'điện thoại': 'phone',
      'phone': 'phone',
      'smartphone': 'phone',
      'microphone': 'audio',
      'headphone': 'audio',
      'speaker': 'audio',
      'tablet': 'tablet',
      'ipad': 'tablet'
    }
    
    for (const [keyword, category] of Object.entries(categories)) {
      if (msg.includes(keyword)) return category
    }
    return null
  }

  extractOrderId(msg) {
    const match = msg.match(/[a-f0-9]{24}/i)
    return match ? match[0] : null
  }

  extractProductId(msg) {
    // Logic để trích xuất product ID từ message
    // Có thể dựa vào context hoặc pattern matching
    return null
  }

  // Lấy gợi ý phản hồi dựa trên trạng thái hiện tại
  getSuggestedResponse() {
    switch (this.currentState) {
      case this.states.PRODUCT_INQUIRY:
        return {
          type: 'product_suggestions',
          category: this.context.lastProductCategory,
          followUp: 'Bạn muốn thuê sản phẩm nào? Hoặc cần tư vấn thêm về sản phẩm cụ thể?'
        }

      case this.states.SPECIFIC_PRODUCT:
        return {
          type: 'specific_product_info',
          productId: this.context.lastProductId,
          followUp: 'Bạn có muốn thuê sản phẩm này không? Tôi có thể hướng dẫn bạn đặt hàng.'
        }

      case this.states.ORDER_CHECK:
        return {
          type: 'order_status',
          orderId: this.context.lastOrderId,
          followUp: 'Bạn có cần hỗ trợ gì thêm về đơn hàng này không?'
        }

      case this.states.PAYMENT_GUIDE:
        return {
          type: 'payment_instructions',
          followUp: 'Bạn có câu hỏi gì khác về thanh toán không?'
        }

      case this.states.FOLLOW_UP:
        return {
          type: 'general_help',
          followUp: 'Tôi có thể giúp bạn: tư vấn sản phẩm, kiểm tra đơn hàng, hướng dẫn thanh toán. Bạn cần gì?'
        }

      case this.states.WAITING_RESPONSE:
        return {
          type: 'waiting_for_confirmation',
          pendingActions: this.context.pendingActions,
          followUp: 'Tôi đang chờ phản hồi từ bạn. Bạn có muốn tiếp tục không?'
        }

      default:
        return {
          type: 'greeting',
          followUp: 'Xin chào! Tôi có thể giúp gì cho bạn?'
        }
    }
  }

  // Reset trạng thái
  reset() {
    this.currentState = this.states.GREETING
    this.context = {
      lastProductCategory: null,
      lastProductId: null,
      lastOrderId: null,
      userPreferences: {},
      conversationHistory: [],
      pendingActions: []
    }
  }

  // Lấy thông tin trạng thái hiện tại
  getCurrentState() {
    return {
      state: this.currentState,
      context: this.context,
      suggestedResponse: this.getSuggestedResponse()
    }
  }
}
