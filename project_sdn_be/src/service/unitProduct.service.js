import UnitProduct from '../models/UnitProduct.js';

export const createUnitProduct = async (orderData) => {
    const newOrder = new UnitProduct(orderData);
    return await newOrder.save();
};

export const getUnitProductById = async (orderId) => {
    return await UnitProduct.findById(orderId).populate('productId');
};

export const updateUnitProductById = async (orderId, updateData) => {
    return await UnitProduct.findByIdAndUpdate(orderId, updateData, {
        new: true,
        runValidators: true,
    });
};

export const deleteUnitProductById = async (orderId) => {
    return await UnitProduct.findByIdAndDelete(orderId);
};

export const getAllUnitProducts = async () => {
    return await UnitProduct.find().populate('productId');
};
export const getUnitProductsByProductIds = async (productIds) => {
    return await UnitProduct.find({ productId: { $in: productIds } });
};
export const getUnitProductByUnitId = async (unitId) => {
    return await UnitProduct.findOne({ unitId }).populate('productId');
};
export default {
    createUnitProduct,
    getUnitProductById,
    updateUnitProductById,
    deleteUnitProductById,
    getAllUnitProducts, getUnitProductByUnitId, getUnitProductsByProductIds
};