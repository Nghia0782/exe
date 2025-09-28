import ProductDetail from '../models/ProductDetail.js'
import CategoryProduct from '../models/CategoryProduct.js'
import Order from '../models/Order.js'
import { ConversationStateMachine } from '../utils/conversationState.js'

// Lưu trữ state machine cho mỗi session
const conversationStates = new Map()

// Optional OpenAI usage if API key provided
async function callOpenAI(prompt) {
  try {
    if (!process.env.OPENAI_API_KEY) return null
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý tư vấn cho thuê thiết bị (máy ảnh, ống kính, laptop...). Hãy trả lời ngắn gọn, rõ ràng, sử dụng tiếng Việt.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    })
    return res.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

function extractOrderId(text) {
  const m = text.match(/[a-f0-9]{24}/i)
  return m ? m[0] : null
}

export async function chatController(req, res) {
  try {
    const message = (req.body?.message || '').toString().trim()
    const sessionId = req.body?.sessionId || req.ip || 'default'
    
    if (!message) return res.status(400).json({ success: false, message: 'Thiếu message' })

    // Lấy hoặc tạo state machine cho session
    if (!conversationStates.has(sessionId)) {
      conversationStates.set(sessionId, new ConversationStateMachine())
    }
    
    const stateMachine = conversationStates.get(sessionId)
    const currentState = stateMachine.determineNextState(message)
    const stateInfo = stateMachine.getCurrentState()

    // Xử lý dựa trên state machine
    let response = null
    
    // Intent: kiểm tra đơn hàng
    if (currentState === 'order_check' || message.includes('đơn') || message.includes('order')) {
      const id = extractOrderId(message) || stateInfo.context.lastOrderId
      if (id) {
        const order = await Order.findById(id).lean()
        if (!order) {
          response = `Không tìm thấy đơn hàng với mã ${id}.`
        } else {
          response = `Đơn ${id}: trạng thái=${order.status}, thanh toán=${order.paymentStatus}, đặt cọc=${order.depositStatus}, tổng tiền=${order.totalPrice?.toLocaleString('vi-VN')}₫.`
        }
        response += `\n\n${stateInfo.suggestedResponse.followUp}`
        return res.json({ success: true, reply: response, state: currentState, context: stateInfo.context })
      }
    }

    // Intent: hướng dẫn thanh toán
    if (currentState === 'payment_guide' || message.includes('thanh toán') || message.includes('vnpay') || message.includes('chuyển khoản')) {
      response = 'Hướng dẫn thanh toán: 1) Vào chi tiết đơn hàng, nhấn "Thanh toán" để tạo VNPay URL; 2) Hoặc dùng chuyển khoản ngân hàng qua mã QR tại trang thanh toán (endpoint: /api/orders/:orderId/payment-qr). Sau khi thanh toán thành công, hệ thống sẽ cập nhật đặt cọc/đơn tự động.'
      response += `\n\n${stateInfo.suggestedResponse.followUp}`
      return res.json({ success: true, reply: response, state: currentState, context: stateInfo.context })
    }

    // Intent: tư vấn sản phẩm theo danh mục/từ khóa chính
    if (currentState === 'product_inquiry' || currentState === 'specific_product') {
      const categoryKeywords = ['máy ảnh', 'ống kính', 'laptop', 'máy quay', 'phụ kiện', 'âm thanh', 'điện thoại', 'phone', 'smartphone', 'camera', 'lens', 'microphone', 'headphone', 'speaker', 'tablet', 'ipad', 'macbook', 'dell', 'asus', 'hp']
      const found = categoryKeywords.find(k => message.toLowerCase().includes(k))
      
      if (found) {
        // Tìm theo category trước
        const cat = await CategoryProduct.findOne({ name: new RegExp(found, 'i') }).lean()
        let q = cat ? { category: cat._id } : {}
        
        // Nếu không tìm thấy category, tìm theo tên sản phẩm
        if (!cat) {
          q = { title: new RegExp(found, 'i') }
        }
        
        const products = await ProductDetail.find(q).sort({ isHotProduct: -1, soldCount: -1 }).limit(5).select('title price images shortDetails').lean()
        
        if (products.length === 0) {
          response = `Hiện chưa có sản phẩm phù hợp cho "${found}". Bạn có thể thử tìm kiếm sản phẩm khác hoặc xem danh sách sản phẩm đầy đủ.`
        } else {
          const lines = products.map(p => `- ${p.title} • ${p.price?.toLocaleString('vi-VN')}₫/ngày`)
          response = `Gợi ý ${found}:\n` + lines.join('\n')
        }
        
        response += `\n\n${stateInfo.suggestedResponse.followUp}`
        return res.json({ 
          success: true, 
          reply: response, 
          products: products.length > 0 ? products : null,
          state: currentState, 
          context: stateInfo.context 
        })
      }
    }

    // Fallback: thử OpenAI với context
    const contextPrompt = `Ngữ cảnh hội thoại: ${JSON.stringify(stateInfo.context.conversationHistory.slice(-3))}
Trạng thái hiện tại: ${currentState}
Câu hỏi: ${message}

Hãy trả lời tự nhiên và phù hợp với ngữ cảnh. Nếu là câu hỏi chung, hãy hướng dẫn về dịch vụ thuê thiết bị.`
    
    const ai = await callOpenAI(contextPrompt)
    if (ai) {
      response = ai + `\n\n${stateInfo.suggestedResponse.followUp}`
      return res.json({ success: true, reply: response, state: currentState, context: stateInfo.context })
    }

    // Fallback cuối cùng
    response = stateInfo.suggestedResponse.followUp || 'Mình có thể giúp: tư vấn sản phẩm (vd: "tư vấn máy ảnh"), kiểm tra đơn (dán mã đơn), hướng dẫn thanh toán (VNPay/QR).'
    return res.json({ success: true, reply: response, state: currentState, context: stateInfo.context })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}


