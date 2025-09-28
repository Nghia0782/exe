import Deposit from '../models/Deposit.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import ProductDetail from '../models/ProductDetail.js';
import { createPaymentUrl, verifyPaymentReturn } from '../utils/payment.js';
import PaymentHistory from '../models/PaymentHistory.js';

// Tạo đặt cọc mới
export const createDeposit = async (req, res) => {
    try {
        console.log('=== CREATE DEPOSIT REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request user:', req.user);
        console.log('Request authenticatedUser:', req.authenticatedUser);
        
        const { orderId, paymentMethod = 'vnpay' } = req.body;
        const customerId = req.authenticatedUser?.userId || req.user?._id;
        
        console.log('OrderId:', orderId);
        console.log('CustomerId:', customerId);
        console.log('PaymentMethod:', paymentMethod);

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Kiểm tra order tồn tại và thuộc về user
        console.log('Looking for order with ID:', orderId);
        const order = await Order.findById(orderId).populate('customerId');
        console.log('Found order:', order ? 'YES' : 'NO');
        if (order) {
            console.log('Order details:', {
                _id: order._id,
                customerId: order.customerId?._id,
                depositRequired: order.depositRequired,
                depositAmount: order.depositAmount,
                status: order.status
            });
        }
        
        if (!order) {
            console.log('ERROR: Order not found');
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const orderCustomerId = order.customerId._id ? order.customerId._id.toString() : order.customerId.toString();
        if (orderCustomerId !== customerId.toString()) {
            console.log('ERROR: Access denied - customer ID mismatch');
            console.log('Order customer ID:', orderCustomerId);
            console.log('Request customer ID:', customerId);
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Kiểm tra order có cần đặt cọc không
        console.log('Checking depositRequired:', order.depositRequired);
        if (!order.depositRequired) {
            console.log('ERROR: Order does not require deposit');
            return res.status(400).json({
                success: false,
                message: 'This order does not require a deposit'
            });
        }

        // Kiểm tra đã có deposit chưa (ưu tiên tái sử dụng deposit pending)
        console.log('Checking for existing deposits...');
        const existingDeposit = await Deposit.findOne({ orderId, status: { $in: ['pending', 'paid'] } });
        console.log('Existing deposit found:', existingDeposit ? 'YES' : 'NO');
        if (existingDeposit) {
            // Nếu đã paid: không cần tạo mới
            if (existingDeposit.status === 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Deposit already paid for this order',
                    data: existingDeposit
                });
            }

            // Nếu đang pending: đảm bảo luôn có paymentUrl (nếu thiếu thì tạo mới)
            try {
                if (!existingDeposit.paymentUrl && (paymentMethod === 'vnpay' || !paymentMethod)) {
                    const regeneratedUrl = await createPaymentUrl({
                        amount: existingDeposit.amount,
                        orderId: existingDeposit._id,
                        orderDescription: `Đặt cọc đơn hàng #${orderId.toString().slice(-8)}`,
                        customerId
                    });
                    existingDeposit.paymentUrl = regeneratedUrl;
                    await existingDeposit.save();
                }
            } catch (regenErr) {
                console.error('Error regenerating VNPay URL for existing deposit:', regenErr);
            }

            // Trả về deposit hiện tại cùng paymentUrl để user tiếp tục thanh toán
            return res.status(200).json({
                success: true,
                message: 'Deposit already exists (pending). Reuse current deposit.',
                data: existingDeposit
            });
        }

        // Nếu có deposit với status khác (cancelled, expired, etc.), cập nhật status thành cancelled
        const oldDeposit = await Deposit.findOne({ orderId, status: { $nin: ['pending', 'paid'] } });
        if (oldDeposit) {
            console.log(`Found old deposit with status: ${oldDeposit.status}, updating to cancelled`);
            oldDeposit.status = 'cancelled';
            oldDeposit.cancelledAt = new Date();
            await oldDeposit.save();
        }

        // Lấy thông tin user để kiểm tra KYC status
        const user = await User.findById(customerId);
        const userKycStatus = user?.kycStatus || 'unverified';

        // Lấy thông tin sản phẩm để tính số tiền cọc
        const orderWithProducts = await Order.findById(orderId).populate({
            path: 'products',
            populate: {
                path: 'productId',
                model: 'ProductDetail'
            }
        });
        
        if (!orderWithProducts || !orderWithProducts.products || orderWithProducts.products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order has no products'
            });
        }

        // Tính tổng số tiền cọc từ các sản phẩm dựa trên KYC status
        let totalDepositAmount = 0;
        for (const unitProduct of orderWithProducts.products) {
            if (unitProduct.productId) {
                const product = unitProduct.productId;
                
                // Tính deposit dựa trên KYC status
                let depositPercentage = 0;
                if (userKycStatus === 'unverified') {
                    depositPercentage = product.depositPolicy?.unverified || 100;
                } else if (userKycStatus === 'verified') {
                    depositPercentage = product.depositPolicy?.verified || 30;
                } else if (userKycStatus === 'premium') {
                    depositPercentage = product.depositPolicy?.premium || 0;
                }
                
                // Tính số tiền cọc dựa trên phần trăm của giá sản phẩm
                // Lưu ý: Trong hệ thống thuê, mỗi sản phẩm chỉ có 1 đơn vị
                const productDepositAmount = Math.round(product.price * depositPercentage / 100);
                totalDepositAmount += productDepositAmount;
            }
        }

        if (totalDepositAmount === 0) {
            return res.status(400).json({
                success: false,
                message: 'No deposit amount configured for products in this order'
            });
        }

        // Tạo deposit record
        const deposit = new Deposit({
            orderId,
            customerId,
            amount: totalDepositAmount,
            depositType: 'fixed_amount',
            paymentMethod,
            status: 'pending'
        });

        await deposit.save();

        // Cập nhật order
        await Order.findByIdAndUpdate(orderId, {
            depositAmount: totalDepositAmount,
            depositStatus: 'pending'
        });

        // Tạo payment URL nếu cần
        let paymentUrl = null;
        if (paymentMethod === 'vnpay') {
            try {
                paymentUrl = await createPaymentUrl({
                    amount: totalDepositAmount,
                    orderId: deposit._id,
                    orderDescription: `Đặt cọc đơn hàng #${orderId.slice(-8)}`,
                    customerId
                });
                
                deposit.paymentUrl = paymentUrl;
                await deposit.save();
            } catch (paymentError) {
                console.error('Error creating payment URL:', paymentError);
            }
        }

        console.log('=== DEPOSIT CREATED SUCCESSFULLY ===');
        console.log('Deposit ID:', deposit._id);
        console.log('Deposit Amount:', deposit.amount);
        console.log('Payment URL:', paymentUrl);
        
        res.status(201).json({
            success: true,
            message: 'Deposit created successfully',
            data: {
                deposit,
                paymentUrl
            }
        });

    } catch (error) {
        console.error('=== CREATE DEPOSIT ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy thông tin deposit
export const getDeposit = async (req, res) => {
    try {
        const { depositId } = req.params;
        const customerId = req.authenticatedUser?.userId || req.user?._id;

        const deposit = await Deposit.findById(depositId)
            .populate('orderId')
            .populate('customerId', 'name email');

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        // Kiểm tra quyền truy cập
        if (deposit.customerId._id.toString() !== customerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: deposit
        });

    } catch (error) {
        console.error('Error getting deposit:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// VNPay Return URL (front-channel): xác minh chữ ký, cập nhật trạng thái và redirect về FE
export const vnpayReturn = async (req, res) => {
    try {
        const vnpParams = { ...req.query };
        const isValid = verifyPaymentReturn({ ...vnpParams });
        const depositId = vnpParams['vnp_TxnRef'];
        const responseCode = vnpParams['vnp_ResponseCode'] || '99';
        const transactionNo = vnpParams['vnp_TransactionNo'];

        if (!depositId) return res.redirect('http://localhost:5173/orders?payment=missing');

        const deposit = await Deposit.findById(depositId);
        if (!deposit) return res.redirect('http://localhost:5173/orders?payment=notfound');

        // Lưu lịch sử giao dịch
        await PaymentHistory.create({
            depositId: deposit._id,
            orderId: deposit.orderId,
            customerId: deposit.customerId,
            gateway: 'vnpay',
            amount: deposit.amount,
            status: isValid && responseCode === '00' ? 'success' : 'failed',
            transactionId: transactionNo,
            responseCode,
            rawParams: vnpParams,
        });

        if (isValid && responseCode === '00') {
            // update deposit/order
            deposit.status = 'paid';
            deposit.paymentTransactionId = transactionNo;
            deposit.paidAt = new Date();
            await deposit.save();
            await Order.findByIdAndUpdate(deposit.orderId, { depositStatus: 'paid' });
            return res.redirect('http://localhost:5173/orders?payment=success&code=00');
        }

        return res.redirect(`http://localhost:5173/orders?payment=failed&code=${responseCode}`);
    } catch (err) {
        console.error('VNPay return error:', err);
        return res.redirect('http://localhost:5173/orders?payment=error');
    }
};

// VNPay IPN (server-to-server): xác minh chữ ký, cập nhật trạng thái và phản hồi theo chuẩn VNPay
export const vnpayIpn = async (req, res) => {
    try {
        const vnpParams = { ...req.query };
        const isValid = verifyPaymentReturn({ ...vnpParams });
        const depositId = vnpParams['vnp_TxnRef'];
        const responseCode = vnpParams['vnp_ResponseCode'] || '99';
        const transactionNo = vnpParams['vnp_TransactionNo'];

        if (!depositId) return res.status(200).json({ RspCode: '97', Message: 'Missing order' });

        const deposit = await Deposit.findById(depositId);
        if (!deposit) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });

        // Tránh xử lý lặp lại
        if (deposit.status === 'paid') return res.status(200).json({ RspCode: '00', Message: 'OK' });

        // Lưu lịch sử giao dịch
        await PaymentHistory.create({
            depositId: deposit._id,
            orderId: deposit.orderId,
            customerId: deposit.customerId,
            gateway: 'vnpay',
            amount: deposit.amount,
            status: isValid && responseCode === '00' ? 'success' : 'failed',
            transactionId: transactionNo,
            responseCode,
            rawParams: vnpParams,
        });

        if (isValid && responseCode === '00') {
            deposit.status = 'paid';
            deposit.paymentTransactionId = transactionNo;
            deposit.paidAt = new Date();
            await deposit.save();
            await Order.findByIdAndUpdate(deposit.orderId, { depositStatus: 'paid' });
            return res.status(200).json({ RspCode: '00', Message: 'OK' });
        }

        return res.status(200).json({ RspCode: '99', Message: 'Fail' });
    } catch (err) {
        console.error('VNPay IPN error:', err);
        return res.status(200).json({ RspCode: '99', Message: 'Error' });
    }
};

// Lấy lịch sử thanh toán của user
export const getPaymentHistoryMy = async (req, res) => {
    try {
        const customerId = req.authenticatedUser?.userId || req.user?._id;
        const items = await PaymentHistory.find({ customerId })
            .populate('orderId', 'totalPrice depositStatus')
            .populate('depositId', 'status amount')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: danh sách lịch sử thanh toán
export const getPaymentHistoryAdmin = async (req, res) => {
    try {
        const { status, gateway } = req.query;
        const query = {};
        if (status) query.status = status;
        if (gateway) query.gateway = gateway;
        const items = await PaymentHistory.find(query)
            .populate('orderId', 'totalPrice depositStatus')
            .populate('depositId', 'status amount')
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Lấy danh sách deposits của user
export const getUserDeposits = async (req, res) => {
    try {
        const customerId = req.authenticatedUser?.userId || req.user?._id;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { customerId };
        if (status) {
            filter.status = status;
        }

        const deposits = await Deposit.find(filter)
            .populate('orderId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Deposit.countDocuments(filter);

        res.json({
            success: true,
            data: deposits,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Error getting user deposits:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Xác nhận thanh toán cọc
export const confirmDepositPayment = async (req, res) => {
    try {
        const { depositId } = req.params;
        const { transactionId, paymentMethod } = req.body;

        const deposit = await Deposit.findById(depositId);
        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        if (deposit.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Deposit is not in pending status'
            });
        }

        // Cập nhật deposit
        deposit.status = 'paid';
        deposit.paymentTransactionId = transactionId;
        deposit.paidAt = new Date();
        await deposit.save();

        // Cập nhật order
        await Order.findByIdAndUpdate(deposit.orderId, {
            depositStatus: 'paid'
        });

        // Gửi email xác nhận
        try {
            const user = await User.findById(deposit.customerId);
            if (user && user.email) {
                // await sendDepositPaidEmail(user.email, deposit);
                console.log('Deposit payment confirmed for user:', user.email);
            }
        } catch (emailError) {
            console.error('Error sending deposit confirmation email:', emailError);
        }

        res.json({
            success: true,
            message: 'Deposit payment confirmed successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error confirming deposit payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Hoàn tiền cọc
export const refundDeposit = async (req, res) => {
    try {
        const { depositId } = req.params;
        const { reason, refundAmount } = req.body;

        const deposit = await Deposit.findById(depositId);
        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        if (deposit.status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Only paid deposits can be refunded'
            });
        }

        // Cập nhật deposit
        deposit.status = 'refunded';
        deposit.refundAmount = refundAmount || deposit.amount;
        deposit.refundReason = reason;
        deposit.refundedAt = new Date();
        await deposit.save();

        // Cập nhật order
        await Order.findByIdAndUpdate(deposit.orderId, {
            depositStatus: 'refunded'
        });

        res.json({
            success: true,
            message: 'Deposit refunded successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error refunding deposit:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tịch thu cọc (khi khách hàng vi phạm)
export const forfeitDeposit = async (req, res) => {
    try {
        const { depositId } = req.params;
        const { reason } = req.body;

        const deposit = await Deposit.findById(depositId);
        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        if (deposit.status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Only paid deposits can be forfeited'
            });
        }

        // Cập nhật deposit
        deposit.status = 'forfeited';
        deposit.refundReason = reason;
        deposit.refundedAt = new Date();
        await deposit.save();

        // Cập nhật order
        await Order.findByIdAndUpdate(deposit.orderId, {
            depositStatus: 'forfeited'
        });

        res.json({
            success: true,
            message: 'Deposit forfeited successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error forfeiting deposit:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy thống kê deposits (cho admin)
export const getDepositStats = async (req, res) => {
    try {
        const stats = await Deposit.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalDeposits = await Deposit.countDocuments();
        const totalAmount = await Deposit.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                stats,
                totalDeposits,
                totalAmount: totalAmount[0]?.total || 0
            }
        });

    } catch (error) {
        console.error('Error getting deposit stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
