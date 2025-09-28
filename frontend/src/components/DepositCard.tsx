import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'

interface DepositCardProps {
  order: {
    _id: string
    totalPrice: number
    depositAmount: number
    depositStatus: string
    depositRequired: boolean
    status: string
    createdAt: string
  }
  onDepositClick: (orderId: string) => void
}

export default function DepositCard({ order, onDepositClick }: DepositCardProps) {

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not_required': { className: 'bg-gray-100 text-gray-800', text: 'Chưa cần cọc' },
      'pending': { className: 'bg-yellow-100 text-yellow-800', text: 'Chờ đặt cọc' },
      'paid': { className: 'bg-green-100 text-green-800', text: 'Đã đặt cọc' },
      'refunded': { className: 'bg-blue-100 text-blue-800', text: 'Đã hoàn cọc' },
      'forfeited': { className: 'bg-red-100 text-red-800', text: 'Tịch thu cọc' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['not_required']
    return <Badge className={config.className}>{config.text}</Badge>
  }

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_confirmation': { className: 'bg-yellow-100 text-yellow-800', text: 'Chờ xác nhận' },
      'confirmed': { className: 'bg-blue-100 text-blue-800', text: 'Đã xác nhận' },
      'in_delivery': { className: 'bg-purple-100 text-purple-800', text: 'Đang giao' },
      'completed': { className: 'bg-green-100 text-green-800', text: 'Hoàn thành' },
      'cancelled': { className: 'bg-red-100 text-red-800', text: 'Đã hủy' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending_confirmation']
    return <Badge className={config.className}>{config.text}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Không cần tính phần trăm nữa vì chỉ dùng số tiền cố định
  const remainingAmount = order.totalPrice - order.depositAmount

  const canMakeDeposit = order.depositRequired && order.depositStatus === 'not_required' && order.status === 'pending_confirmation'
  const canViewDeposit = order.depositStatus !== 'not_required'

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Đơn hàng #{order._id.slice(-8)}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Tạo lúc: {formatDate(order.createdAt)}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            {getOrderStatusBadge(order.status)}
            {getStatusBadge(order.depositStatus)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thông tin giá */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Tổng tiền</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(order.totalPrice)}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Tiền cọc</div>
            <div className="text-lg font-bold text-blue-700">{formatCurrency(order.depositAmount)}</div>
          </div>
        </div>

        {/* Progress bar */}
        {order.depositRequired && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tiến độ đặt cọc</span>
              <span className="font-medium">
                {order.depositStatus === 'paid' ? 'Đã đặt cọc' : 'Chưa đặt cọc'}
              </span>
            </div>
            <Progress 
              value={order.depositStatus === 'paid' ? 100 : 0} 
              className="h-2"
            />
          </div>
        )}

        {/* Thông tin chi tiết */}
        {order.depositRequired && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền còn lại:</span>
              <span className="font-medium">{formatCurrency(remainingAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Loại cọc:</span>
              <span className="font-medium">Số tiền cố định</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canMakeDeposit && (
            <Button 
              onClick={() => onDepositClick(order._id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Đặt cọc ngay
            </Button>
          )}
          
          {canViewDeposit && (
            <Button 
              variant="outline"
              onClick={() => onDepositClick(order._id)}
              className="flex-1"
            >
              Xem chi tiết cọc
            </Button>
          )}

          {!order.depositRequired && (
            <div className="flex-1 text-center text-sm text-gray-500 py-2">
              Đơn hàng này không yêu cầu đặt cọc
            </div>
          )}
        </div>

        {/* Thông báo */}
        {order.depositStatus === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                Đã đặt cọc thành công! Đơn hàng đang chờ xác nhận.
              </span>
            </div>
          </div>
        )}

        {order.depositStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-700 font-medium">
                Đang chờ thanh toán cọc. Vui lòng hoàn tất thanh toán.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
