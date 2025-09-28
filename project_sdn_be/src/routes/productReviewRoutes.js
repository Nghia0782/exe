import express from 'express';
import { createProductReview, deleteProductReviewById, getAllProductReview, getProductReviewById, getAllProductReviewByIdProduct } from '../controllers/productReviewController.js';
import { authorizeRoles, ensureVerifiedUser, protect } from '../middlewares/authMiddleware.js';
const router = express.Router();

// Allow authenticated renters to create reviews
router.post("/", protect, ensureVerifiedUser, createProductReview);
router.delete("/:_id", protect, ensureVerifiedUser, deleteProductReviewById);
router.get("/", getAllProductReview);
router.get("/:_id", getProductReviewById);
router.get("/product/:_id", getAllProductReviewByIdProduct);

export default router;
