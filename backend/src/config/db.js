import mongoose from 'mongoose';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB đã kết nối: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export default connectDB;
