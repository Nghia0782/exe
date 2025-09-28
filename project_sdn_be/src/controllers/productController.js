import service from '../service/product.service.js';
import ShopDetail from '../models/ShopDetail.js';
import ProductDetail from '../models/ProductDetail.js';

export const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        
        // Handle category field - convert string to proper format
        if (productData.category && typeof productData.category === 'string') {
            // If category is a string, keep it as is (for simple categories)
            // Or you can create/find a category document and use its ObjectId
            console.log('Category as string:', productData.category);
        }
        
        const result = await service.createProduct(productData);

        res.status(201).json({
            success: true,
            message: 'Product and orders created successfully',
            data: result,
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export const createManyProduct = async (req, res) => {
    try {
        const newProductReview = await service.createManyProduct(req.body);
        res.status(201).json({
            message: "Product created successfully",
            metadata: newProductReview,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const updateProductById = async (req, res) => {
    try {
        const { _id } = req.params;
        const updateData = req.body;
        
        // Handle category field - convert string to proper format
        if (updateData.category && typeof updateData.category === 'string') {
            console.log('Update category as string:', updateData.category);
        }

        const updatedProduct = await service.updateProductById(_id, updateData);

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error" 
        });
    }
};

export const deleteProductById = async (req, res) => {
    try {
        const { _id } = req.params;

        const deletedProduct = await service.deleteProductById(_id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: `Deleted product with id ${_id} successfully`,
            metadata: deletedProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getAllProduct = async (req, res) => {
    try {
        const products = await service.getAllProduct();
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        return res.status(200).json({
            message: "Products retrieved successfully",
            metadata: products,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getAllProductAprove = async (req, res) => {
    try {
        const products = await service.getAllProductAprove();
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        return res.status(200).json({
            message: "Products retrieved successfully",
            metadata: products,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { _id } = req.params;
        const product = await service.getProductById(_id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product retrieved successfully",
            metadata: product,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllProductByIdShop = async (req, res) => {
    try {
        const { _id } = req.params;
        const products = await service.getAllProductByIdShop(_id);

        if (!products || products.length === 0) {
            return res.status(404).json({ message: "No products found for this shop" });
        }

        return res.status(200).json({
            message: "Products retrieved successfully",
            metadata: products,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get products of current authenticated user's shop
export const getMyProducts = async (req, res) => {
    try {
        const userId = req.authenticatedUser?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const shop = await ShopDetail.findOne({ idUser: userId });
        if (!shop) {
            return res.status(200).json({ message: 'OK', metadata: [] });
        }
        const products = await ProductDetail.find({ idShop: shop._id })
            .populate('idShop')
            .populate('category');
        return res.status(200).json({ message: 'OK', metadata: products });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default { createProduct, deleteProductById, getAllProduct, getProductById, getAllProductByIdShop };