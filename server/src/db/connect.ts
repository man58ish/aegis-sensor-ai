import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Fallback for local testing if env is missing
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis_telemetry';
    
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] Process ${process.pid} successfully connected to MongoDB`);
  } catch (error) {
    console.error(`[DB Error] Process ${process.pid} failed to connect:`, error);
    process.exit(1);
  }
};