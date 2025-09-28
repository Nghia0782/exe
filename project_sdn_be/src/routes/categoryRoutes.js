import express from 'express';
import { createCategory, getCategoryById, getAllCategory } from '../controllers/categoryController.js';
const router = express.Router();

router.post("/", createCategory);
// router.delete("/:_id", deleteCategoryById);
router.get("/", getAllCategory);
router.get("/:_id", getCategoryById);
// router.get("/product/:_id", getCategoryByIdProduct);
// router.get("/store/:_id", getAllCategoryByIdShop);

export default router;
