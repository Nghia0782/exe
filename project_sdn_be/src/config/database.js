import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Cấu hình kết nối (MongoDB driver v5/Mongoose v8)
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB connected successfully");
    
    // Kiểm tra xem có hỗ trợ transactions không
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    console.log("MongoDB server status:", {
      replicaSet: serverStatus.repl?.setName || 'standalone',
      supportsTransactions: serverStatus.repl?.setName ? true : false
    });
    
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
