import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: String
}, {
    collection: 'categories',
});
export default mongoose.model('CategoryProduct', CategorySchema);
