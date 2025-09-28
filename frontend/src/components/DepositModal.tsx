import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useToast } from '../shared/ToastContext'
import { api } from '../shared/api'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    _id: string
    totalPrice: number
    depositAmount: number
    depositStatus: string
    depositRequired: boolean
  } | null
}

export default function DepositModal({ isOpen, onClose, order }: DepositModalProps) {
  const { notify } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('vnpay')
  const [depositInfo, setDepositInfo] = useState<{
    _id: string;
    amount: number;
    status: string;
    paymentUrl?: string;
  } | null>(null)

  useEffect(() => {
    if (order && isOpen) {
      // Không cần set customAmount nữa vì chỉ dùng số tiền cố định
    }
  }, [order, isOpen])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getDepositAmount = () => {
    if (!order) return 0
    return order.depositAmount || 0
  }

  const handleCreateDeposit = async () => {
    if (!order) return

    setIsLoading(true)
    try {
      const depositData = {
        orderId: order._id,
        paymentMethod
      }

      const response = await api.post('/deposits', depositData)
      
      if (response.data.success) {
        setDepositInfo(response.data.data)
        notify('Tạo yêu cầu đặt cọc thành công!', 'success')
        
        // Nếu có payment URL, redirect
        if (response.data.data.paymentUrl) {
          window.open(response.data.data.paymentUrl, '_blank')
        }
      } else {
        throw new Error(response.data.message || 'Tạo đặt cọc thất bại')
      }
    } catch (error: unknown) {
      console.error('Error creating deposit:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || 'Có lỗi xảy ra'
      notify(`Lỗi: ${errorMessage}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Đặt cọc đơn hàng</CardTitle>
                <CardDescription>
                  Đơn hàng #{order._id.slice(-8)} - {formatCurrency(order.totalPrice)}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!depositInfo ? (
              <>
                {/* Thông tin đơn hàng */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Thông tin đơn hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tổng tiền:</span>
                      <div className="font-semibold">{formatCurrency(order.totalPrice)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Trạng thái:</span>
                      <div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {order.depositStatus === 'not_required' ? 'Chưa đặt cọc' : order.depositStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin đặt cọc */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Thông tin đặt cọc</Label>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Số tiền đặt cọc (từ sản phẩm):</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getDepositAmount())}
                    </div>
                  </div>
                </div>


                {/* Phương thức thanh toán */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Phương thức thanh toán</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vnpay">VNPay (Thẻ ATM/Internet Banking)</SelectItem>
                      <SelectItem value="momo">MoMo</SelectItem>
                      <SelectItem value="bank_transfer">Chuyển khoản ngân hàng</SelectItem>
                      <SelectItem value="cash">Thanh toán tiền mặt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tóm tắt */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-blue-900">Tóm tắt đặt cọc</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Tổng tiền đơn hàng:</span>
                      <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền đặt cọc:</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(getDepositAmount())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền còn lại:</span>
                      <span className="font-semibold">{formatCurrency(order.totalPrice - getDepositAmount())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span className="font-semibold">
                        {paymentMethod === 'vnpay' ? 'VNPay' : 
                         paymentMethod === 'momo' ? 'MoMo' :
                         paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreateDeposit}
                    disabled={isLoading || getDepositAmount() <= 0 || getDepositAmount() > order.totalPrice}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Đang xử lý...' : 'Tạo đặt cọc'}
                  </Button>
                </div>
              </>
            ) : (
              /* Thông tin deposit đã tạo */
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-800">Đặt cọc thành công!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Yêu cầu đặt cọc đã được tạo. Vui lòng hoàn tất thanh toán để xác nhận.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Thông tin đặt cọc</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mã đặt cọc:</span>
                      <span className="font-mono">{depositInfo._id?.slice(-8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="font-semibold">{formatCurrency(depositInfo.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hết hạn:</span>
                      <span>{new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {depositInfo.paymentUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Nhấn nút bên dưới để chuyển đến trang thanh toán:
                    </p>
                    <Button 
                      onClick={() => window.open(depositInfo.paymentUrl, '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Thanh toán ngay
                    </Button>
                  </div>
                )}

                <Button onClick={onClose} className="w-full">
                  Đóng
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
