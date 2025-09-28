import mongoose from 'mongoose';
import Order from '../models/Order.js';
import UnitProduct from '../models/UnitProduct.js';
import ProductDetail from '../models/ProductDetail.js';
import ShopDetail from '../models/ShopDetail.js';
import moment from 'moment';
import { sendOrderPlacedEmail } from '../utils/mailer.js';

export const autoUpdateOrderStatus = async () => {
  try {
    const orders = await Order.find({ status: 'before_deadline' });
    for (const order of orders) {
      if (order.deliveryDate && order.duration) {
        const deadline = moment(order.deliveryDate).add(order.duration, 'days');
        if (moment().isAfter(deadline)) {
          order.status = 'return_product';
          await order.save();
          console.log(`Order ${order._id} updated to return_product`);
        }
      }
    }
  } catch (error) {
    console.error('Error updating orders status:', error);
  }
};
export const updateOrderStatus = async (orderId, newStatus, paymentStatus = null) => {
  try {
    const updateData = { status: newStatus };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    if (newStatus === 'before_deadline') {
      updateData.deliveryDate = new Date();
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    }).populate('customerId', 'name email');
    return order;
  } catch (error) {
    throw error;
  }
};
export const getProductsFromOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('products');
    if (!order) {
      throw new Error('Order not found');
    }
    return order.products;
  } catch (error) {
    throw error;
  }
};
export const getAllOrderedProducts = async () => {
  try {
    const orders = await Order.find().populate('products');
    const allProducts = orders.flatMap((order) => order.products);
    return allProducts;
  } catch (error) {
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const newOrder = new Order(orderData);
    return await newOrder.save();
  } catch (error) {
    throw error;
  }
};
export const getOrdersByUserId = async (userId) => {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    const orders = await Order.find({ customerId: objectId });
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const detailedUnitProducts = await UnitProduct.find({
          _id: { $in: order.products },
        }).populate({
          path: 'productId',
          model: 'ProductDetail'
        });

        return {
          ...order.toObject(),
          products: detailedUnitProducts,
        };
      })
    );
    return enrichedOrders;
  } catch (error) {
    throw error;
  }
};

export const getOrdersByRenterId = async (renterId) => {
  try {
    const shopDetails = await ShopDetail.findOne({ idUser: renterId });
    if (!shopDetails) {
      console.log('No shop found for this renterId');
      return [];
    }

    const products = await ProductDetail.find({ idShop: shopDetails._id }).select('_id');
    if (!products.length) {
      return [];
    }

    const productIds = products.map(p => p._id);

    const unitProducts = await UnitProduct.find({
      productId: { $in: productIds }
    }).select('_id productId');

    const unitProductIds = unitProducts.map(up => up._id);
    if (!unitProductIds.length) {
      return [];
    }

    // Thay đổi cách tìm kiếm orders
    const allOrders = await Order.find()
      .populate('customerId', '-password')
      .populate({
        path: 'products',
        model: 'UnitProduct',
        populate: {
          path: 'productId',
          model: 'ProductDetail',
          select: 'title images price idShop'
        }
      })
      .lean();
    const filteredOrders = allOrders.filter(order => {
      return order.products.some(product => {
        const productShopId = product.productId?.idShop?.toString();
        const shopId = shopDetails._id.toString();
        return productShopId === shopId;
      });
    });

    return filteredOrders;
  } catch (error) {
    console.error('Error in getOrdersByRenterId:', error);
    throw error;
  }
};

export const getOrderWithRenterDetails = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate({
      path: 'products',
      populate: {
        path: 'renterId',
        model: 'User',
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate({
        path: 'customerId',
        model: 'User',
        select: '-password'
      })
      .populate({
        path: 'products',
        model: 'UnitProduct',
        populate: {
          path: 'productId',
          model: 'ProductDetail'
        }
      });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  } catch (error) {
    throw error;
  }
};
