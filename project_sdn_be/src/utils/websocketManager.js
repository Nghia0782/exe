import { WebSocketServer } from 'ws'
import { ConversationStateMachine } from './conversationState.js'

class WebSocketManager {
  constructor() {
    this.wss = null
    this.clients = new Map() // sessionId -> WebSocket
    this.conversationStates = new Map() // sessionId -> ConversationStateMachine
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server })
    
    this.wss.on('connection', (ws, req) => {
      const sessionId = req.url.split('sessionId=')[1] || `session_${Date.now()}`
      
      console.log(`WebSocket client connected: ${sessionId}`)
      
      // Lưu client
      this.clients.set(sessionId, ws)
      
      // Khởi tạo conversation state
      if (!this.conversationStates.has(sessionId)) {
        this.conversationStates.set(sessionId, new ConversationStateMachine())
      }
      
      // Gửi welcome message
      this.sendMessage(sessionId, {
        type: 'welcome',
        message: 'Kết nối thành công! Tôi có thể giúp gì cho bạn?',
        timestamp: new Date()
      })
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(sessionId, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          this.sendMessage(sessionId, {
            type: 'error',
            message: 'Lỗi xử lý tin nhắn',
            timestamp: new Date()
          })
        }
      })
      
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${sessionId}`)
        this.clients.delete(sessionId)
        // Giữ conversation state để có thể khôi phục sau
      })
      
      ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error)
        this.clients.delete(sessionId)
      })
    })
  }

  handleMessage(sessionId, message) {
    const stateMachine = this.conversationStates.get(sessionId)
    if (!stateMachine) return

    const { type, content } = message
    
    switch (type) {
      case 'chat':
        this.handleChatMessage(sessionId, content)
        break
      case 'ping':
        this.sendMessage(sessionId, { type: 'pong', timestamp: new Date() })
        break
      case 'reset':
        stateMachine.reset()
        this.sendMessage(sessionId, {
          type: 'reset_confirmed',
          message: 'Đã reset cuộc hội thoại',
          timestamp: new Date()
        })
        break
      default:
        this.sendMessage(sessionId, {
          type: 'error',
          message: 'Loại tin nhắn không được hỗ trợ',
          timestamp: new Date()
        })
    }
  }

  async handleChatMessage(sessionId, message) {
    const stateMachine = this.conversationStates.get(sessionId)
    if (!stateMachine) return

    try {
      // Cập nhật state
      const currentState = stateMachine.determineNextState(message)
      const stateInfo = stateMachine.getCurrentState()

      // Gửi typing indicator
      this.sendMessage(sessionId, {
        type: 'typing',
        timestamp: new Date()
      })

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Gửi response
      this.sendMessage(sessionId, {
        type: 'response',
        message: `Đã xử lý: "${message}" trong trạng thái ${currentState}`,
        state: currentState,
        context: stateInfo.context,
        timestamp: new Date()
      })

      // Gửi follow-up nếu cần
      if (stateInfo.suggestedResponse.followUp) {
        setTimeout(() => {
          this.sendMessage(sessionId, {
            type: 'follow_up',
            message: stateInfo.suggestedResponse.followUp,
            timestamp: new Date()
          })
        }, 2000)
      }

    } catch (error) {
      console.error('Error handling chat message:', error)
      this.sendMessage(sessionId, {
        type: 'error',
        message: 'Có lỗi xảy ra khi xử lý tin nhắn',
        timestamp: new Date()
      })
    }
  }

  sendMessage(sessionId, message) {
    const client = this.clients.get(sessionId)
    if (client && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  broadcast(message, excludeSessionId = null) {
    this.clients.forEach((client, sessionId) => {
      if (sessionId !== excludeSessionId && client.readyState === client.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  getConnectedClients() {
    return Array.from(this.clients.keys())
  }

  getConversationState(sessionId) {
    return this.conversationStates.get(sessionId)
  }
}

export default new WebSocketManager()
