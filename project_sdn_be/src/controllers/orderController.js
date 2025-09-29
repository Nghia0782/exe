import moment from 'moment';
import User from '../models/User.js';
import {
  updateOrderStatus,
  getProductsFromOrder,
  getAllOrderedProducts,
  createOrder,
  getOrdersByUserId,
  getOrdersByRenterId,
  getOrderWithRenterDetails,
  getOrderById,
} from '../service/order.service.js';
import {
  sendOrderPlacedEmail,
  sendOrderPaidEmail,
  sendOrderStatusUpdatedEmail,
  sendOrderApprovedEmail,
} from '../utils/mailer.js';
import qs from 'qs';
import crypto from 'crypto';
import { createPaymentUrl } from '../utils/payment.js';
import UnitProduct from '../models/UnitProduct.js';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import ProductDetail from '../models/ProductDetail.js';
import ShopDetail from '../models/ShopDetail.js';
import Deposit from '../models/Deposit.js';
import OrderReview from '../models/OrderReview.js';
import OrderEvidence from '../models/OrderEvidence.js';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
export const getOrdersByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await getOrdersByUserId(userId);
    console.log(orders);
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No orders found for this user' });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get orders of current authenticated user (customer)
export const getMyOrdersController = async (req, res) => {
  try {
    const userId = req.authenticatedUser?.userId || req.user?._id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const orders = await getOrdersByUserId(userId)
    return res.status(200).json({ success: true, metadata: orders })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getOrdersByRenterIdController = async (req, res) => {
  try {
    const { renterId } = req.params;

    const orders = await getOrdersByRenterId(renterId);

    console.log('orders', orders);

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No orders found for this renter' });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const checkOrderController = async (req, res) => {
  const { products: productIds } = req.body;
  for (const productId of productIds) {
    const product = await ProductDetail.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: `Product ${productId} not found` });
    }
    if (product.stock === product.soldCount) {
      return res.status(400).json({
        success: false,
        message: `Product ${productId} is out of stock`,
      });
    }
  }

  return res.status(200).json({ success: true, message: `Product` });
};
export const createOrderController = async (req, res) => {
  try {
    const { products: productIds, ...orderPayload } = req.body;
    const unitProductIds = [];
    const customerId = req.user._id;
    
    console.log(`[Order Creation] Full request body:`, req.body);
    console.log(`[Order Creation] User ${customerId} creating order for products:`, productIds);
    console.log(`[Order Creation] Order payload:`, orderPayload);
    
    // Validate required fields
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Products array is required' 
      });
    }
    
    if (!orderPayload.duration || orderPayload.duration <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duration is required and must be greater than 0' 
      });
    }
    
    if (!orderPayload.totalPrice || orderPayload.totalPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Total price is required and must be greater than 0' 
      });
    }
    
    // Thử dùng transaction nếu được; nếu không, fallback không transaction
    let session = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        for (const productId of productIds) {
          console.log('checking productId:', productId);
          const product = await ProductDetail.findById(productId).session(session);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }
          const totalUnits = await UnitProduct.countDocuments({ productId }).session(session);
          const availableUnits = await UnitProduct.countDocuments({ productId, productStatus: 'available' }).session(session);
          console.log(`Product ${productId} - Total units: ${totalUnits}, Available: ${availableUnits}`);
          if (totalUnits === 0) {
            throw new Error(`Product \"${product.title}\" has no units available. Please contact admin to create units for this product.`);
          }
          if (availableUnits === 0) {
            throw new Error(`Product \"${product.title}\" is currently out of stock. All units are rented.`);
          }
          const unit = await UnitProduct.findOneAndUpdate(
            { productId, productStatus: 'available' },
            { productStatus: 'rented', renterId: customerId },
            { new: true, session }
          );
          console.log('unit result:', unit);
          if (!unit) {
            throw new Error(`Product \"${productId}\" is not available for rent. Please try again or contact support.`);
          }
          unitProductIds.push(unit._id);
        }

        // Lấy thông tin user để kiểm tra KYC status
        const user = await User.findById(customerId).session(session);
        const userKycStatus = user?.kycStatus || 'unverified';

        // Tính tổng số tiền cọc từ các sản phẩm dựa trên KYC status
        let totalDepositAmount = 0;
        for (const productId of productIds) {
          const product = await ProductDetail.findById(productId).session(session);
          if (product) {
            let depositPercentage = 0;
            if (userKycStatus === 'unverified') depositPercentage = product.depositPolicy?.unverified || 100;
            else if (userKycStatus === 'verified') depositPercentage = product.depositPolicy?.verified || 30;
            else if (userKycStatus === 'premium') depositPercentage = product.depositPolicy?.premium || 0;
            const productDepositAmount = Math.round(product.price * depositPercentage / 100);
            totalDepositAmount += productDepositAmount;
          }
        }

        const newOrder = await Order.create([
          {
            ...orderPayload,
            customerId,
            products: unitProductIds,
            depositRequired: totalDepositAmount > 0,
            depositAmount: totalDepositAmount,
            depositStatus: totalDepositAmount > 0 ? 'pending' : 'not_required',
          }
        ], { session });

        const created = Array.isArray(newOrder) ? newOrder[0] : newOrder;
        req.createdOrder = created; // pass to outer scope
      });
    } catch (txErr) {
      console.warn('Transaction unavailable, fallback without transaction:', txErr?.message || txErr);
      // Fallback: thao tác không transaction (giảm rủi ro bằng findOneAndUpdate điều kiện)
      for (const productId of productIds) {
        const product = await ProductDetail.findById(productId);
        if (!product) throw new Error(`Product ${productId} not found`);
        const totalUnits = await UnitProduct.countDocuments({ productId });
        const availableUnits = await UnitProduct.countDocuments({ productId, productStatus: 'available' });
        if (totalUnits === 0) {
          throw new Error(`Product \"${product.title}\" has no units available. Please contact admin to create units for this product.`);
        }
        if (availableUnits === 0) {
          throw new Error(`Product \"${product.title}\" is currently out of stock. All units are rented.`);
        }
        const unit = await UnitProduct.findOneAndUpdate(
          { productId, productStatus: 'available' },
          { productStatus: 'rented', renterId: customerId },
          { new: true }
        );
        if (!unit) throw new Error(`Product \"${productId}\" is not available for rent. Please try again or contact support.`);
        unitProductIds.push(unit._id);
      }

      const user = await User.findById(customerId);
      const userKycStatus = user?.kycStatus || 'unverified';
      let totalDepositAmount = 0;
      for (const productId of productIds) {
        const product = await ProductDetail.findById(productId);
        if (product) {
          let depositPercentage = 0;
          if (userKycStatus === 'unverified') depositPercentage = product.depositPolicy?.unverified || 100;
          else if (userKycStatus === 'verified') depositPercentage = product.depositPolicy?.verified || 30;
          else if (userKycStatus === 'premium') depositPercentage = product.depositPolicy?.premium || 0;
          const productDepositAmount = Math.round(product.price * depositPercentage / 100);
          totalDepositAmount += productDepositAmount;
        }
      }
      const created = await Order.create({
        ...orderPayload,
        customerId,
        products: unitProductIds,
        depositRequired: totalDepositAmount > 0,
        depositAmount: totalDepositAmount,
        depositStatus: totalDepositAmount > 0 ? 'pending' : 'not_required',
      });
      req.createdOrder = created;
    } finally {
      if (session) await session.endSession();
    }
    // After transaction success
    const createdOrder = req.createdOrder;
    if (!createdOrder) throw new Error('Order creation failed');

    // Lấy thông tin user để kiểm tra KYC status
    const user = await User.findById(customerId);
    const userKycStatus = user?.kycStatus || 'unverified';

    // Tính tổng số tiền cọc từ các sản phẩm dựa trên KYC status
    let totalDepositAmount = 0;
    for (const productId of productIds) {
      const product = await ProductDetail.findById(productId);
      if (product) {
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
        // Lưu ý: Mỗi sản phẩm trong productIds là 1 đơn vị, không cần nhân quantity
        const productDepositAmount = Math.round(product.price * depositPercentage / 100);
        totalDepositAmount += productDepositAmount;
      }
    }

    console.log(`[Order Creation] Order created successfully:`, createdOrder._id);

    // Gửi mail khi đặt hàng thành công
    try {
      const user = await User.findById(customerId);
      await sendOrderPlacedEmail(user.email, createdOrder._id, user._id);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the order if email fails
    }

    return res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    let { status, paymentStatus } = req.body;

    console.log('[Update Order Status] Request:', { orderId, status, paymentStatus });

    // Normalize common frontend synonyms to schema enum values
    const statusMap = {
      cancelled: 'canceled',
      approved: 'confirmed',
      shipped: 'in_delivery',
      delivering: 'in_delivery',
      received: 'before_deadline',
      returning: 'return_product',
      complete: 'completed',
    };
    if (typeof status === 'string' && statusMap[status]) {
      status = statusMap[status];
    }

    const updatedOrder = await updateOrderStatus(orderId, status, paymentStatus);
    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const userId = req.body.toId || updatedOrder.customerId?._id || updatedOrder.customerId;
    const foundUser = await User.findById(userId);

    // Gửi mail khi cập nhật trạng thái đơn hàng (chỉ khi tìm thấy user)
    if (foundUser && foundUser.email) {
      try {
        await sendOrderStatusUpdatedEmail(foundUser.email, orderId, userId, status);
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Không throw error để không làm gián đoạn việc cập nhật trạng thái
      }
    }

    if (status == 'pending_payment' && foundUser && foundUser.email) {
      console.log('SENDING EMAIL');
      try {
        await sendOrderApprovedEmail(foundUser.email, orderId, userId);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Không throw error để không làm gián đoạn việc cập nhật trạng thái
      }

      const order = await Order.findById(orderId);
      if (order && order.products && order.products.length > 0) {
        for (const unitId of order.products) {
          const unit = await UnitProduct.findById(unitId);
          if (unit && unit.productId) {
            await UnitProduct.findByIdAndUpdate(unitId, {
              productStatus: 'rented',
              renterId: order.customerId,
            });

            const product = await ProductDetail.findById(unit.productId);
            if (product && product.soldCount > 0) {
              await ProductDetail.findByIdAndUpdate(unit.productId, {
                $inc: { soldCount: -1 },
              });
            }
          }
        }
      }
    }
    if (status === 'completed') {
      const order = await Order.findById(orderId);
      if (order && order.products && order.products.length > 0) {
        for (const unitId of order.products) {
          // Đổi trạngx thái unit trở lại available
          await UnitProduct.findByIdAndUpdate(unitId, {
            productStatus: 'available',
            renterId: null,
          });

          const unit = await UnitProduct.findById(unitId);
          if (unit && unit.productId) {
            const product = await ProductDetail.findById(unit.productId);
            if (product && product.soldCount < product.stock) {
              await ProductDetail.findByIdAndUpdate(unit.productId, {
                $inc: { soldCount: 1 },
              });
            }
          }
        }
      }
      // Auto-refund deposit when order completed
      try {
        const paidDeposit = await Deposit.findOne({ orderId, status: 'paid' });
        if (paidDeposit) {
          paidDeposit.status = 'refunded';
          paidDeposit.refundedAt = new Date();
          paidDeposit.refundAmount = paidDeposit.amount;
          paidDeposit.refundReason = 'Order completed';
          await paidDeposit.save();
          await Order.findByIdAndUpdate(orderId, { depositStatus: 'refunded' });
        }
      } catch (refundErr) {
        console.error('Auto refund deposit on completed error:', refundErr);
      }
    }
    if (status === 'canceled') {
      const order = await Order.findById(orderId);
      if (order && order.products && order.products.length > 0) {
        for (const unitId of order.products) {
          await UnitProduct.findByIdAndUpdate(unitId, {
            productStatus: 'available',
            renterId: null,
          });

          const unit = await UnitProduct.findById(unitId);
          if (unit && unit.productId) {
            const product = await ProductDetail.findById(unit.productId);
            if (product && product.soldCount < product.stock) {
              await ProductDetail.findByIdAndUpdate(unit.productId, {
                $inc: { soldCount: 1 },
              });
            }
          }
        }
      }
    }
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsFromOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;

    const products = await getProductsFromOrder(orderId);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getAllOrderedProductsController = async (req, res) => {
  try {
    const products = await getAllOrderedProducts();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const createPaymentController = async (req, res) => {
  try {
    const { orderId: orderIdReq, customerId, type, amount, bankCode } = req.body;
    const amountNumber = parseInt(String(amount).toString().replace(/\./g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Amount is invalid' });
    }
    const paymentUrl = await createPaymentUrl({
      amount: amountNumber,
      orderId: orderIdReq,
      orderDescription: `${orderIdReq}|${customerId}|${type || 'order'}`,
      customerId,
      bankCode: bankCode || '',
    });
    return res.status(200).json({ success: true, data: paymentUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

export const getOrderWithRenterDetailsController = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderWithRenterDetails(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderByIdController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderById(orderId);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo QR động cho thanh toán chuyển khoản ngân hàng theo từng đơn hàng
export const getOrderPaymentQrController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const Order = (await import('../models/Order.js')).default;
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const requesterId = req.authenticatedUser?.userId || req.user?._id?.toString();
    const ownerId = order.customerId?.toString();
    if (!requesterId || requesterId !== ownerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const provider = (req.query.provider || 'vietqr').toString();
    const amount = order.totalPrice;
    const addInfo = `ORDER-${order._id}`; // nội dung duy nhất

    if (provider === 'vietqr') {
      const bankCode = process.env.RECEIVER_BANK;
      const accountNo = process.env.RECEIVER_ACCOUNT_NO;
      const accountName = process.env.RECEIVER_ACCOUNT_NAME || '';
      if (!bankCode || !accountNo) {
        return res.status(500).json({ success: false, message: 'Receiver bank/account is not configured' });
      }
      const template = (req.query.template || 'qr_only').toString(); // qr_only | compact | compact2
      const baseUrl = 'https://img.vietqr.io/image';
      const qrUrl = `${baseUrl}/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNo)}-${encodeURIComponent(template)}.png?amount=${encodeURIComponent(amount)}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
      return res.status(200).json({
        success: true,
        data: { qrImageUrl: qrUrl, amount, addInfo, bank: bankCode, accountNo, accountName, provider },
      });
    }

    return res.status(400).json({ success: false, message: 'Unsupported QR provider' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helpers
const loadOrderWithShopOwner = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate({
      path: 'products',
      model: 'UnitProduct',
      populate: {
        path: 'productId',
        model: 'ProductDetail',
        select: 'idShop'
      }
    })
    .lean();
  if (!order) return { order: null, ownerUserId: null };
  let ownerUserId = null;
  const shopId = order.products?.[0]?.productId?.idShop;
  if (shopId) {
    const shop = await ShopDetail.findById(shopId).lean();
    ownerUserId = shop?.idUser?.toString() || null;
  }
  return { order, ownerUserId };
};

const isOrderOwner = (userId, ownerUserId) => {
  return userId && ownerUserId && userId.toString() === ownerUserId.toString();
};

// Convenience controllers with policy checks
export const confirmOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order, ownerUserId } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!isOrderOwner(actorId, ownerUserId)) return res.status(403).json({ success: false, message: 'Only owner can confirm' });
    if (order.depositRequired && order.depositStatus !== 'paid') return res.status(400).json({ success: false, message: 'Deposit must be paid before confirmation' });
    req.params.orderId = orderId;
    req.body.status = 'confirmed';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const startDeliveryController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order, ownerUserId } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!isOrderOwner(actorId, ownerUserId)) return res.status(403).json({ success: false, message: 'Only owner can start delivery' });
    if (order.status !== 'confirmed') return res.status(400).json({ success: false, message: 'Order must be confirmed first' });
    // Optional: accept photo evidence at dispatch time
    const { images = [], videos = [], note } = req.body || {};
    if (Array.isArray(images) && images.length > 0) {
      await OrderEvidence.create({
        orderId,
        evidenceType: 'delivery',
        images,
        videos: Array.isArray(videos) ? videos : [],
        description: note || 'Dispatch proof by owner',
        submittedBy: 'owner',
        status: 'approved'
      });
    }
    req.body.status = 'in_delivery';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const markReceivedController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId?.toString() !== actorId?.toString()) return res.status(403).json({ success: false, message: 'Only customer can mark received' });
    if (order.status !== 'in_delivery') return res.status(400).json({ success: false, message: 'Order must be in delivery' });
    // Optional: accept delivery proof from receiver
    const { images = [], videos = [], note } = req.body || {};
    if (Array.isArray(images) && images.length > 0) {
      await OrderEvidence.create({
        orderId,
        evidenceType: 'delivery',
        images,
        videos: Array.isArray(videos) ? videos : [],
        description: note || 'Delivery received proof by renter',
        submittedBy: 'renter',
        status: 'approved'
      });
    }
    req.body.status = 'before_deadline';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// Explicit endpoints to upload dispatch/delivery proofs with images first, without changing implicit flows
export const submitDispatchProofController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order, ownerUserId } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!isOrderOwner(actorId, ownerUserId)) return res.status(403).json({ success: false, message: 'Only owner can submit dispatch proof' });
    const { images = [], videos = [], note } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ success: false, message: 'images[] is required' });
    const doc = await OrderEvidence.create({ orderId, evidenceType: 'delivery', images, videos: Array.isArray(videos) ? videos : [], description: note || 'Dispatch proof by owner', submittedBy: 'owner' });
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const submitDeliveryProofController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId?.toString() !== actorId?.toString()) return res.status(403).json({ success: false, message: 'Only customer can submit delivery proof' });
    const { images = [], videos = [], note } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ success: false, message: 'images[] is required' });
    const doc = await OrderEvidence.create({ orderId, evidenceType: 'delivery', images, videos: Array.isArray(videos) ? videos : [], description: note || 'Delivery received proof by renter', submittedBy: 'renter' });
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const requestReturnController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId?.toString() !== actorId?.toString()) return res.status(403).json({ success: false, message: 'Only customer can request return' });
    if (!['before_deadline', 'in_delivery'].includes(order.status)) return res.status(400).json({ success: false, message: 'Order must be active to return' });
    req.body.status = 'return_product';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const completeOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order, ownerUserId } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!isOrderOwner(actorId, ownerUserId)) return res.status(403).json({ success: false, message: 'Only owner can complete' });
    if (order.status !== 'return_product') return res.status(400).json({ success: false, message: 'Order must be in return step' });
    req.body.status = 'completed';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const cancelOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const { order, ownerUserId } = await loadOrderWithShopOwner(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const isOwner = isOrderOwner(actorId, ownerUserId);
    const isCustomer = order.customerId?.toString() === actorId?.toString();
    if (!isOwner && !isCustomer) return res.status(403).json({ success: false, message: 'Not allowed to cancel' });
    if (isCustomer && !['pending_confirmation', 'pending_payment'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Customer can cancel only before confirmation' });
    }
    req.body.status = 'canceled';
    return await updateOrderStatusController(req, res);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const createOrderReviewController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment, target } = req.body; // target: 'customer' | 'shop'
    if (!['customer', 'shop'].includes(target)) return res.status(400).json({ success: false, message: 'Invalid target' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Invalid rating' });

    const actorId = req.authenticatedUser?.userId || req.user?._id;
    const order = await Order.findById(orderId).populate({
      path: 'products',
      model: 'UnitProduct',
      populate: { path: 'productId', model: 'ProductDetail', select: 'idShop' }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'completed') return res.status(400).json({ success: false, message: 'Order must be completed to review' });

    // Determine allowed reviewer/target
    const shop = order.products?.[0]?.productId?.idShop;
    const shopDoc = shop ? await ShopDetail.findById(shop) : null;
    const ownerUserId = shopDoc?.idUser?.toString();
    const isCustomer = order.customerId?.toString() === actorId?.toString();
    const isOwner = ownerUserId && ownerUserId === actorId?.toString();

    if (target === 'shop' && !isCustomer) return res.status(403).json({ success: false, message: 'Only customer can review shop' });
    if (target === 'customer' && !isOwner) return res.status(403).json({ success: false, message: 'Only owner can review customer' });

    const doc = await OrderReview.create({ orderId, reviewerId: actorId, targetType: target, rating, comment });
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ success: false, message: 'You already reviewed this order' });
    return res.status(500).json({ success: false, message: e.message });
  }
};
