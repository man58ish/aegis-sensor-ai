import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    // Agar Railway par database nahi hai, toh crash mat karo, sirf UI mode mein chalao
    if (!MONGO_URI) {
      console.warn(`[DB Warning Process ${process.pid}] No MONGO_URI found. Running in "Live-Only UI Mode".`);
      return; 
    }
    
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] Process ${process.pid} successfully connected to MongoDB`);
  } catch (error: any) {
    // 🚨 YAHAN process.exit(1) HATA DIYA GAYA HAI TAABI SERVER CRASH NA HO
    console.error(`[DB Error] Process ${process.pid} failed to connect:`, error.message);
    console.warn(`[DB Info] Backend will continue working without Database for UI Demo.`);
  }
};
