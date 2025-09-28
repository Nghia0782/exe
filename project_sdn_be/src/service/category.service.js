import CategoryProduct from '../models/CategoryProduct.js';

const createCategoryService = async (data) => {
    try {
        const { name } = data;

        if (!name) {
            throw new Error("name is required");
        }

        const existingCategory = await CategoryProduct.findOne({ name: name });
        if (existingCategory) {
            throw new Error("Category already exists");
        }

        const category = await CategoryProduct.create({ name: name });
        return category;
    } catch (error) {
        throw error;
    }
};
const deleteCategoryById = async (_id) => {
    try {
        const category = await CategoryProduct.findByIdAndDelete(_id);
        return category;
    } catch (error) {
        throw error;
    }
};
const getAllCategory = async () => {
    try {
        const categories = await CategoryProduct.find();
        return categories;
    } catch (error) {
        throw error;
    }
};
const getCategoryById = async (_id) => {
    try {
        const category = await CategoryProduct.findById(_id);
        return category;
    } catch (error) {
        throw error;
    }
};
const getCategoryByIdProduct = async (_id) => {
    try {
        const category = await CategoryProduct.findOne({ idProduct: _id });
        return category;
    } catch (error) {
        throw error;
    }
};
const getAllCategoryByIdShop = async (_id) => {
    try {
        const categories = await CategoryProduct.find({ idShop: _id });
        return categories;
    } catch (error) {
        throw error;
    }
};
const getAllCategoryByIdProduct = async (_id) => {
    try {
        const categories = await CategoryProduct.find({ idProduct: _id });
        return categories;
    } catch (error) {
        throw error;
    }
};


export default {
    createCategoryService, deleteCategoryById
    , getCategoryByIdProduct, getAllCategoryByIdProduct, getAllCategoryByIdShop, getCategoryById, getAllCategory
};
