import service from '../service/category.service.js';

export const createCategory = async (req, res) => {
    try {
        const newCategory = await service.createCategoryService(req.body);
        res.status(201).json({
            message: "Category created successfully",
            metadata: newCategory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const getAllCategory = async (req, res) => {
    try {
        const category = await service.getAllCategory();
        if (!category || category.length === 0) {
            return res.status(404).json({ message: "No category found" });
        }

        return res.status(200).json({
            message: "Category retrieved successfully",
            metadata: category,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getCategoryById = async (req, res) => {
    try {
        const { _id } = req.params;
        const category = await service.getCategoryById(_id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({
            message: "Category retrieved successfully",
            metadata: category,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default { createCategory, getCategoryById, getAllCategory };
