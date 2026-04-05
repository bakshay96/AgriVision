import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://akshaymaliedu_db_user:akshay@cluster0.o9hauwk.mongodb.net/?appName=agri_vision_pro';

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Error:', err);
});

export default connectDB;
