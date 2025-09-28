import ProductDetail from '../models/ProductDetail.js';
import ProductReview from '../models/ProductReview.js';

const createProductReview = async (data) => {
    try {
        const productReviews = await ProductReview.create(data);
        await ProductDetail.findByIdAndUpdate(
            productReviews.product,
            { $push: { reviews: productReviews._id } }
        );
        return productReviews;
    } catch (error) {
        throw error;
    }
};
const deleteProductReviewById = async (_id) => {
    try {
        const productReview = await ProductReview.findByIdAndDelete(_id);
        return productReview;
    } catch (error) {
        throw error;
    }
};
const getAllProductReview = async () => {
    try {
        const productReviews = await ProductReview.find();
        return productReviews;
    } catch (error) {
        throw error;
    }
};
const getProductReviewById = async (_id) => {
    try {
        const productReview = await ProductReview.findById(_id);
        return productReview;
    } catch (error) {
        throw error;
    }
};
const getAllProductReviewByIdProduct = async (_id) => {
    try {
        const productReviews = await ProductReview.find({ product: _id })
            .sort({ createdAt: -1 })
            .lean();
        return productReviews;
    }
    catch (error) {
        throw error;
    }
}
export default {
    createProductReview, deleteProductReviewById, getAllProductReview,
    getProductReviewById, getAllProductReviewByIdProduct
};
