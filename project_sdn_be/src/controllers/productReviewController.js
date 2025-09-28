import service from '../service/productReview.service.js';
import Order from '../models/Order.js';
import UnitProduct from '../models/UnitProduct.js';
export const createProductReview = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.product || !payload.rating || !payload.content) {
            return res.status(400).json({ message: 'Missing product/rating/content' });
        }

        // Chỉ cho phép người thuê đã hoàn tất đơn hàng với sản phẩm này mới được review
        const customerId = req.authenticatedUser?.userId || req.user?._id;
        const unitIds = await UnitProduct.find({ productId: payload.product }).distinct('_id');
        const hasCompletedOrder = await Order.exists({
            customerId,
            status: 'completed',
            products: { $in: unitIds }
        });
        if (!hasCompletedOrder) {
            return res.status(403).json({ message: 'Chỉ khách đã hoàn tất đơn hàng với sản phẩm này mới được đánh giá' });
        }
        if (req.user) {
            payload.author = req.user.name || req.user.email;
            if (!payload.avatar) payload.avatar = req.user.avatar || '';
        }
        const newProductReview = await service.createProductReview(payload);
        res.status(201).json({
            message: "Category created successfully",
            metadata: newProductReview,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteProductReviewById = async (req, res) => {
    try {
        const { _id } = req.params;

        const deletedProductReview = await service.deleteProductReviewById(_id);

        if (!deletedProductReview) {
            return res.status(404).json({ message: "Product review not found" });
        }

        return res.status(200).json({
            message: `Deleted product review with id ${_id} successfully`,
            metadata: deletedProductReview
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const getAllProductReview = async (req, res) => {
    try {
        const productReviews = await service.getAllProductReview();
        if (!productReviews || productReviews.length === 0) {
            return res.status(404).json({ message: "No product reviews found" });
        }

        return res.status(200).json({
            message: "Product reviews retrieved successfully",
            metadata: productReviews,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const getProductReviewById = async (req, res) => {
    try {
        const { _id } = req.params;
        const productReview = await service.getProductReviewById(_id);

        if (!productReview) {
            return res.status(404).json({ message: "Product review not found" });
        }

        return res.status(200).json({
            message: "Product review retrieved successfully",
            metadata: productReview,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const getAllProductReviewByIdProduct = async (req, res) => {
    try {
        const { _id } = req.params;
        const productReviews = await service.getAllProductReviewByIdProduct(_id);

        if (!productReviews || productReviews.length === 0) {
            return res.status(404).json({ message: "No product reviews found for this product" });
        }

        return res.status(200).json({
            message: "Product reviews retrieved successfully",
            metadata: productReviews,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    createProductReview, deleteProductReviewById, getAllProductReview,
    getProductReviewById, getAllProductReviewByIdProduct
};
