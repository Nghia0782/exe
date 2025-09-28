import express from 'express';
import { ensureVerifiedUser, protect } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.delete("/", protect, ensureVerifiedUser, async (req, res) => {
    try {
        const { public_id } = req.query;

        if (!public_id) {
            return res.status(400).json({ message: "Missing public_id" });
        }
        const result = await cloudinary.uploader.destroy(public_id);
        res.json(result);
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: error.message });
    }
});
const handleUpload = async (dataURI) => {
    return cloudinary.uploader.upload(dataURI, {
    });
};

router.post("/", protect, ensureVerifiedUser, upload.single("my_file"), async (req, res) => {
    try {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const cldRes = await handleUpload(dataURI);
        res.json(cldRes);
    } catch (error) {
        res.send({ message: error.message });
    }
});
export default router;
