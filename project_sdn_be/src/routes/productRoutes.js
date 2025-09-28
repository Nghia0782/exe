import express from 'express';
import { createProduct, deleteProductById, getAllProduct, getProductById, getAllProductByIdShop, createManyProduct, getAllProductAprove, getMyProducts, updateProductById } from '../controllers/productController.js';
import { ensureVerifiedUser, protect } from '../middlewares/authMiddleware.js';
import ProductDetail from '../models/ProductDetail.js';

const router = express.Router();

router.post("/", protect, ensureVerifiedUser, createProduct);
router.post("/createMany", protect, ensureVerifiedUser, createManyProduct);
router.put("/:_id", protect, ensureVerifiedUser, updateProductById);
router.delete("/:_id", protect, ensureVerifiedUser, deleteProductById);
router.get("/", getAllProduct);
router.get("/approved", getAllProductAprove);
router.get('/my-products', protect, getMyProducts);

// Count endpoint - must be before /:id route
router.get('/count', async (req, res) => {
  try {
    const count = await ProductDetail.countDocuments();
    res.json({ data: { count } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Search / filter / sort
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, location, sort } = req.query;
    const filter = {};
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (location) {
      filter.location = location;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { _id: -1 },
      name_asc: { title: 1 },
      name_desc: { title: -1 },
    };
    const sortOption = sortMap[sort] || { _id: -1 };
    const results = await ProductDetail.find(filter)
      .populate('idShop')
      .populate('category')
      .sort(sortOption);
    res.json({ message: 'OK', metadata: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:_id", getProductById);
router.get("/store/:_id", getAllProductByIdShop);

export default router;
