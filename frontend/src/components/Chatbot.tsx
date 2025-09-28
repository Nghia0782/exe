import { useEffect, useRef, useState } from 'react'
import { api } from '../shared/api'

type Msg = { role: 'user' | 'assistant'; content: string; timestamp?: Date; state?: string; context?: Record<string, unknown> }

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [, setConversationState] = useState<Record<string, unknown> | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Xin chào! Mình có thể tư vấn sản phẩm, kiểm tra đơn (dán mã), hoặc hướng dẫn thanh toán.',
    timestamp: new Date()
  }])
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    
    const userMsg: Msg = { 
      role: 'user', 
      content: text, 
      timestamp: new Date() 
    }
    setMsgs(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    
    try {
      const res = await api.post('/ai/chat', { 
        message: text,
        sessionId: sessionId
      })
      
      const reply = res.data?.reply || 'Xin lỗi, hiện không trả lời được.'
      const assistantMsg: Msg = { 
        role: 'assistant', 
        content: reply, 
        timestamp: new Date(),
        state: res.data?.state,
        context: res.data?.context
      }
      
      setMsgs(m => [...m, assistantMsg])
      setConversationState(res.data?.context)
      
      // Log conversation state for debugging
      if (import.meta.env.MODE === 'development') {
        console.debug('Conversation state updated:', res.data?.context)
      }
      
      // Tự động gửi follow-up nếu cần
      if (res.data?.state === 'waiting_response' && res.data?.context?.pendingActions?.length > 0) {
        setTimeout(() => {
          setMsgs(m => [...m, {
            role: 'assistant',
            content: 'Bạn có muốn tôi hướng dẫn thêm về quy trình thuê sản phẩm không?',
            timestamp: new Date()
          }])
        }, 3000)
      }
      
    } catch (error) {
      console.error('Chat error:', error)
      setMsgs(m => [...m, { 
        role: 'assistant', 
        content: 'Có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-[9998] px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
      >
        {open ? 'Đóng trợ lý' : 'Chat trợ lý'}
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 w-80 max-h-[70vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[9999]">
          <div className="px-4 py-3 font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">Trợ lý TechRental</div>
          <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '48vh' }}>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập câu hỏi..."
            />
            <button onClick={send} disabled={loading} className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  )
}


